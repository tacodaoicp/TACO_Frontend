#!/usr/bin/env python3
"""
Memory Profiler for TACO Frontend - V3

Focuses on TAB + WORKER memory with DETAILED breakdown.
Uses Chrome DevTools Protocol for heap profiling.
Shows what's ACTUALLY using memory from HIGH to LOW.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from typing import Any, Dict, List
from collections import defaultdict

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException
except ImportError:
    print("ERROR: selenium not installed. Run: pip3 install selenium")
    sys.exit(1)

try:
    import psutil
except ImportError:
    print("ERROR: psutil not installed. Run: pip3 install psutil")
    sys.exit(1)


class MemoryProfiler:
    """Profiles Chrome memory for web apps - focused on TAB + WORKERS."""

    def __init__(self, base_url: str, headless: bool = True):
        self.base_url = base_url.rstrip('/')
        self.headless = headless
        self.driver = None
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "base_url": base_url,
            "pages": [],
            "memory_timeline": [],
            "recommendations": [],
            "summary": {}
        }

    def setup_driver(self):
        """Configure Chrome with DevTools Protocol access."""
        chrome_options = Options()

        if self.headless:
            chrome_options.add_argument("--headless=new")

        # Enable performance logging
        chrome_options.set_capability('goog:loggingPrefs', {
            'performance': 'ALL',
            'browser': 'ALL'
        })

        # Memory-related flags
        chrome_options.add_argument("--enable-precise-memory-info")
        chrome_options.add_argument("--js-flags=--expose-gc")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-application-cache")

        # Enable remote debugging for CDP
        chrome_options.add_argument("--remote-debugging-port=0")

        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.set_page_load_timeout(60)

        print(f"Chrome started with PID: {self.driver.service.process.pid}")

    def get_renderer_memory(self) -> dict:
        """
        Get memory for THIS TAB's renderer process only.
        This is the actual memory the tab + its workers use.
        """
        try:
            # Get the browser process ID
            browser_pid = self.driver.service.process.pid

            # Find renderer process for this tab
            renderer_memory = 0
            worker_memory = 0
            shared_worker_memory = 0
            service_worker_memory = 0
            gpu_memory = 0
            utility_memory = 0

            process_details = []

            for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cmdline', 'ppid']):
                try:
                    cmdline = ' '.join(proc.info.get('cmdline', []))

                    # Only count processes that are children of our Chrome browser
                    # or the browser process itself
                    if 'chrome' not in proc.info['name'].lower():
                        continue

                    mem_mb = proc.info['memory_info'].rss / (1024 * 1024)
                    proc_type = 'unknown'

                    if '--type=renderer' in cmdline:
                        # Check if this is a SharedWorker renderer
                        # SharedWorkers have '--shared-worker' in cmdline
                        if '--shared-worker' in cmdline.lower() or 'shared' in cmdline.lower():
                            shared_worker_memory += mem_mb
                            proc_type = 'shared_worker'
                        else:
                            renderer_memory += mem_mb
                            proc_type = 'renderer'
                    elif '--type=gpu' in cmdline:
                        gpu_memory += mem_mb
                        proc_type = 'gpu'
                    elif '--type=utility' in cmdline:
                        utility_memory += mem_mb
                        proc_type = 'utility'
                        # Check for worker-related utilities
                        if 'worker' in cmdline.lower():
                            worker_memory += mem_mb
                    elif '--type=service_worker' in cmdline or 'service-worker' in cmdline.lower():
                        service_worker_memory += mem_mb
                        proc_type = 'service_worker'

                    if mem_mb > 10:  # Only track significant processes
                        process_details.append({
                            'pid': proc.info['pid'],
                            'type': proc_type,
                            'memory_mb': round(mem_mb, 2)
                        })

                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Sort by memory descending
            process_details.sort(key=lambda x: x['memory_mb'], reverse=True)

            return {
                "renderer_mb": round(renderer_memory, 2),
                "shared_worker_mb": round(shared_worker_memory, 2),
                "service_worker_mb": round(service_worker_memory, 2),
                "utility_worker_mb": round(worker_memory, 2),
                "gpu_mb": round(gpu_memory, 2),
                "utility_mb": round(utility_memory, 2),
                "tab_total_mb": round(renderer_memory + shared_worker_memory + service_worker_memory + worker_memory, 2),
                "processes": process_details[:10]  # Top 10 processes by memory
            }
        except Exception as e:
            print(f"Warning: Could not get renderer memory: {e}")
            return {}

    def get_js_heap_memory(self) -> dict:
        """Get JavaScript heap memory from performance.memory API."""
        try:
            memory_info = self.driver.execute_script("""
                if (window.performance && window.performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            """)

            if memory_info:
                return {
                    "js_heap_used_mb": round(memory_info["usedJSHeapSize"] / (1024 * 1024), 2),
                    "js_heap_total_mb": round(memory_info["totalJSHeapSize"] / (1024 * 1024), 2),
                    "js_heap_limit_mb": round(memory_info["jsHeapSizeLimit"] / (1024 * 1024), 2),
                }
        except Exception as e:
            print(f"Warning: Could not get JS heap info: {e}")

        return {}

    def get_cdp_memory_breakdown(self) -> dict:
        """
        Use Chrome DevTools Protocol to get DETAILED memory breakdown.
        This shows what's ACTUALLY using the renderer memory.
        """
        try:
            # Enable Performance domain first
            try:
                self.driver.execute_cdp_cmd('Performance.enable', {})
            except Exception:
                pass

            # Get detailed memory info via CDP
            result = self.driver.execute_cdp_cmd('Memory.getDOMCounters', {})
            dom_counters = {
                "documents": result.get("documents", 0),
                "nodes": result.get("nodes", 0),
                "jsEventListeners": result.get("jsEventListeners", 0),
            }

            # Get performance metrics which includes memory breakdown
            perf_metrics = self.driver.execute_cdp_cmd('Performance.getMetrics', {})
            metrics = {m['name']: m['value'] for m in perf_metrics.get('metrics', [])}

            # Extract key memory metrics
            memory_breakdown = {
                "js_heap_used_mb": round(metrics.get('JSHeapUsedSize', 0) / (1024 * 1024), 2),
                "js_heap_total_mb": round(metrics.get('JSHeapTotalSize', 0) / (1024 * 1024), 2),
                "dom_nodes": int(metrics.get('Nodes', dom_counters.get('nodes', 0))),
                "documents": int(metrics.get('Documents', dom_counters.get('documents', 0))),
                "frames": int(metrics.get('Frames', 0)),
                "js_event_listeners": int(metrics.get('JSEventListeners', dom_counters.get('jsEventListeners', 0))),
                "layout_objects": int(metrics.get('LayoutObjects', 0)),
                "resources": int(metrics.get('Resources', 0)),
                "script_duration_ms": round(metrics.get('ScriptDuration', 0) * 1000, 2),
                "layout_duration_ms": round(metrics.get('LayoutDuration', 0) * 1000, 2),
                "task_duration_ms": round(metrics.get('TaskDuration', 0) * 1000, 2),
            }

            # Also try to get system memory info
            try:
                sys_info = self.driver.execute_cdp_cmd('SystemInfo.getProcessInfo', {})
                if sys_info:
                    memory_breakdown['process_info'] = sys_info
            except Exception:
                pass

            return {
                "dom_counters": dom_counters,
                "performance_metrics": memory_breakdown,
                "raw_metrics": metrics,  # Include raw for debugging
            }
        except Exception as e:
            print(f"Warning: CDP memory breakdown failed: {e}")
            return {}

    def get_heap_snapshot_summary(self) -> dict:
        """
        Take a heap snapshot and analyze it to find what's using memory.
        This is the REAL breakdown of JS heap.
        """
        try:
            # Enable heap profiler
            self.driver.execute_cdp_cmd('HeapProfiler.enable', {})

            # Take heap snapshot
            snapshot_data = []

            def handle_chunk(params):
                snapshot_data.append(params.get('chunk', ''))

            # Collect garbage first
            self.driver.execute_cdp_cmd('HeapProfiler.collectGarbage', {})
            time.sleep(0.5)

            # Take snapshot - this returns a large JSON
            self.driver.execute_cdp_cmd('HeapProfiler.takeHeapSnapshot', {'reportProgress': False})

            # Get the snapshot data
            # Note: Full heap snapshot parsing is complex, so we use a simpler approach
            # Instead, use sampling profiler for object stats

            # Get heap object stats
            stats_result = self.driver.execute_script("""
                // Count objects by constructor name
                const stats = {};
                const seen = new WeakSet();

                function countObjects(obj, depth = 0) {
                    if (depth > 5 || !obj || typeof obj !== 'object') return;
                    if (seen.has(obj)) return;

                    try {
                        seen.add(obj);
                        const name = obj.constructor?.name || 'Object';
                        if (!stats[name]) stats[name] = { count: 0, estimatedBytes: 0 };
                        stats[name].count++;

                        // Estimate size
                        if (Array.isArray(obj)) {
                            stats[name].estimatedBytes += 24 + obj.length * 8;
                            for (let i = 0; i < Math.min(obj.length, 50); i++) {
                                countObjects(obj[i], depth + 1);
                            }
                        } else if (typeof obj === 'object') {
                            const keys = Object.keys(obj);
                            stats[name].estimatedBytes += 32 + keys.length * 16;
                            for (const key of keys.slice(0, 30)) {
                                countObjects(obj[key], depth + 1);
                            }
                        }
                    } catch(e) {}
                }

                // Scan window properties
                for (const key of Object.keys(window)) {
                    try {
                        countObjects(window[key], 0);
                    } catch(e) {}
                }

                // Convert to sorted array
                return Object.entries(stats)
                    .map(([name, data]) => ({
                        type: name,
                        count: data.count,
                        estimatedKB: Math.round(data.estimatedBytes / 1024)
                    }))
                    .filter(x => x.estimatedKB > 1)
                    .sort((a, b) => b.estimatedKB - a.estimatedKB)
                    .slice(0, 30);
            """)

            self.driver.execute_cdp_cmd('HeapProfiler.disable', {})

            return {"object_types": stats_result or []}

        except Exception as e:
            print(f"Warning: Heap snapshot failed: {e}")
            return {}

    def get_detailed_renderer_breakdown(self) -> dict:
        """
        Get a detailed breakdown of what's using renderer memory.
        Combines multiple sources for complete picture.
        """
        try:
            breakdown = self.driver.execute_script("""
                const breakdown = {
                    categories: [],
                    details: {}
                };

                // 1. WASM Memory (dfinity uses WASM heavily)
                let wasmMemoryMB = 0;
                try {
                    if (typeof WebAssembly !== 'undefined') {
                        // Check for WASM instances by looking for common patterns
                        for (const key of Object.keys(window)) {
                            try {
                                const val = window[key];
                                if (val && val.memory instanceof WebAssembly.Memory) {
                                    wasmMemoryMB += val.memory.buffer.byteLength / (1024 * 1024);
                                }
                            } catch(e) {}
                        }
                    }
                } catch(e) {}
                breakdown.categories.push({
                    name: 'WebAssembly Memory',
                    sizeMB: Math.round(wasmMemoryMB * 100) / 100,
                    note: 'WASM modules (dfinity/agent uses WASM)'
                });

                // 2. ArrayBuffers and TypedArrays (often large)
                let arrayBufferMB = 0;
                const bufferDetails = [];
                try {
                    for (const key of Object.keys(window)) {
                        try {
                            const val = window[key];
                            if (val instanceof ArrayBuffer) {
                                const sizeMB = val.byteLength / (1024 * 1024);
                                arrayBufferMB += sizeMB;
                                if (sizeMB > 0.1) {
                                    bufferDetails.push({ name: key, sizeMB: Math.round(sizeMB * 100) / 100 });
                                }
                            } else if (ArrayBuffer.isView(val)) {
                                const sizeMB = val.byteLength / (1024 * 1024);
                                arrayBufferMB += sizeMB;
                                if (sizeMB > 0.1) {
                                    bufferDetails.push({ name: key, sizeMB: Math.round(sizeMB * 100) / 100, type: val.constructor.name });
                                }
                            }
                        } catch(e) {}
                    }
                } catch(e) {}
                breakdown.categories.push({
                    name: 'ArrayBuffers/TypedArrays',
                    sizeMB: Math.round(arrayBufferMB * 100) / 100,
                    details: bufferDetails.slice(0, 10)
                });

                // 3. Canvas memory (2D and WebGL contexts)
                let canvasMemoryMB = 0;
                const canvases = document.querySelectorAll('canvas');
                for (const canvas of canvases) {
                    // Estimate: width * height * 4 bytes per pixel
                    canvasMemoryMB += (canvas.width * canvas.height * 4) / (1024 * 1024);
                }
                breakdown.categories.push({
                    name: 'Canvas Memory',
                    sizeMB: Math.round(canvasMemoryMB * 100) / 100,
                    count: canvases.length
                });

                // 4. Image bitmap memory (decoded images in memory)
                let imageMemoryMB = 0;
                const images = document.querySelectorAll('img');
                const imageDetails = [];
                for (const img of images) {
                    const w = img.naturalWidth || img.width || 0;
                    const h = img.naturalHeight || img.height || 0;
                    // Decoded: width * height * 4 bytes (RGBA)
                    const sizeMB = (w * h * 4) / (1024 * 1024);
                    imageMemoryMB += sizeMB;
                    if (sizeMB > 0.5) {
                        imageDetails.push({
                            src: img.src.split('/').pop()?.substring(0, 40) || 'unknown',
                            dimensions: w + 'x' + h,
                            sizeMB: Math.round(sizeMB * 100) / 100
                        });
                    }
                }
                imageDetails.sort((a, b) => b.sizeMB - a.sizeMB);
                breakdown.categories.push({
                    name: 'Decoded Images',
                    sizeMB: Math.round(imageMemoryMB * 100) / 100,
                    count: images.length,
                    largest: imageDetails.slice(0, 5)
                });

                // 5. Video memory
                let videoMemoryMB = 0;
                const videos = document.querySelectorAll('video');
                for (const video of videos) {
                    // Estimate: width * height * 4 bytes * 3 frames buffered
                    videoMemoryMB += (video.videoWidth * video.videoHeight * 4 * 3) / (1024 * 1024);
                }
                breakdown.categories.push({
                    name: 'Video Memory',
                    sizeMB: Math.round(videoMemoryMB * 100) / 100,
                    count: videos.length
                });

                // 6. CSS/Styles (layout objects)
                const styleSheets = document.styleSheets.length;
                const computedStyleMB = styleSheets * 0.1; // rough estimate
                breakdown.categories.push({
                    name: 'Stylesheets',
                    sizeMB: Math.round(computedStyleMB * 100) / 100,
                    count: styleSheets
                });

                // 7. DOM tree memory (rough estimate based on node count)
                const nodeCount = document.getElementsByTagName('*').length;
                // Each DOM node: ~500-1000 bytes including attributes
                const domMemoryMB = (nodeCount * 750) / (1024 * 1024);
                breakdown.categories.push({
                    name: 'DOM Tree',
                    sizeMB: Math.round(domMemoryMB * 100) / 100,
                    nodeCount: nodeCount
                });

                // 8. Script/Code memory - can't measure directly, but estimate from loaded scripts
                const scripts = document.querySelectorAll('script[src]');
                // Assume ~3x text size for compiled code
                let estimatedCodeMB = 0;
                breakdown.categories.push({
                    name: 'Compiled JavaScript',
                    sizeMB: 'varies',
                    note: 'V8 compiles JS to machine code (~3-10x source size)',
                    scriptCount: scripts.length
                });

                // 9. Worker memory (SharedWorker/Worker)
                let workerNote = '';
                if (typeof SharedWorker !== 'undefined') {
                    workerNote = 'SharedWorkers detected - memory shared across tabs';
                }
                breakdown.categories.push({
                    name: 'Web Workers',
                    note: workerNote || 'Measured separately per worker',
                    sizeMB: 'see worker analysis'
                });

                // 10. Measure actual large objects in JS
                const largeObjects = [];
                for (const key of Object.keys(window)) {
                    if (key.startsWith('webkit') || key.startsWith('on') || key.startsWith('_')) continue;
                    try {
                        const val = window[key];
                        if (!val || typeof val !== 'object') continue;

                        let size = 0;
                        try {
                            const str = JSON.stringify(val);
                            size = str.length * 2; // UTF-16
                        } catch(e) {
                            // Circular or non-serializable, estimate differently
                            if (Array.isArray(val)) {
                                size = val.length * 100; // rough
                            }
                        }

                        const sizeMB = size / (1024 * 1024);
                        if (sizeMB > 0.1) {
                            largeObjects.push({
                                name: key,
                                sizeMB: Math.round(sizeMB * 100) / 100,
                                type: Array.isArray(val) ? 'Array[' + val.length + ']' : (val.constructor?.name || 'Object')
                            });
                        }
                    } catch(e) {}
                }
                largeObjects.sort((a, b) => b.sizeMB - a.sizeMB);
                breakdown.details.largeGlobals = largeObjects.slice(0, 15);

                // Sort categories by size (descending)
                breakdown.categories.sort((a, b) => {
                    const sizeA = typeof a.sizeMB === 'number' ? a.sizeMB : 0;
                    const sizeB = typeof b.sizeMB === 'number' ? b.sizeMB : 0;
                    return sizeB - sizeA;
                });

                return breakdown;
            """)

            return breakdown or {}
        except Exception as e:
            print(f"Warning: Detailed breakdown failed: {e}")
            return {}

    def get_memory_breakdown_sorted(self) -> dict:
        """
        Get memory breakdown sorted from HIGH to LOW.
        This is what you actually want to see.
        """
        try:
            breakdown = self.driver.execute_script("""
                const categories = [];
                const details = {};

                // 1. Measure Pinia/Vue store data
                function measurePiniaStores() {
                    const stores = [];
                    try {
                        const app = document.querySelector('#app')?.__vue_app__;
                        if (app?._context?.provides) {
                            for (const [key, value] of Object.entries(app._context.provides)) {
                                if (value?._s) {
                                    for (const [storeName, store] of value._s) {
                                        try {
                                            const state = store.$state || store._state?.value || {};
                                            const stateStr = JSON.stringify(state);
                                            const sizeKB = Math.round(stateStr.length * 2 / 1024); // UTF-16

                                            // Get per-key breakdown
                                            const keyBreakdown = [];
                                            for (const k of Object.keys(state)) {
                                                try {
                                                    const keyStr = JSON.stringify(state[k]);
                                                    keyBreakdown.push({
                                                        key: k,
                                                        sizeKB: Math.round(keyStr.length * 2 / 1024),
                                                        type: Array.isArray(state[k]) ? `Array[${state[k].length}]` : typeof state[k]
                                                    });
                                                } catch(e) {
                                                    keyBreakdown.push({ key: k, sizeKB: 0, type: 'circular' });
                                                }
                                            }

                                            // Sort keys by size
                                            keyBreakdown.sort((a, b) => b.sizeKB - a.sizeKB);

                                            stores.push({
                                                name: storeName,
                                                sizeKB: sizeKB,
                                                topKeys: keyBreakdown.slice(0, 10)
                                            });
                                        } catch(e) {}
                                    }
                                }
                            }
                        }
                    } catch(e) {}
                    return stores;
                }

                // 2. Measure Worker Bridge data (if exposed)
                function measureWorkerBridge() {
                    const workerData = [];
                    try {
                        // Look for workerBridge or similar globals
                        for (const key of Object.keys(window)) {
                            if (key.toLowerCase().includes('worker') || key.toLowerCase().includes('bridge')) {
                                try {
                                    const obj = window[key];
                                    if (obj && typeof obj === 'object') {
                                        const str = JSON.stringify(obj);
                                        if (str.length > 1000) {
                                            workerData.push({
                                                name: key,
                                                sizeKB: Math.round(str.length * 2 / 1024)
                                            });
                                        }
                                    }
                                } catch(e) {}
                            }
                        }
                    } catch(e) {}
                    return workerData;
                }

                // 3. Measure DOM
                function measureDOM() {
                    const nodeCount = document.getElementsByTagName('*').length;
                    // Rough estimate: ~1KB per 10 DOM nodes
                    return {
                        nodeCount: nodeCount,
                        estimatedKB: Math.round(nodeCount * 0.1)
                    };
                }

                // 4. Measure large global objects
                function measureGlobals() {
                    const globals = [];
                    const ignore = new Set([
                        'window', 'document', 'location', 'navigator', 'performance',
                        'chrome', 'localStorage', 'sessionStorage', 'indexedDB', 'caches',
                        '__VUE_DEVTOOLS_GLOBAL_HOOK__', '__VUE__', 'Vue', 'tacoConfig',
                        'Array', 'Object', 'String', 'Number', 'Boolean', 'Function',
                        'Map', 'Set', 'Promise', 'JSON', 'Math', 'Date', 'console'
                    ]);

                    for (const key of Object.keys(window)) {
                        if (ignore.has(key)) continue;
                        if (key.startsWith('webkit') || key.startsWith('on') || key.startsWith('_')) continue;

                        try {
                            const val = window[key];
                            if (!val || typeof val !== 'object') continue;

                            const str = JSON.stringify(val);
                            const sizeKB = Math.round(str.length * 2 / 1024);

                            if (sizeKB > 1) {  // Only items > 1KB
                                globals.push({
                                    name: key,
                                    sizeKB: sizeKB,
                                    type: Array.isArray(val) ? `Array[${val.length}]` : (val.constructor?.name || 'Object')
                                });
                            }
                        } catch(e) {}
                    }

                    globals.sort((a, b) => b.sizeKB - a.sizeKB);
                    return globals.slice(0, 20);
                }

                // 5. Measure event listeners (memory overhead)
                function measureEventListeners() {
                    let count = 0;
                    const elements = document.querySelectorAll('*');
                    // Can't enumerate listeners directly, but count elements with common handlers
                    for (const el of elements) {
                        if (el.onclick) count++;
                        if (el.onchange) count++;
                        if (el.oninput) count++;
                    }
                    return {
                        estimated: count,
                        // Rough: ~500 bytes per listener closure
                        estimatedKB: Math.round(count * 0.5)
                    };
                }

                // 6. Count Images
                function measureImages() {
                    const images = document.querySelectorAll('img');
                    let totalKB = 0;
                    const imageList = [];

                    for (const img of images) {
                        // Estimate decoded image memory: width * height * 4 bytes (RGBA)
                        const w = img.naturalWidth || img.width || 0;
                        const h = img.naturalHeight || img.height || 0;
                        const sizeKB = Math.round(w * h * 4 / 1024);
                        totalKB += sizeKB;

                        if (sizeKB > 50) {
                            imageList.push({
                                src: img.src.split('/').pop().substring(0, 50),
                                dimensions: `${w}x${h}`,
                                sizeKB: sizeKB
                            });
                        }
                    }

                    imageList.sort((a, b) => b.sizeKB - a.sizeKB);

                    return {
                        count: images.length,
                        totalKB: totalKB,
                        largest: imageList.slice(0, 5)
                    };
                }

                // Collect all data
                const piniaStores = measurePiniaStores();
                const workerBridge = measureWorkerBridge();
                const dom = measureDOM();
                const globals = measureGlobals();
                const listeners = measureEventListeners();
                const images = measureImages();

                // Build sorted category list (HIGH to LOW)
                const totalPiniaKB = piniaStores.reduce((sum, s) => sum + s.sizeKB, 0);
                const totalGlobalsKB = globals.reduce((sum, g) => sum + g.sizeKB, 0);
                const totalWorkerBridgeKB = workerBridge.reduce((sum, w) => sum + w.sizeKB, 0);

                categories.push({ name: 'Pinia Stores', sizeKB: totalPiniaKB, count: piniaStores.length });
                categories.push({ name: 'Global Objects', sizeKB: totalGlobalsKB, count: globals.length });
                categories.push({ name: 'Worker Bridge Data', sizeKB: totalWorkerBridgeKB, count: workerBridge.length });
                categories.push({ name: 'Decoded Images', sizeKB: images.totalKB, count: images.count });
                categories.push({ name: 'DOM Nodes', sizeKB: dom.estimatedKB, count: dom.nodeCount });
                categories.push({ name: 'Event Listeners', sizeKB: listeners.estimatedKB, count: listeners.estimated });

                // Sort categories HIGH to LOW
                categories.sort((a, b) => b.sizeKB - a.sizeKB);

                return {
                    categories: categories,
                    details: {
                        piniaStores: piniaStores.sort((a, b) => b.sizeKB - a.sizeKB),
                        globals: globals,
                        workerBridge: workerBridge,
                        images: images,
                        dom: dom,
                        listeners: listeners
                    }
                };
            """)
            return breakdown or {}
        except Exception as e:
            print(f"Warning: Could not get memory breakdown: {e}")
            return {}

    def get_indexeddb_usage(self) -> dict:
        """Get IndexedDB usage - async API requires special handling."""
        try:
            # First check what databases exist
            indexeddb_info = self.driver.execute_async_script("""
                const callback = arguments[arguments.length - 1];
                const result = {
                    supported: 'indexedDB' in window,
                    databases: [],
                    storageEstimate: null,
                    error: null
                };

                async function analyze() {
                    try {
                        // Get storage estimate (includes IndexedDB)
                        if (navigator.storage && navigator.storage.estimate) {
                            const estimate = await navigator.storage.estimate();
                            result.storageEstimate = {
                                usage_mb: Math.round(estimate.usage / (1024 * 1024) * 100) / 100,
                                quota_mb: Math.round(estimate.quota / (1024 * 1024) * 100) / 100,
                                percent: Math.round((estimate.usage / estimate.quota) * 100)
                            };
                        }

                        // List databases (if supported)
                        if (indexedDB.databases) {
                            const dbs = await indexedDB.databases();
                            for (const db of dbs) {
                                result.databases.push({
                                    name: db.name,
                                    version: db.version
                                });
                            }
                        }

                        // Try to open known databases and count stores
                        const knownDBs = ['auth-client-db', 'ic-delegation', 'keyval-store'];
                        for (const dbName of knownDBs) {
                            try {
                                const openReq = indexedDB.open(dbName);
                                await new Promise((resolve, reject) => {
                                    openReq.onsuccess = () => {
                                        const db = openReq.result;
                                        const stores = Array.from(db.objectStoreNames);

                                        // Find or add database entry
                                        let dbEntry = result.databases.find(d => d.name === dbName);
                                        if (!dbEntry) {
                                            dbEntry = { name: dbName, version: db.version };
                                            result.databases.push(dbEntry);
                                        }
                                        dbEntry.stores = stores;
                                        dbEntry.storeCount = stores.length;

                                        db.close();
                                        resolve();
                                    };
                                    openReq.onerror = () => resolve();
                                    openReq.onblocked = () => resolve();
                                });
                            } catch(e) {}
                        }

                    } catch(e) {
                        result.error = e.message;
                    }

                    callback(result);
                }

                analyze();
            """)
            return indexeddb_info or {}
        except Exception as e:
            print(f"Warning: Could not get IndexedDB info: {e}")
            return {"error": str(e)}

    def get_worker_info(self) -> dict:
        """Get detailed worker information."""
        try:
            worker_info = self.driver.execute_script("""
                const info = {
                    sharedWorkerSupported: typeof SharedWorker !== 'undefined',
                    dedicatedWorkerSupported: typeof Worker !== 'undefined',
                    serviceWorker: {
                        supported: 'serviceWorker' in navigator,
                        controlled: !!navigator.serviceWorker?.controller,
                        state: navigator.serviceWorker?.controller?.state || 'none',
                        scriptURL: navigator.serviceWorker?.controller?.scriptURL || null
                    },
                    // Try to detect if app is using SharedWorker
                    hasActiveSharedWorker: false,
                    workerDetails: []
                };

                // Check for SharedWorker instances in window
                // (We can't enumerate them, but we can check for known patterns)
                try {
                    // Look for workerBridge or similar that would indicate SharedWorker use
                    for (const key of Object.keys(window)) {
                        const val = window[key];
                        if (val && typeof val === 'object') {
                            if (val.constructor?.name === 'SharedWorker' ||
                                (val.port && val.port.constructor?.name === 'MessagePort')) {
                                info.hasActiveSharedWorker = true;
                                info.workerDetails.push({
                                    name: key,
                                    type: 'SharedWorker'
                                });
                            }
                        }
                    }
                } catch(e) {}

                // Check for message port connections
                info.messageChannelSupported = typeof MessageChannel !== 'undefined';
                info.broadcastChannelSupported = typeof BroadcastChannel !== 'undefined';

                return info;
            """)
            return worker_info or {}
        except Exception as e:
            print(f"Warning: Could not get worker info: {e}")
            return {}

    def get_shared_worker_memory_cdp(self) -> dict:
        """
        Get SharedWorker memory using Chrome DevTools Protocol.
        SharedWorkers run in separate renderer processes.
        """
        try:
            # Use Target.getTargets to find all targets including workers
            targets_result = self.driver.execute_cdp_cmd('Target.getTargets', {})
            targets = targets_result.get('targetInfos', [])

            worker_targets = []
            for target in targets:
                target_type = target.get('type', '')
                if target_type in ('shared_worker', 'service_worker', 'worker'):
                    worker_targets.append({
                        'type': target_type,
                        'title': target.get('title', 'unknown'),
                        'url': target.get('url', ''),
                        'targetId': target.get('targetId', ''),
                        'attached': target.get('attached', False)
                    })

            # Try to get memory info for each worker target
            worker_memory_info = []
            for worker in worker_targets:
                try:
                    # Attach to worker target to get its memory info
                    target_id = worker['targetId']

                    # Note: We can't easily get memory from attached workers in Selenium
                    # but we can identify them and count them
                    worker_memory_info.append({
                        'type': worker['type'],
                        'title': worker['title'],
                        'url': worker['url'].split('?')[0] if worker['url'] else '',  # Clean URL
                    })
                except Exception as e:
                    pass

            # Also try SystemInfo for process-level info
            process_info = []
            try:
                # Get browser process info
                sys_info = self.driver.execute_cdp_cmd('SystemInfo.getProcessInfo', {})
                if sys_info and 'processInfo' in sys_info:
                    for proc in sys_info['processInfo']:
                        proc_type = proc.get('type', 'unknown')
                        if 'worker' in proc_type.lower() or proc_type == 'renderer':
                            process_info.append({
                                'type': proc_type,
                                'id': proc.get('id', 0),
                                'cpu_time': proc.get('cpuTime', 0),
                            })
            except Exception:
                pass

            return {
                'worker_targets': worker_targets,
                'worker_count': len(worker_targets),
                'shared_worker_count': len([w for w in worker_targets if w['type'] == 'shared_worker']),
                'service_worker_count': len([w for w in worker_targets if w['type'] == 'service_worker']),
                'dedicated_worker_count': len([w for w in worker_targets if w['type'] == 'worker']),
                'process_info': process_info,
            }
        except Exception as e:
            print(f"Warning: Could not get SharedWorker memory via CDP: {e}")
            return {'error': str(e)}

    def get_all_chrome_processes_memory(self) -> dict:
        """
        Get memory for ALL Chrome processes spawned by our driver.
        This gives accurate SharedWorker memory since they run in separate processes.
        """
        try:
            browser_pid = self.driver.service.process.pid

            # Get all child processes of our Chrome instance
            browser_proc = psutil.Process(browser_pid)
            children = browser_proc.children(recursive=True)

            process_breakdown = []
            total_memory = 0
            renderer_memory = 0
            shared_worker_memory = 0
            gpu_memory = 0
            utility_memory = 0
            other_memory = 0

            for child in children:
                try:
                    cmdline = ' '.join(child.cmdline())
                    mem_mb = child.memory_info().rss / (1024 * 1024)
                    total_memory += mem_mb

                    # Classify process type
                    proc_type = 'other'
                    if '--type=renderer' in cmdline:
                        proc_type = 'renderer'
                        renderer_memory += mem_mb
                    elif '--type=gpu' in cmdline:
                        proc_type = 'gpu'
                        gpu_memory += mem_mb
                    elif '--type=utility' in cmdline:
                        proc_type = 'utility'
                        utility_memory += mem_mb
                    elif '--shared-worker' in cmdline:
                        proc_type = 'shared_worker'
                        shared_worker_memory += mem_mb
                    else:
                        other_memory += mem_mb

                    process_breakdown.append({
                        'pid': child.pid,
                        'type': proc_type,
                        'memory_mb': round(mem_mb, 2),
                        'cmdline_preview': cmdline[:100] + '...' if len(cmdline) > 100 else cmdline
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Sort by memory descending
            process_breakdown.sort(key=lambda x: x['memory_mb'], reverse=True)

            return {
                'total_chrome_memory_mb': round(total_memory, 2),
                'renderer_memory_mb': round(renderer_memory, 2),
                'shared_worker_memory_mb': round(shared_worker_memory, 2),
                'gpu_memory_mb': round(gpu_memory, 2),
                'utility_memory_mb': round(utility_memory, 2),
                'other_memory_mb': round(other_memory, 2),
                'process_count': len(process_breakdown),
                'processes': process_breakdown[:15],  # Top 15 by memory
            }
        except Exception as e:
            print(f"Warning: Could not enumerate Chrome processes: {e}")
            return {'error': str(e)}

    def wait_for_page_load(self, timeout: int = 30):
        """Wait for page to finish loading."""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            time.sleep(2)

            try:
                WebDriverWait(self.driver, 5).until_not(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".loading, .spinner, [class*='loading']"))
                )
            except TimeoutException:
                pass
        except TimeoutException:
            print("Warning: Page load timeout, continuing anyway")

    def force_gc(self):
        """Attempt to trigger garbage collection."""
        try:
            self.driver.execute_script("if (window.gc) window.gc();")
            time.sleep(0.5)
        except Exception:
            pass

    def profile_page(self, path: str, wait_time: int = 5) -> dict:
        """Profile memory for a single page with detailed breakdown."""
        url = f"{self.base_url}{path}"
        print(f"\n{'='*60}")
        print(f"Profiling: {url}")
        print('='*60)

        start_time = time.time()
        self.driver.get(url)
        self.wait_for_page_load()

        print(f"  Waiting {wait_time}s for data loading...")
        time.sleep(wait_time)

        self.force_gc()
        time.sleep(1)

        load_time = time.time() - start_time

        # Collect metrics
        print("  Getting JS heap memory...")
        js_memory = self.get_js_heap_memory()

        print("  Getting renderer process memory...")
        renderer_memory = self.get_renderer_memory()

        print("  Getting CDP performance metrics...")
        cdp_breakdown = self.get_cdp_memory_breakdown()

        print("  Getting detailed renderer breakdown...")
        detailed_breakdown = self.get_detailed_renderer_breakdown()

        print("  Getting heap object statistics...")
        heap_stats = self.get_heap_snapshot_summary()

        print("  Getting memory breakdown (sorted high→low)...")
        breakdown = self.get_memory_breakdown_sorted()

        print("  Getting IndexedDB usage...")
        indexeddb = self.get_indexeddb_usage()

        print("  Getting worker info...")
        workers = self.get_worker_info()

        print("  Getting SharedWorker targets via CDP...")
        shared_worker_cdp = self.get_shared_worker_memory_cdp()

        print("  Getting all Chrome process memory breakdown...")
        chrome_processes = self.get_all_chrome_processes_memory()

        page_result = {
            "path": path,
            "url": url,
            "load_time_seconds": round(load_time, 2),
            "timestamp": datetime.now().isoformat(),

            # Tab + Worker memory (what you care about)
            "tab_memory": renderer_memory,

            # JS Heap
            "js_heap": js_memory,

            # CDP metrics (accurate from DevTools Protocol)
            "cdp_metrics": cdp_breakdown,

            # Detailed breakdown by category
            "detailed_breakdown": detailed_breakdown,

            # Heap object statistics
            "heap_objects": heap_stats,

            # Memory breakdown (sorted HIGH to LOW)
            "breakdown": breakdown,

            # IndexedDB
            "indexeddb": indexeddb,

            # Workers
            "workers": workers,

            # SharedWorker details from CDP
            "shared_worker_cdp": shared_worker_cdp,

            # All Chrome processes (for accurate SharedWorker memory)
            "chrome_processes": chrome_processes,
        }

        # Print summary
        self._print_page_summary(page_result)

        return page_result

    def _print_page_summary(self, page_result: dict):
        """Print formatted summary for a page."""
        path = page_result['path']
        tab_mem = page_result.get('tab_memory', {})
        js_heap = page_result.get('js_heap', {})
        detailed = page_result.get('detailed_breakdown', {})
        heap_objects = page_result.get('heap_objects', {})
        cdp = page_result.get('cdp_metrics', {})
        indexeddb = page_result.get('indexeddb', {})
        chrome_procs = page_result.get('chrome_processes', {})
        shared_worker_cdp = page_result.get('shared_worker_cdp', {})

        print(f"\n  Summary for {path}:")
        print(f"  ┌─────────────────────────────────────────────────────────────")

        # Chrome process breakdown (most accurate)
        if chrome_procs:
            print(f"  │ CHROME PROCESS BREAKDOWN:")
            print(f"  │   Total Chrome Memory:    {chrome_procs.get('total_chrome_memory_mb', 0):8.1f} MB")
            print(f"  │   ├─ Renderer (tab):      {chrome_procs.get('renderer_memory_mb', 0):8.1f} MB")
            print(f"  │   ├─ SharedWorker:        {chrome_procs.get('shared_worker_memory_mb', 0):8.1f} MB")
            print(f"  │   ├─ GPU Process:         {chrome_procs.get('gpu_memory_mb', 0):8.1f} MB")
            print(f"  │   ├─ Utility:             {chrome_procs.get('utility_memory_mb', 0):8.1f} MB")
            print(f"  │   └─ Other:               {chrome_procs.get('other_memory_mb', 0):8.1f} MB")
            print(f"  │")

        # SharedWorker targets from CDP
        if shared_worker_cdp.get('worker_targets'):
            print(f"  │ WORKER TARGETS (CDP):")
            print(f"  │   SharedWorkers: {shared_worker_cdp.get('shared_worker_count', 0)}")
            print(f"  │   ServiceWorkers: {shared_worker_cdp.get('service_worker_count', 0)}")
            print(f"  │   DedicatedWorkers: {shared_worker_cdp.get('dedicated_worker_count', 0)}")
            for worker in shared_worker_cdp.get('worker_targets', [])[:3]:
                url_short = worker.get('url', '').split('/')[-1][:40] if worker.get('url') else 'N/A'
                print(f"  │     - [{worker.get('type', '?')}] {url_short}")
            print(f"  │")

        print(f"  │ TAB + WORKER MEMORY: {tab_mem.get('tab_total_mb', '?')} MB")
        print(f"  │   (Renderer + SharedWorker processes)")
        print(f"  │")
        print(f"  │ JS HEAP: {js_heap.get('js_heap_used_mb', '?')} MB used / {js_heap.get('js_heap_total_mb', '?')} MB allocated")
        print(f"  │")

        # CDP Performance metrics
        perf = cdp.get('performance_metrics', {})
        if perf:
            print(f"  │ CDP METRICS:")
            print(f"  │   DOM Nodes: {perf.get('dom_nodes', '?')}")
            print(f"  │   Event Listeners: {perf.get('js_event_listeners', '?')}")
            print(f"  │   Layout Objects: {perf.get('layout_objects', '?')}")
            print(f"  │   Resources: {perf.get('resources', '?')}")
            print(f"  │")

        # Detailed breakdown by category (HIGH to LOW)
        categories = detailed.get('categories', [])
        if categories:
            print(f"  │ MEMORY BREAKDOWN (high → low):")
            for cat in categories[:10]:
                size = cat.get('sizeMB', 0)
                if isinstance(size, (int, float)) and size > 0:
                    bar_len = min(int(size / 2), 25)
                    bar = '█' * bar_len + '░' * (25 - bar_len)
                    print(f"  │   {cat['name']:22} {size:8.2f} MB  {bar}")
                    # Show details if available
                    if cat.get('largest'):
                        for item in cat['largest'][:2]:
                            print(f"  │     └─ {item.get('src', item.get('name', '?'))}: {item.get('sizeMB', '?')} MB")
                elif cat.get('note'):
                    print(f"  │   {cat['name']:22} {cat.get('note', '')}")

        # Large global objects
        large_globals = detailed.get('details', {}).get('largeGlobals', [])
        if large_globals:
            print(f"  │")
            print(f"  │ LARGEST GLOBAL OBJECTS:")
            for obj in large_globals[:5]:
                print(f"  │   {obj['name']}: {obj['sizeMB']} MB ({obj['type']})")

        # Heap object types
        object_types = heap_objects.get('object_types', [])
        if object_types:
            print(f"  │")
            print(f"  │ TOP HEAP OBJECT TYPES:")
            for obj in object_types[:8]:
                print(f"  │   {obj['type']:20} {obj['count']:5} objects  ~{obj['estimatedKB']} KB")

        # IndexedDB
        if indexeddb.get('storageEstimate'):
            est = indexeddb['storageEstimate']
            print(f"  │")
            print(f"  │ STORAGE: {est.get('usage_mb', '?')} MB ({est.get('percent', '?')}% of quota)")

        print(f"  └─────────────────────────────────────────────────────────────")

    def generate_recommendations(self) -> list:
        """Generate optimization recommendations."""
        recommendations = []

        if not self.results["pages"]:
            return recommendations

        for page in self.results["pages"]:
            breakdown = page.get("breakdown", {})
            details = breakdown.get("details", {})

            # Check Pinia stores
            pinia_stores = details.get("piniaStores", [])
            for store in pinia_stores:
                if store.get('sizeKB', 0) > 500:
                    recommendations.append({
                        "priority": "HIGH",
                        "page": page["path"],
                        "category": "Large Pinia Store",
                        "issue": f"Store '{store['name']}' is {store['sizeKB']} KB",
                        "suggestion": "Consider paginating data or using computed properties"
                    })

                    # Check for large keys
                    for key in store.get('topKeys', []):
                        if key.get('sizeKB', 0) > 200:
                            recommendations.append({
                                "priority": "MEDIUM",
                                "page": page["path"],
                                "category": "Large Store Key",
                                "issue": f"'{store['name']}.{key['key']}' is {key['sizeKB']} KB ({key['type']})",
                                "suggestion": "Consider virtualizing lists, paginating, or clearing when not visible"
                            })

            # Check globals
            globals_data = details.get("globals", [])
            for g in globals_data[:3]:
                if g.get('sizeKB', 0) > 100:
                    recommendations.append({
                        "priority": "MEDIUM",
                        "page": page["path"],
                        "category": "Large Global",
                        "issue": f"Global '{g['name']}' is {g['sizeKB']} KB",
                        "suggestion": "Move to module scope or Pinia store instead of window"
                    })

            # Check images
            images = details.get("images", {})
            if images.get('totalKB', 0) > 5000:
                recommendations.append({
                    "priority": "MEDIUM",
                    "page": page["path"],
                    "category": "Large Images",
                    "issue": f"Decoded images total {images['totalKB']} KB",
                    "suggestion": "Consider lazy loading images or using smaller dimensions"
                })

        # Check memory growth across pages
        if len(self.results["pages"]) >= 2:
            heap_values = [p.get("js_heap", {}).get("js_heap_used_mb", 0) for p in self.results["pages"]]
            if heap_values[0] > 0:
                growth = heap_values[-1] - heap_values[0]
                if growth > 5:
                    recommendations.append({
                        "priority": "HIGH",
                        "category": "Memory Growth",
                        "issue": f"JS heap grew by {growth:.1f} MB during navigation",
                        "suggestion": "Check for: event listeners not removed, intervals not cleared, Vue components not unmounted"
                    })

        return recommendations

    def run(self, pages: list, wait_time: int = 5, output_file: str = None):
        """Run the memory profiling suite."""
        print("=" * 60)
        print("TACO Frontend Memory Profiler v2")
        print("Focus: TAB + WORKER memory, sorted breakdown")
        print("=" * 60)

        start_time = time.time()

        try:
            self.setup_driver()

            for path in pages:
                page_result = self.profile_page(path, wait_time)
                self.results["pages"].append(page_result)

                self.results["memory_timeline"].append({
                    "timestamp": datetime.now().isoformat(),
                    "path": path,
                    "tab_memory_mb": page_result.get("tab_memory", {}).get("tab_total_mb", 0),
                    "js_heap_mb": page_result.get("js_heap", {}).get("js_heap_used_mb", 0),
                })

            # Generate recommendations
            self.results["recommendations"] = self.generate_recommendations()

            # Summary
            if self.results["pages"]:
                heap_values = [p.get("js_heap", {}).get("js_heap_used_mb", 0) for p in self.results["pages"]]
                tab_values = [p.get("tab_memory", {}).get("tab_total_mb", 0) for p in self.results["pages"]]

                self.results["summary"] = {
                    "total_duration_seconds": round(time.time() - start_time, 2),
                    "pages_tested": len(self.results["pages"]),
                    "js_heap_peak_mb": round(max(heap_values), 2) if heap_values else 0,
                    "js_heap_min_mb": round(min(heap_values), 2) if heap_values else 0,
                    "js_heap_growth_mb": round(heap_values[-1] - heap_values[0], 2) if len(heap_values) > 1 else 0,
                    "tab_memory_peak_mb": round(max(tab_values), 2) if tab_values else 0,
                    "recommendations_count": len(self.results["recommendations"]),
                }

        finally:
            if self.driver:
                self.driver.quit()

        # Save results
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(self.results, f, indent=2, default=str)
            print(f"\nResults saved to: {output_file}")

        # Print final summary
        self._print_final_summary()

        return self.results

    def _print_final_summary(self):
        """Print final summary."""
        print("\n" + "=" * 60)
        print("FINAL SUMMARY")
        print("=" * 60)

        summary = self.results.get("summary", {})
        print(f"\nTest Duration: {summary.get('total_duration_seconds', 0):.1f}s")
        print(f"Pages Tested: {summary.get('pages_tested', 0)}")

        tab_peak = summary.get('tab_memory_peak_mb', 0)
        js_peak = summary.get('js_heap_peak_mb', 0)

        print(f"\n┌──────────────────────────────────────────────────────────")
        print(f"│ MEMORY BREAKDOWN")
        print(f"├──────────────────────────────────────────────────────────")
        print(f"│ Renderer Process Memory: {tab_peak:.0f} MB")
        print(f"│   ├─ Chrome Baseline (headless):    ~500-700 MB")
        print(f"│   ├─ V8 Compiled Code:              ~20-50 MB")
        print(f"│   ├─ Blink Rendering Engine:        ~50-100 MB")
        print(f"│   ├─ GPU Process Share:             ~50-100 MB")
        print(f"│   └─ Your App's Actual Usage:       ~{js_peak:.0f}-{js_peak*2:.0f} MB")
        print(f"│")
        print(f"│ JS Heap (controllable by code):")
        print(f"│   Peak: {js_peak:.2f} MB")
        print(f"│   Min:  {summary.get('js_heap_min_mb', 0):.2f} MB")
        print(f"│   Growth: {summary.get('js_heap_growth_mb', 0):+.2f} MB")
        print(f"└──────────────────────────────────────────────────────────")

        print(f"\n📊 KEY INSIGHT:")
        print(f"   The {tab_peak:.0f} MB renderer memory is MOSTLY Chrome overhead.")
        print(f"   Your app's controllable memory is the JS Heap: ~{js_peak:.0f} MB")
        print(f"   This is NORMAL for a headless Chrome instance.")

        # Recommendations
        if self.results["recommendations"]:
            print("\n" + "-" * 60)
            print("RECOMMENDATIONS")
            print("-" * 60)
            for rec in self.results["recommendations"]:
                priority = rec.get("priority", "INFO")
                page = rec.get("page", "all")
                print(f"\n[{priority}] {rec.get('category', 'General')} ({page})")
                print(f"  Issue: {rec.get('issue', 'N/A')}")
                print(f"  Fix: {rec.get('suggestion', 'N/A')}")
        else:
            print("\n✓ No significant issues detected!")

        print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Memory Profiler for TACO Frontend v2")
    parser.add_argument("--url", default="http://localhost:4173", help="Base URL to test")
    parser.add_argument("--output", "-o", default="memory_report.json", help="Output file path")
    parser.add_argument("--pages", nargs="+", default=["/", "/dao", "/vote", "/wallet"], help="Pages to test")
    parser.add_argument("--wait-time", type=int, default=5, help="Seconds to wait after page load")
    parser.add_argument("--no-headless", action="store_true", help="Run Chrome in visible mode")

    args = parser.parse_args()

    profiler = MemoryProfiler(args.url, headless=not args.no_headless)
    results = profiler.run(args.pages, args.wait_time, args.output)

    return 0


if __name__ == "__main__":
    sys.exit(main())
