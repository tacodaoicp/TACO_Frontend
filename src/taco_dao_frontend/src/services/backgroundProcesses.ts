/**
 * Background Process Definitions
 *
 * Defines all background processes organized by customer journey:
 * - Guest users (not logged in)
 * - Member users (logged in)
 * - Admin users
 */

import { useTacoStore } from '../stores/taco.store';
import type { BackgroundProcess, UserType } from './backgroundProcessManager';
import { executeExternalCalls, refreshAllIcrc1Metadata, getCachedOrFetch } from './externalCallRegistry';

/**
 * Get all defined background processes
 */
export function getBackgroundProcesses(): BackgroundProcess[] {
  const tacoStore = useTacoStore();

  return [
    // ==========================================
    // GUEST USER PROCESSES (Not Logged In)
    // ==========================================

    {
      id: 'guest-external-calls-parallel',
      name: 'Execute All Guest External Calls (Parallel)',
      priority: 1, // Highest priority - loads all public data in parallel
      userTypes: ['guest', 'member', 'admin'],
      execute: async () => {
        const start = performance.now();
        console.log('🔵 [BG] Starting guest external calls...', `(${start.toFixed(2)}ms)`);

        // Execute all guest external calls in parallel
        const results = await executeExternalCalls('guest');

        const end = performance.now();
        console.log('✅ [BG] Guest external calls completed:', Object.keys(results).length, `(${end.toFixed(2)}ms, took ${(end - start).toFixed(2)}ms)`);
        return results;
      },
      runOnce: true, // Run once on initial load
    },

    {
      id: 'crypto-prices',
      name: 'Fetch Crypto Prices',
      priority: 1, // Highest priority - needed for homepage treasury display
      userTypes: ['guest', 'member', 'admin'],
      execute: async () => {
        // Fire and forget - don't block on external API calls
        tacoStore.fetchCryptoPrices().catch(err => {
          console.error('Background crypto price fetch failed:', err);
        });
      },
      refreshInterval: 60000, // Refresh every 60 seconds
    },

    {
      id: 'icrc1-metadata-refresh',
      name: 'Refresh ICRC1 Metadata for All Tokens',
      priority: 2, // Medium priority - runs after initial token details loaded
      userTypes: ['guest', 'member', 'admin'],
      execute: async () => {
        // Get token details from cache to extract canister IDs
        const tokenDetails = await getCachedOrFetch<any[]>('treasury.getTokenDetails');

        if (!tokenDetails || tokenDetails.length === 0) {
          console.log('⏭️ [BG] Skipping ICRC1 metadata refresh - no token details in cache yet');
          return;
        }

        // Extract unique canister IDs from token details
        const canisterIds = tokenDetails
          .map((token: any) => token?.canisterId?.toString())
          .filter((id: string | undefined) => id && id.length > 0);

        if (canisterIds.length === 0) {
          console.log('⏭️ [BG] No ICRC1 canister IDs found in token details');
          return;
        }

        console.log(`🔄 [BG] Refreshing ICRC1 metadata for ${canisterIds.length} tokens`);
        await refreshAllIcrc1Metadata(canisterIds);
      },
      refreshInterval: 300000, // Refresh every 5 minutes
    },

    // ==========================================
    // MEMBER USER PROCESSES (Logged In)
    // ==========================================

    {
      id: 'member-external-calls-parallel',
      name: 'Execute All Member External Calls (Parallel)',
      priority: 1, // Highest priority - loads all member data in parallel
      userTypes: ['member', 'admin'],
      execute: async () => {
        const start = performance.now();
        console.log('🟢 [BG] Starting member external calls...', `(${start.toFixed(2)}ms)`);

        // Execute all member external calls in parallel
        const results = await executeExternalCalls('member');

        const end = performance.now();
        console.log('✅ [BG] Member external calls completed:', Object.keys(results).length, `(${end.toFixed(2)}ms, took ${(end - start).toFixed(2)}ms)`);
        return results;
      },
      runOnce: true, // Run once on initial load
    },

    {
      id: 'user-authentication',
      name: 'Check User Authentication',
      priority: 1, // Highest priority - determines user state
      userTypes: ['member', 'admin'],
      execute: async () => {
        await tacoStore.checkIfLoggedIn();
      },
      runOnce: true, // Only check once on initial load
    },

    {
      id: 'user-allocations',
      name: 'Fetch User Allocations',
      priority: 3, // Medium priority
      userTypes: ['member', 'admin'],
      execute: async () => {
        if (tacoStore.userLoggedIn) {
          await tacoStore.fetchVoterDetails();
        }
      },
      refreshInterval: 300000, // Refresh every 5 minutes
    },

    {
      id: 'user-rewards',
      name: 'Fetch User Rewards',
      priority: 4, // Lower priority
      userTypes: ['member', 'admin'],
      execute: async () => {
        if (tacoStore.userLoggedIn) {
          // Fetch user rewards logic
          console.log('Fetching user rewards...');
        }
      },
      refreshInterval: 300000, // Refresh every 5 minutes
    },

    {
      id: 'sns-proposals',
      name: 'Fetch SNS Proposals',
      priority: 3, // Medium priority
      userTypes: ['member', 'admin'],
      execute: async () => {
        // Fetch SNS proposals
        console.log('Fetching SNS proposals...');
      },
      refreshInterval: 180000, // Refresh every 3 minutes
    },

    // ==========================================
    // ADMIN USER PROCESSES
    // ==========================================

    {
      id: 'admin-external-calls-parallel',
      name: 'Execute All Admin External Calls (Parallel)',
      priority: 1, // Highest priority for admin - runs all external calls in parallel
      userTypes: ['admin'],
      execute: async () => {
        // Execute all admin external calls in parallel using singleton actors
        const results = await executeExternalCalls('admin');
        console.log('✅ Admin external calls completed:', Object.keys(results).length);
        return results;
      },
      runOnce: true, // Run once on initial load, then individual calls refresh
    },

    {
      id: 'system-logs',
      name: 'Fetch System Logs',
      priority: 2, // High priority for admins
      userTypes: ['admin'],
      execute: async () => {
        await tacoStore.fetchSystemLogs();
      },
      refreshInterval: 30000, // Refresh every 30 seconds
    },

    {
      id: 'timer-status',
      name: 'Fetch Timer Status',
      priority: 2, // High priority for admins
      userTypes: ['admin'],
      execute: async () => {
        await tacoStore.refreshTimerStatus();
      },
      refreshInterval: 60000, // Refresh every 60 seconds
    },

    {
      id: 'nns-proposals',
      name: 'Fetch NNS Proposals',
      priority: 3, // Medium priority
      userTypes: ['admin'],
      execute: async () => {
        // Fetch NNS proposals
        console.log('Fetching NNS proposals...');
      },
      refreshInterval: 120000, // Refresh every 2 minutes
    },

    {
      id: 'neuron-status',
      name: 'Fetch Neuron Status',
      priority: 3, // Medium priority
      userTypes: ['admin'],
      execute: async () => {
        // Fetch neuron status
        console.log('Fetching neuron status...');
      },
      refreshInterval: 180000, // Refresh every 3 minutes
    },

    {
      id: 'trading-pairs',
      name: 'Fetch Trading Pairs',
      priority: 4, // Lower priority
      userTypes: ['admin'],
      execute: async () => {
        // Fetch trading pairs from exchanges
        console.log('Fetching trading pairs...');
      },
      refreshInterval: 300000, // Refresh every 5 minutes
    },

    // ==========================================
    // SHARED LOW-PRIORITY PROCESSES
    // ==========================================

    {
      id: 'analytics-data',
      name: 'Fetch Analytics Data',
      priority: 5, // Lowest priority
      userTypes: ['guest', 'member', 'admin'],
      execute: async () => {
        // Fetch analytics/telemetry data
        console.log('Fetching analytics data...');
      },
      refreshInterval: 600000, // Refresh every 10 minutes
    },

  ];
}

/**
 * Initialize background processes based on user type
 */
export async function initializeBackgroundProcesses(
  userType: UserType
): Promise<void> {
  const initStart = performance.now();
  console.log('🔵 [INIT] initializeBackgroundProcesses START for:', userType, `(${initStart.toFixed(2)}ms)`);

  const importStart = performance.now();
  console.log('🔵 [INIT] Importing background process manager...', `(${importStart.toFixed(2)}ms)`);
  const { backgroundProcessManager } = await import('./backgroundProcessManager');
  const importEnd = performance.now();
  console.log('✅ [INIT] Manager imported', `(${importEnd.toFixed(2)}ms, took ${(importEnd - importStart).toFixed(2)}ms)`);

  const getProcessStart = performance.now();
  console.log('🔵 [INIT] Getting background processes...', `(${getProcessStart.toFixed(2)}ms)`);
  // Register all processes
  const processes = getBackgroundProcesses();
  const getProcessEnd = performance.now();
  console.log('✅ [INIT] Found', processes.length, 'processes to register', `(${getProcessEnd.toFixed(2)}ms, took ${(getProcessEnd - getProcessStart).toFixed(2)}ms)`);

  const registerStart = performance.now();
  processes.forEach(process => {
    backgroundProcessManager.registerProcess(process);
  });
  const registerEnd = performance.now();
  console.log('✅ [INIT] All processes registered', `(${registerEnd.toFixed(2)}ms, took ${(registerEnd - registerStart).toFixed(2)}ms)`);

  const startProcessStart = performance.now();
  console.log('🔵 [INIT] About to start processes for user type:', userType, `(${startProcessStart.toFixed(2)}ms)`);
  // Start processes for the given user type
  await backgroundProcessManager.startProcesses(userType);
  const startProcessEnd = performance.now();
  console.log('✅ [INIT] Background processes started', `(${startProcessEnd.toFixed(2)}ms, took ${(startProcessEnd - startProcessStart).toFixed(2)}ms)`);

  const initEnd = performance.now();
  console.log('🏁 [INIT] initializeBackgroundProcesses COMPLETE', `(${initEnd.toFixed(2)}ms, total took ${(initEnd - initStart).toFixed(2)}ms)`);
}
