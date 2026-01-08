/**
 * Worker Adapter
 *
 * Provides a unified interface for SharedWorker and regular Worker.
 * Uses SharedWorker when available (desktop browsers), falls back to regular Worker
 * for browsers without SharedWorker support (iOS Safari, some mobile browsers).
 */

import type { WorkerRequest, WorkerResponse } from './types'

export type WorkerType = 'shared' | 'dedicated'

export interface WorkerAdapter {
  type: WorkerType
  postMessage(message: WorkerRequest): void
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
  terminate(): void
}

/**
 * Check if SharedWorker is supported in this browser
 */
export function isSharedWorkerSupported(): boolean {
  return typeof SharedWorker !== 'undefined'
}

/**
 * Create a worker adapter that wraps either SharedWorker or regular Worker
 */
export function createWorkerAdapter(
  workerUrl: URL,
  workerName: string
): WorkerAdapter {
  if (isSharedWorkerSupported()) {
    return createSharedWorkerAdapter(workerUrl, workerName)
  } else {
    return createDedicatedWorkerAdapter(workerUrl, workerName)
  }
}

/**
 * Create a worker adapter from pre-resolved URLs (for Vite production builds)
 */
export function createWorkerAdapterFromUrl(
  sharedWorkerUrl: string,
  dedicatedWorkerUrl: string,
  workerName: string
): WorkerAdapter {
  if (isSharedWorkerSupported()) {
    return createSharedWorkerAdapter(new URL(sharedWorkerUrl, import.meta.url), workerName)
  } else {
    return createDedicatedWorkerAdapterFromUrl(dedicatedWorkerUrl, workerName)
  }
}

/**
 * Dedicated Worker adapter from URL string
 */
function createDedicatedWorkerAdapterFromUrl(workerUrl: string, workerName: string): WorkerAdapter {
  const worker = new Worker(workerUrl, { type: 'module', name: workerName })

  const adapter: WorkerAdapter = {
    type: 'dedicated',

    postMessage(message: WorkerRequest): void {
      worker.postMessage(message)
    },

    onmessage: null,
    onerror: null,
    onmessageerror: null,

    terminate(): void {
      worker.terminate()
    }
  }

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (adapter.onmessage) {
      adapter.onmessage(event)
    }
  }

  worker.onmessageerror = (event: MessageEvent) => {
    if (adapter.onmessageerror) {
      adapter.onmessageerror(event)
    }
  }

  worker.onerror = (event: ErrorEvent) => {
    if (adapter.onerror) {
      adapter.onerror(event)
    }
  }

  return adapter
}

/**
 * SharedWorker adapter - wraps SharedWorker's port-based API
 */
function createSharedWorkerAdapter(workerUrl: URL, workerName: string): WorkerAdapter {
  const worker = new SharedWorker(workerUrl, { type: 'module', name: workerName })
  const port = worker.port

  const adapter: WorkerAdapter = {
    type: 'shared',

    postMessage(message: WorkerRequest): void {
      port.postMessage(message)
    },

    onmessage: null,
    onerror: null,
    onmessageerror: null,

    terminate(): void {
      port.close()
    }
  }

  // Wire up event handlers
  port.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (adapter.onmessage) {
      adapter.onmessage(event)
    }
  }

  port.onmessageerror = (event: MessageEvent) => {
    if (adapter.onmessageerror) {
      adapter.onmessageerror(event)
    }
  }

  worker.onerror = (event: ErrorEvent) => {
    if (adapter.onerror) {
      adapter.onerror(event)
    }
  }

  // Start the port
  port.start()

  return adapter
}

/**
 * Dedicated Worker adapter - wraps regular Worker API
 * Uses the same worker files but with a different entry point
 */
function createDedicatedWorkerAdapter(workerUrl: URL, workerName: string): WorkerAdapter {
  // For dedicated workers, we need to use the dedicated worker entry points
  // These are wrapper files that adapt the SharedWorker logic to regular Worker
  const dedicatedUrl = getDedicatedWorkerUrl(workerUrl, workerName)
  const worker = new Worker(dedicatedUrl, { type: 'module', name: workerName })

  const adapter: WorkerAdapter = {
    type: 'dedicated',

    postMessage(message: WorkerRequest): void {
      worker.postMessage(message)
    },

    onmessage: null,
    onerror: null,
    onmessageerror: null,

    terminate(): void {
      worker.terminate()
    }
  }

  // Wire up event handlers
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (adapter.onmessage) {
      adapter.onmessage(event)
    }
  }

  worker.onmessageerror = (event: MessageEvent) => {
    if (adapter.onmessageerror) {
      adapter.onmessageerror(event)
    }
  }

  worker.onerror = (event: ErrorEvent) => {
    if (adapter.onerror) {
      adapter.onerror(event)
    }
  }

  return adapter
}

/**
 * Map SharedWorker URL to dedicated worker URL
 */
function getDedicatedWorkerUrl(sharedWorkerUrl: URL, workerName: string): URL {
  // The dedicated worker files are named with .dedicated.worker.ts
  const urlString = sharedWorkerUrl.toString()

  // Replace .worker.ts with .dedicated.worker.ts
  if (urlString.includes('core-public.worker.ts')) {
    return new URL(urlString.replace('core-public.worker.ts', 'core-public.dedicated.worker.ts'))
  }
  if (urlString.includes('secondary-public.worker.ts')) {
    return new URL(urlString.replace('secondary-public.worker.ts', 'secondary-public.dedicated.worker.ts'))
  }
  if (urlString.includes('authenticated.worker.ts')) {
    return new URL(urlString.replace('authenticated.worker.ts', 'authenticated.dedicated.worker.ts'))
  }

  // Fallback - shouldn't happen
  console.warn(`[WorkerAdapter] Unknown worker URL: ${urlString}`)
  return sharedWorkerUrl
}
