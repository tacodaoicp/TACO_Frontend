/**
 * External Call Registry
 *
 * Centralized registry of all external API/ICP calls with:
 * - User type permissions (guest, member, admin)
 * - Call functions using singleton actors
 * - Response type definitions
 * - Parallel execution support
 */

import { actorManager, treasuryCanisterId, daoBackendCanisterId } from './actorManager';
import type { UserType } from './backgroundProcessManager';
import { useTacoStore } from '../stores/taco.store';
import { getWorkerClient } from './workerClient';
import { Principal } from '@dfinity/principal';

// ==========================================
// 🔧 DEBUG FLAGS
// ==========================================

// DISABLE_ICP_CALLS: Set to TRUE to disable ALL ICP canister calls
export const DISABLE_ICP_CALLS = false;

// USE_WEB_WORKERS: Set to TRUE to use Web Workers for heavy ICP calls
// This prevents UI freezing during IDL decoding by running calls in background thread
export const USE_WEB_WORKERS = true;

/**
 * External Call Definition
 */
export interface ExternalCall<T = any> {
  key: string;                    // Unique identifier
  name: string;                   // Human-readable name
  userTypes: UserType[];          // Who can call this
  execute: () => Promise<T>;      // The actual call
  priority?: number;              // Optional priority (1-5, default 3)
  refreshInterval?: number;       // How often to refresh in MS (default 30000ms = 30s)
  persistCache?: boolean;         // Whether to persist cache across sessions (default true)
}

/**
 * External Call Result
 */
export interface ExternalCallResult<T = any> {
  key: string;
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * External Call Registry Type
 * Key: call identifier
 * Value: ExternalCall definition
 */
export type ExternalCallRegistry = Record<string, ExternalCall>;

// ==========================================
// PERSISTENT CACHE SYSTEM
// ==========================================
// Cache persists across sessions using localStorage
// Shows cached data immediately, then refreshes in background

const CACHE_STORAGE_KEY = 'taco_dao_cache_v1';
const DEFAULT_REFRESH_INTERVAL_MS = 30000; // 30 seconds

// In-memory cache for fast access
const resultCache = new Map<string, ExternalCallResult>();

// Store call definitions for refresh interval lookup
const callRegistry = new Map<string, ExternalCall>();

// Track last refresh times
const lastRefreshTimes = new Map<string, number>();

/**
 * Serialize data with BigInt support for localStorage
 */
function serializeData(data: any): string {
  return JSON.stringify(data, (_, v) => typeof v === 'bigint' ? `__BIGINT__${v.toString()}` : v);
}

/**
 * Deserialize data with BigInt support from localStorage
 */
function deserializeData(json: string): any {
  return JSON.parse(json, (_, v) => {
    if (typeof v === 'string' && v.startsWith('__BIGINT__')) {
      return BigInt(v.slice(10));
    }
    return v;
  });
}

/**
 * Load cache from localStorage on initialization
 */
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      const data = deserializeData(stored);
      Object.entries(data).forEach(([key, result]) => {
        resultCache.set(key, result as ExternalCallResult);
      });
      console.log(`📦 [CACHE] Loaded ${resultCache.size} cached results from storage`);
    }
  } catch (e) {
    console.warn('⚠️ [CACHE] Failed to load cache from storage, clearing it:', e);
    // If cache is corrupted or too large, clear it
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (clearError) {
      console.warn('⚠️ [CACHE] Failed to clear corrupted cache:', clearError);
    }
  }
}

/**
 * Strip large fields from data before persisting to localStorage
 * Currently removes: pastPrices from tokenDetails
 */
function stripLargeFields(key: string, data: any): any {
  if (key === 'treasury.getTokenDetails' && Array.isArray(data)) {
    // Strip pastPrices array from each token entry (saves ~90% storage)
    return data.map(token => {
      if (token && typeof token === 'object' && 'pastPrices' in token) {
        const { pastPrices, ...tokenWithoutPrices } = token;
        return tokenWithoutPrices;
      }
      return token;
    });
  }
  return data;
}

/**
 * Save cache to localStorage
 */
function saveCacheToStorage(): void {
  try {
    const data: Record<string, ExternalCallResult> = {};
    resultCache.forEach((result, key) => {
      // Only persist if call definition says to persist (default true)
      const callDef = callRegistry.get(key);
      if (callDef?.persistCache !== false) {
        // Strip large fields before persisting
        const strippedData = stripLargeFields(key, result.data);
        data[key] = {
          ...result,
          data: strippedData,
        };
      }
    });
    const serialized = serializeData(data);
    localStorage.setItem(CACHE_STORAGE_KEY, serialized);
    console.log('💾 [CACHE] Saved cache to localStorage');
  } catch (e) {
    // Handle QuotaExceededError by clearing ALL cache (in-memory + localStorage)
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('⚠️ [CACHE] localStorage quota exceeded, clearing ENTIRE cache');
      try {
        // Clear localStorage
        localStorage.removeItem(CACHE_STORAGE_KEY);

        // Clear in-memory cache
        resultCache.clear();
        lastRefreshTimes.clear();

        console.log('✅ [CACHE] Entire cache cleared due to quota error');
      } catch (clearError) {
        console.warn('⚠️ [CACHE] Failed to clear cache:', clearError);
      }
    } else {
      console.warn('⚠️ [CACHE] Failed to save cache to storage:', e);
    }
  }
}

// Load cache on module initialization
loadCacheFromStorage();

/**
 * Get cached result - ALWAYS returns cached data immediately if available
 * Background processes handle refreshing based on refreshInterval
 */
export async function getCachedOrFetch<T = any>(callKey: string): Promise<T | null> {
  const cached = resultCache.get(callKey);

  if (cached && cached.success) {
    const age = Date.now() - cached.timestamp;
    console.log(`📦 [CACHE] Returning cached result for ${callKey} (age: ${age}ms)`);
    return cached.data as T;
  }

  console.log(`❌ [CACHE] No cached data for ${callKey}, returning null`);
  return null;
}

/**
 * Check if a call needs to be refreshed based on its refresh interval
 */
export function needsRefresh(callKey: string): boolean {
  const callDef = callRegistry.get(callKey);
  const refreshInterval = callDef?.refreshInterval ?? DEFAULT_REFRESH_INTERVAL_MS;

  const lastRefresh = lastRefreshTimes.get(callKey) || 0;
  const now = Date.now();
  const timeSinceRefresh = now - lastRefresh;

  return timeSinceRefresh >= refreshInterval;
}

/**
 * Store result in cache (in-memory + persistent storage)
 */
function cacheResult(result: ExternalCallResult): void {
  const cacheStart = performance.now();

  // Analyze data size before caching (handle BigInt)
  let dataSize = 0;
  try {
    dataSize = result.data ? JSON.stringify(result.data, (_, v) => typeof v === 'bigint' ? v.toString() : v).length : 0;
  } catch (e) {
    console.warn(`⚠️ [CACHE] Could not measure size for ${result.key}:`, e);
  }
  const dataItemCount = Array.isArray(result.data) ? result.data.length : 'N/A';

  // Store in memory
  resultCache.set(result.key, result);

  // Update last refresh time
  lastRefreshTimes.set(result.key, Date.now());

  // Save to persistent storage (async, non-blocking)
  setTimeout(() => saveCacheToStorage(), 0);

  const cacheEnd = performance.now();
  console.log(`💾 [CACHE] Stored result for ${result.key} at ${result.timestamp}`);
  if (dataSize > 0) {
    console.log(`  - Data size: ${(dataSize / 1024).toFixed(2)} KB (${dataSize.toLocaleString()} bytes)`);
  }
  console.log(`  - Item count: ${dataItemCount}`);
  console.log(`  - Cache storage took: ${(cacheEnd - cacheStart).toFixed(2)}ms`);
}

/**
 * Define all external calls
 */
export function getExternalCalls(): ExternalCallRegistry {
  const tacoStore = useTacoStore();

  return {
    // ==========================================
    // ALARM CANISTER CALLS (Admin Only)
    // ==========================================

    'alarm.getEnhancedAlarmSystemStatus': {
      key: 'alarm.getEnhancedAlarmSystemStatus',
      name: 'Get Enhanced Alarm System Status',
      userTypes: ['admin'],
      priority: 2,
      refreshInterval: 30000, // 30 seconds - alarm status updates regularly
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: null }; }
        const actor = await actorManager.getAlarmActor();
        return await actor.getEnhancedAlarmSystemStatus();
      },
    },

    'alarm.getSystemErrors': {
      key: 'alarm.getSystemErrors',
      name: 'Get System Errors',
      userTypes: ['admin'],
      priority: 2,
      refreshInterval: 20000, // 20 seconds - errors need frequent monitoring
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: [] }; }
        const actor = await actorManager.getAlarmActor();
        // Pass empty array for no limit
        return await actor.getSystemErrors([]);
      },
    },

    'alarm.getPendingAlarms': {
      key: 'alarm.getPendingAlarms',
      name: 'Get Pending Alarms',
      userTypes: ['admin'],
      priority: 3,
      refreshInterval: 30000, // 30 seconds
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getAlarmActor();
        return await actor.getPendingAlarms();
      },
    },

    'alarm.getInternalErrors': {
      key: 'alarm.getInternalErrors',
      name: 'Get Internal Errors',
      userTypes: ['admin'],
      priority: 3,
      refreshInterval: 30000, // 30 seconds
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: [] }; }
        const actor = await actorManager.getAlarmActor();
        // Optional limit, passing empty array for no limit
        return await actor.getInternalErrors([]);
      },
    },

    'alarm.getMonitoringStatus': {
      key: 'alarm.getMonitoringStatus',
      name: 'Get Monitoring Status',
      userTypes: ['admin'],
      priority: 2,
      refreshInterval: 30000, // 30 seconds
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: null }; }
        const actor = await actorManager.getAlarmActor();
        return await actor.getMonitoringStatus();
      },
    },

    'alarm.getContacts': {
      key: 'alarm.getContacts',
      name: 'Get Alarm Contacts',
      userTypes: ['admin'],
      priority: 4,
      refreshInterval: 120000, // 2 minutes - contacts rarely change
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: [] }; }
        const actor = await actorManager.getAlarmActor();
        return await actor.getContacts();
      },
    },

    'alarm.getMonitoredCanisters': {
      key: 'alarm.getMonitoredCanisters',
      name: 'Get Monitored Canisters',
      userTypes: ['admin'],
      priority: 3,
      refreshInterval: 120000, // 2 minutes - canister list rarely changes
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getAlarmActor();
        return await actor.getMonitoredCanisters();
      },
    },

    'alarm.getCanisterHealthStatus': {
      key: 'alarm.getCanisterHealthStatus',
      name: 'Get Canister Health Status',
      userTypes: ['admin'],
      priority: 3,
      refreshInterval: 30000, // 30 seconds
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: null }; }
        const actor = await actorManager.getAlarmActor();
        return await actor.getCanisterHealthStatus();
      },
    },

    // ==========================================
    // DAO CANISTER CALLS
    // ==========================================

    'dao.getSnapshotInfo': {
      key: 'dao.getSnapshotInfo',
      name: 'Get Snapshot Info',
      userTypes: ['guest', 'member', 'admin'],
      priority: 2,
      refreshInterval: 60000, // 60 seconds - snapshots happen every 15 minutes
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getAnonymousDaoActor(); // Use anonymous for public data
        return await actor.getSnapshotInfo();
      },
    },

    'dao.getSystemLogs': {
      key: 'dao.getSystemLogs',
      name: 'Get System Logs',
      userTypes: ['admin'],
      priority: 2,
      refreshInterval: 20000, // 20 seconds - logs update frequently
      persistCache: true, // Persist - logs are kept lean
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getDaoActor();
        return await actor.getLogs(BigInt(100));
      },
    },

    'dao.getUserAllocations': {
      key: 'dao.getUserAllocations',
      name: 'Get User Allocations',
      userTypes: ['member', 'admin'],
      priority: 3,
      refreshInterval: 45000, // 45 seconds - allocations change moderately
      persistCache: true, // Persist - allocation data is reasonably sized
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getDaoActor();
        return await actor.admin_getUserAllocations();
      },
    },

    'dao.getNeuronAllocations': {
      key: 'dao.getNeuronAllocations',
      name: 'Get Neuron Allocations',
      userTypes: ['admin'],
      priority: 3,
      refreshInterval: 45000, // 45 seconds - neuron allocations change moderately
      persistCache: true, // Persist - allocation data is reasonably sized
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getDaoActor();
        return await actor.admin_getNeuronAllocations();
      },
    },

    'dao.getAggregateAllocation': {
      key: 'dao.getAggregateAllocation',
      name: 'Get Aggregate Allocation',
      userTypes: ['guest', 'member', 'admin'],
      priority: 2,
      refreshInterval: 30000, // 30 seconds - allocation changes slowly
      persistCache: true, // Persist - allocation data is reasonably sized
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getAnonymousDaoActor(); // Use anonymous for public data
        return await actor.getAggregateAllocation();
      },
    },

    'dao.getVotingPowerMetrics': {
      key: 'dao.getVotingPowerMetrics',
      name: 'Get Voting Power Metrics',
      userTypes: ['guest', 'member', 'admin'], // Allow guests to see voting power
      priority: 2,
      refreshInterval: 30000, // 30 seconds
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return null; }
        const actor = await actorManager.getAnonymousDaoActor(); // Use anonymous for public data
        return await actor.votingPowerMetrics();
      },
    },

    'dao.getUserAllocation': {
      key: 'dao.getUserAllocation',
      name: 'Get User Allocation',
      userTypes: ['member', 'admin'],
      priority: 3,
      refreshInterval: 45000, // 45 seconds - user allocation changes moderately
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return []; }
        const actor = await actorManager.getDaoActor();
        return await actor.getUserAllocation();
      },
    },

    'dao.getSystemParameters': {
      key: 'dao.getSystemParameters',
      name: 'Get System Parameters',
      userTypes: ['admin'],
      priority: 3,
      refreshInterval: 300000, // 5 minutes - system parameters rarely change
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: null }; }
        const actor = await actorManager.getDaoActor();
        return await actor.getSystemParameters();
      },
    },

    // ==========================================
    // TREASURY CANISTER CALLS
    // ==========================================

    'treasury.getTradingStatus': {
      key: 'treasury.getTradingStatus',
      name: 'Get Treasury Trading Status',
      userTypes: ['guest', 'member', 'admin'],
      priority: 2,
      refreshInterval: 15000, // 15 seconds - trading status updates frequently
      execute: async () => {
        if (DISABLE_ICP_CALLS) { console.log('🚫 [DEBUG] ICP calls disabled'); return { ok: null }; }
        const actor = await actorManager.getAnonymousTreasuryActor(); // Use anonymous for public data
        return await actor.getTradingStatus();
      },
    },

    'treasury.getTokenDetails': {
      key: 'treasury.getTokenDetails',
      name: 'Get Token Details',
      userTypes: ['guest', 'member', 'admin'],
      priority: 1, // Highest priority - needed for homepage display
      refreshInterval: 30000, // 30 seconds - token balances don't change often
      persistCache: true, // Persist after stripping pastPrices (saves ~90% storage)
      execute: async () => {
        if (DISABLE_ICP_CALLS) {
          console.log('🚫 [DEBUG] ICP calls disabled - returning empty array for getTokenDetails');
          return [];
        }

        // Use Web Worker if enabled (prevents UI freeze during IDL decoding)
        if (USE_WEB_WORKERS) {
          const callStart = performance.now();
          console.log('🔧 [REGISTRY] Using Web Worker for getTokenDetails...', `(${callStart.toFixed(2)}ms)`);

          const treasuryId = treasuryCanisterId();
          console.log('🔧 [REGISTRY] Treasury Canister ID:', treasuryId);

          if (!treasuryId) {
            console.error('❌ [REGISTRY] Treasury canister ID is undefined, falling back to main thread');
          } else {
            try {
              const worker = getWorkerClient();
              const result = await worker.query(
                'treasury',
                treasuryId,
                'getTokenDetails',
                []
              );

              const callEnd = performance.now();
              console.log('✅ [REGISTRY] Worker returned getTokenDetails', `(${callEnd.toFixed(2)}ms, took ${(callEnd - callStart).toFixed(2)}ms)`);
              console.log('📊 [REGISTRY] Result length:', result.length);

              return result;
            } catch (error) {
              console.error('❌ [REGISTRY] Worker failed, falling back to main thread:', error);
              // Fall through to main thread execution
            }
          }
        }

        // Fallback: Main thread execution (will block UI during IDL decoding)
        const actorStart = performance.now();
        console.log('🔍 [REGISTRY] Getting treasury actor for getTokenDetails (main thread)...', `(${actorStart.toFixed(2)}ms)`);
        const actor = await actorManager.getAnonymousTreasuryActor();
        const actorEnd = performance.now();
        console.log('✅ [REGISTRY] Treasury actor ready', `(${actorEnd.toFixed(2)}ms, took ${(actorEnd - actorStart).toFixed(2)}ms)`);

        const callStart = performance.now();
        console.log('🔍 [REGISTRY] Calling actor.getTokenDetails()...', `(${callStart.toFixed(2)}ms)`);
        const result = await actor.getTokenDetails();
        const callEnd = performance.now();
        console.log('✅ [REGISTRY] actor.getTokenDetails() returned', `(${callEnd.toFixed(2)}ms, took ${(callEnd - callStart).toFixed(2)}ms)`);
        console.log('📊 [REGISTRY] Result length:', result.length);

        return result;
      },
    },

    // ==========================================
    // EXTERNAL API CALLS (Non-ICP)
    // ==========================================

    'api.cryptoPrices': {
      key: 'api.cryptoPrices',
      name: 'Fetch Crypto Prices',
      userTypes: ['guest', 'member', 'admin'],
      priority: 1,
      refreshInterval: 60000, // 60 seconds - crypto prices update frequently but API has rate limits
      execute: async () => {
        return await tacoStore.fetchCryptoPrices();
      },
    },
  };
}

/**
 * Execute external calls in parallel for a given user type
 */
export async function executeExternalCalls(
  userType: UserType,
  callKeys?: string[]
): Promise<Record<string, ExternalCallResult>> {
  const registry = getExternalCalls();
  const results: Record<string, ExternalCallResult> = {};

  // Register all calls first for needsRefresh() to work
  Object.values(registry).forEach(call => {
    callRegistry.set(call.key, call);
  });

  // Filter calls based on user type, optional key filter, and refresh needs
  const callsToExecute = Object.values(registry).filter(call => {
    const hasPermission = call.userTypes.includes(userType);
    const isRequested = !callKeys || callKeys.includes(call.key);
    const needsRefreshNow = needsRefresh(call.key);

    if (hasPermission && isRequested && !needsRefreshNow) {
      console.log(`⏭️ Skipping ${call.name} - doesn't need refresh yet`);
    }

    return hasPermission && isRequested && needsRefreshNow;
  });

  // Sort by priority
  callsToExecute.sort((a, b) => (a.priority || 3) - (b.priority || 3));

  console.log(`🚀 Executing ${callsToExecute.length} external calls for ${userType} (others cached)`);

  // Execute all calls in parallel with detailed logging
  const promises = callsToExecute.map(async (call) => {
    const startTime = performance.now();
    try {
      console.log(`  🔵 START: ${call.name} (t=${startTime.toFixed(2)}ms)`);

      const executeStart = performance.now();
      const data = await call.execute();
      const executeEnd = performance.now();
      console.log(`  📦 [REGISTRY] ${call.name} execute() returned (took ${(executeEnd - executeStart).toFixed(2)}ms)`);

      const processStart = performance.now();
      const result: ExternalCallResult = {
        key: call.key,
        success: true,
        data,
        timestamp: Date.now(),
      };

      // Store in cache
      cacheResult(result);

      const processEnd = performance.now();
      console.log(`  📋 [REGISTRY] ${call.name} result object created (took ${(processEnd - processStart).toFixed(2)}ms)`);

      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`  ✅ SUCCESS: ${call.name} (total ${duration.toFixed(2)}ms)`);
      return [call.key, result] as const;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`  ❌ FAILED: ${call.name} (${duration.toFixed(2)}ms) -`, error);
      const result: ExternalCallResult = {
        key: call.key,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
      return [call.key, result] as const;
    }
  });

  // Wait for all to complete
  const promiseStart = performance.now();
  console.log(`⏳ [REGISTRY] Waiting for Promise.all to complete...`, `(${promiseStart.toFixed(2)}ms)`);
  const entries = await Promise.all(promises);
  const promiseEnd = performance.now();
  console.log(`✅ [REGISTRY] Promise.all completed`, `(${promiseEnd.toFixed(2)}ms, took ${(promiseEnd - promiseStart).toFixed(2)}ms)`);

  // Convert to record
  const convertStart = performance.now();
  entries.forEach(([key, result]) => {
    results[key] = result;
  });
  const convertEnd = performance.now();
  console.log(`📝 [REGISTRY] Converted to record`, `(${convertEnd.toFixed(2)}ms, took ${(convertEnd - convertStart).toFixed(2)}ms)`);

  console.log(`✅ Completed ${callsToExecute.length} external calls`);

  return results;
}

/**
 * Execute admin external calls in parallel
 */
export async function executeAdminCalls(): Promise<Record<string, ExternalCallResult>> {
  return executeExternalCalls('admin');
}

/**
 * Execute member external calls in parallel
 */
export async function executeMemberCalls(): Promise<Record<string, ExternalCallResult>> {
  return executeExternalCalls('member');
}

/**
 * Execute guest external calls in parallel
 */
export async function executeGuestCalls(): Promise<Record<string, ExternalCallResult>> {
  return executeExternalCalls('guest');
}

/**
 * Execute specific calls by key
 */
export async function executeCallsByKeys(
  userType: UserType,
  keys: string[]
): Promise<Record<string, ExternalCallResult>> {
  return executeExternalCalls(userType, keys);
}

// ==========================================
// ICRC1 DYNAMIC CALLS (Per-Token Caching)
// ==========================================

const ICRC1_REFRESH_INTERVAL = 300000; // 5 minutes

/**
 * Get ICRC1 metadata for a specific token (cached)
 * Uses actorManager's cached ICRC1 actors
 */
export async function getIcrc1Metadata(canisterId: string): Promise<any> {
  const callKey = `icrc1.metadata.${canisterId}`;

  // Check cache first
  const cached = await getCachedOrFetch(callKey);
  if (cached) {
    return cached;
  }

  // Check if needs refresh
  if (!needsRefresh(callKey)) {
    console.log(`⏭️ [ICRC1] Skipping ${callKey} - not yet time to refresh`);
    return null;
  }

  try {
    console.log(`🔍 [ICRC1] Fetching metadata for ${canisterId}...`);
    const actor = await actorManager.getAnonymousIcrc1Actor(canisterId);
    const metadata = await (actor as any).icrc1_metadata();

    // Cache the result
    const result: ExternalCallResult = {
      key: callKey,
      success: true,
      data: metadata,
      timestamp: Date.now(),
    };

    // Store in cache (will persist to localStorage automatically)
    resultCache.set(callKey, result);
    lastRefreshTimes.set(callKey, Date.now());

    // Persist to storage
    setTimeout(() => saveCacheToStorage(), 0);

    console.log(`✅ [ICRC1] Cached metadata for ${canisterId}`);
    return metadata;
  } catch (error) {
    console.error(`❌ [ICRC1] Failed to fetch metadata for ${canisterId}:`, error);

    const result: ExternalCallResult = {
      key: callKey,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    };

    resultCache.set(callKey, result);
    lastRefreshTimes.set(callKey, Date.now());

    return null;
  }
}

/**
 * Get ICRC1 balance for a specific account (cached)
 */
export async function getIcrc1Balance(
  canisterId: string,
  owner: string,
  subaccount?: Uint8Array
): Promise<bigint | null> {
  const subaccountKey = subaccount ? Array.from(subaccount).join(',') : 'default';
  const callKey = `icrc1.balance.${canisterId}.${owner}.${subaccountKey}`;

  // Check cache first
  const cached = await getCachedOrFetch<bigint>(callKey);
  if (cached !== null) {
    return cached;
  }

  // Check if needs refresh (balance refreshes more frequently - 30 seconds)
  const lastRefresh = lastRefreshTimes.get(callKey) || 0;
  const balanceRefreshInterval = 30000; // 30 seconds
  if (Date.now() - lastRefresh < balanceRefreshInterval) {
    console.log(`⏭️ [ICRC1] Skipping balance check for ${canisterId} - not yet time to refresh`);
    return null;
  }

  try {
    console.log(`🔍 [ICRC1] Fetching balance for ${canisterId}...`);
    const actor = await actorManager.getAnonymousIcrc1Actor(canisterId);

    // Convert owner string to Principal if needed
    const ownerPrincipal = typeof owner === 'string' ? Principal.fromText(owner) : owner;

    const account = {
      owner: ownerPrincipal,
      subaccount: subaccount ? [subaccount] : [],
    };

    const balance = await (actor as any).icrc1_balance_of(account);

    // Cache the result
    const result: ExternalCallResult = {
      key: callKey,
      success: true,
      data: balance,
      timestamp: Date.now(),
    };

    resultCache.set(callKey, result);
    lastRefreshTimes.set(callKey, Date.now());

    console.log(`✅ [ICRC1] Cached balance for ${canisterId}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`❌ [ICRC1] Failed to fetch balance for ${canisterId}:`, error);

    const result: ExternalCallResult = {
      key: callKey,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    };

    resultCache.set(callKey, result);
    lastRefreshTimes.set(callKey, Date.now());

    return null;
  }
}

/**
 * Refresh ICRC1 metadata for all known tokens
 * Call this from background processes
 */
export async function refreshAllIcrc1Metadata(tokenCanisterIds: string[]): Promise<void> {
  console.log(`🔄 [ICRC1] Refreshing metadata for ${tokenCanisterIds.length} tokens...`);

  const promises = tokenCanisterIds.map(canisterId => getIcrc1Metadata(canisterId));
  await Promise.allSettled(promises);

  console.log(`✅ [ICRC1] Finished refreshing all token metadata`);
}
