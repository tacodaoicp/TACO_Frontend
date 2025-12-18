# Worker Architecture Documentation

This document describes the SharedWorker/DedicatedWorker data fetching system used in the TACO DAO frontend.

## Overview

The frontend uses Web Workers to handle all canister data fetching off the main thread. This provides:
- Non-blocking UI during data fetches
- Shared data across browser tabs (via SharedWorker)
- Automatic caching in IndexedDB
- Priority-based fetch queuing
- Stale-while-revalidate pattern
- Idle detection to pause unnecessary refreshes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main Thread                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   App.vue    │    │  Views/*.vue │    │ Components   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│                    ┌────────────────┐                            │
│                    │  taco.store.ts │ ◄── Pinia store with refs  │
│                    └────────┬───────┘                            │
│                             │                                    │
│                             ▼                                    │
│                    ┌────────────────┐                            │
│                    │ worker-bridge  │ ◄── Unified API            │
│                    └────────┬───────┘                            │
│                             │                                    │
│                             ▼                                    │
│                    ┌────────────────┐                            │
│                    │ worker-adapter │ ◄── SharedWorker/Dedicated │
│                    └────────┬───────┘                            │
└─────────────────────────────┼───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Core Public  │    │   Secondary   │    │ Authenticated │
│    Worker     │    │ Public Worker │    │    Worker     │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ cryptoPrices  │    │votingPower    │    │ userAllocation│
│ tokenDetails  │    │ Metrics       │    │ systemLogs    │
│ treasury      │    │tacoProposals  │    │ voterDetails  │
│ Value         │    │proposalsThread│    │ priceHistory  │
│ aggregate     │    │allNames       │    │ alarmSystem   │
│ Allocation    │    │neuronSnapshot │    │ NNS data      │
│ tradingStatus │    │ Status        │    │ rewards data  │
│ timerStatus   │    │portfolioSnap  │    │ etc...        │
│               │    │ shotStatus    │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

## File Structure

```
src/taco_dao_frontend/src/
├── stores/
│   ├── taco.store.ts        # Main Pinia store - subscribes to worker data
│   └── worker-bridge.ts     # Bridge between main thread and workers
│
└── workers/
    ├── types.ts             # Shared types, data keys, priorities
    ├── worker-adapter.ts    # Abstracts SharedWorker vs DedicatedWorker
    │
    ├── core-public.worker.ts           # SharedWorker for core public data
    ├── core-public.dedicated.worker.ts # DedicatedWorker fallback
    │
    ├── secondary-public.worker.ts           # SharedWorker for secondary data
    ├── secondary-public.dedicated.worker.ts # DedicatedWorker fallback
    │
    ├── authenticated.worker.ts              # SharedWorker for auth data
    ├── authenticated.dedicated.worker.ts    # DedicatedWorker fallback
    │
    └── shared/
        ├── canister-ids.ts   # Canister ID resolution & network config
        ├── fetch-functions.ts # All canister fetch logic
        ├── indexed-db.ts     # IndexedDB caching utilities
        ├── priority-queue.ts # Priority-based fetch queue
        └── backoff.ts        # Exponential backoff for retries
```

## Data Keys

All data keys are defined in `workers/types.ts`. Each key is assigned to a specific worker:

### Core Public Worker
- `cryptoPrices` - External crypto prices
- `tokenDetails` - Treasury token balances
- `totalTreasuryValueInUsd` - Calculated treasury value
- `aggregateAllocation` - System-wide allocation
- `tradingStatus` - Trading system status
- `timerStatus` - Timer/scheduler status

### Secondary Public Worker
- `votingPowerMetrics` - Voting power statistics
- `tacoProposals` - TACO DAO proposals
- `proposalsThreads` - Proposal discussion threads
- `allNames` - Principal/neuron name mappings
- `neuronSnapshotStatus` - Neuron snapshot status
- `portfolioSnapshotStatus` - Portfolio snapshot status

### Authenticated Worker
Handles both public admin data and authenticated user data:

**User Data (requires authentication):**
- `userAllocation` - Current user's allocation

**Public Admin Data (anonymous agent):**
- `systemLogs`, `voterDetails`, `neuronAllocations`
- `priceHistory`, `portfolioHistory`, `circuitBreakerLogs`
- `rewardsConfiguration`, `distributionHistory`
- etc.

**Admin-Only Data (requires admin auth):**
- `alarmSystemStatus`, `alarmContacts`, `monitoringStatus`
- `votableProposals`, `periodicTimerStatus`
- `configurationIntervals`, `queueStatus`
- etc.

## Adding a New Data Key

### 1. Define the Key in types.ts

```typescript
// In workers/types.ts

// Add to DataKey union
export type DataKey =
  | 'cryptoPrices'
  | 'myNewDataKey'  // Add here
  // ...

// Assign to a worker
export const WORKER_ASSIGNMENT: Record<DataKey, 'core' | 'secondary' | 'auth'> = {
  // ...
  myNewDataKey: 'auth',  // Choose appropriate worker
}

// Set staleness threshold (how often to auto-refresh)
export const STALENESS_THRESHOLDS: Partial<Record<DataKey, number>> = {
  // ...
  myNewDataKey: 60_000,  // 60 seconds
}
```

### 2. Add Fetch Function

In `workers/shared/fetch-functions.ts`:

```typescript
export async function fetchMyNewData(agent: HttpAgent): Promise<MyDataType> {
  const actor = createActor(agent, 'myCanister')
  const result = await actor.getMyData()
  return result
}
```

### 3. Add to Worker's HANDLED_KEYS and fetchData

In the appropriate worker file (e.g., `authenticated.dedicated.worker.ts`):

```typescript
// Add to HANDLED_KEYS array
const HANDLED_KEYS: DataKey[] = [
  // ...
  'myNewDataKey',
]

// If it requires auth, add to appropriate category
const AUTH_REQUIRED_KEYS: DataKey[] = [
  // ...
  'myNewDataKey',  // If admin-only
]

// Add case in fetchData switch
async function fetchData(dataKey: DataKey): Promise<void> {
  // ...
  switch (dataKey) {
    // ...
    case 'myNewDataKey':
      data = serializeForTransfer(await fetchMyNewData(agent))
      break
  }
}
```

**Important:** Update BOTH the SharedWorker (`authenticated.worker.ts`) AND the DedicatedWorker (`authenticated.dedicated.worker.ts`) versions!

### 4. Subscribe in taco.store.ts

In `setupWorkerSubscriptions()`:

```typescript
workerUnsubscribers.push(
  workerBridge.subscribe('myNewDataKey', (data: unknown) => {
    cachedMyNewData.value = data as MyDataType
  })
)
```

### 5. Create Ref and Export

```typescript
// In taco.store.ts
const cachedMyNewData = ref<MyDataType | null>(null)

// Export in return statement
return {
  // ...
  cachedMyNewData,
}
```

## Using Worker Data in Components

### Option 1: Via Pinia Store (Recommended)

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTacoStore } from '@/stores/taco.store'

const tacoStore = useTacoStore()
const { cachedMyNewData } = storeToRefs(tacoStore)
</script>

<template>
  <div v-if="cachedMyNewData">
    {{ cachedMyNewData.someField }}
  </div>
</template>
```

### Option 2: Direct Worker Bridge (for manual refresh)

```vue
<script setup lang="ts">
import * as workerBridge from '@/stores/worker-bridge'

function refreshData() {
  workerBridge.fetch('myNewDataKey', true)  // force=true bypasses cache
}
</script>
```

## Worker Message Types

### Main Thread → Worker

| Type | Description |
|------|-------------|
| `FETCH` | Request data fetch (with optional force) |
| `SUBSCRIBE` | Subscribe to data updates |
| `UNSUBSCRIBE` | Unsubscribe from data updates |
| `SET_PRIORITY` | Update fetch priority for a key |
| `SET_VISIBILITY` | Tab visibility changed |
| `USER_ACTIVITY` | User interaction detected |
| `SET_IDENTITY` | Set authenticated identity |
| `CLEAR_IDENTITY` | Clear identity (logout) |
| `SET_ADMIN` | Update admin status |
| `SET_NETWORK` | Change network (ic/staging/local) |
| `INVALIDATE` | Mark data as stale |
| `PING` | Health check |

### Worker → Main Thread

| Type | Description |
|------|-------------|
| `CONNECTED` | Worker initialized |
| `CACHE_HIT` | Returning cached data |
| `DATA_UPDATE` | Fresh data fetched |
| `FETCH_STARTED` | Fetch in progress |
| `FETCH_COMPLETE` | Fetch completed |
| `FETCH_ERROR` | Fetch failed |
| `PONG` | Health check response |

## Priority System

Priorities determine fetch order:
1. `critical` - Immediate fetch
2. `high` - User-triggered refresh
3. `medium` - Visible data
4. `low` - Background refresh
5. `background` - Non-visible data

Route-based priorities are configured in `workers/types.ts` under `ROUTE_PRIORITIES`.

## Caching

- **In-Memory:** Each worker maintains a `dataStates` Map
- **IndexedDB:** Persistent cache survives page reloads
- **Staleness:** Configurable per data key via `STALENESS_THRESHOLDS`
- **Background Tabs:** 3x slower refresh rate (BACKGROUND_MULTIPLIER)
- **Idle Detection:** Stops refreshes after 5 minutes of inactivity

## SharedWorker vs DedicatedWorker

- **SharedWorker:** Used on desktop browsers, shared across tabs
- **DedicatedWorker:** Fallback for mobile browsers (iOS Safari, Android Chrome)

The `worker-adapter.ts` provides a unified interface. Both worker types must implement identical logic.

## Network Override

For testing against different networks:

```javascript
// In browser console or code
localStorage.setItem('taco_network_override', 'ic')      // mainnet
localStorage.setItem('taco_network_override', 'staging') // staging
localStorage.setItem('taco_network_override', 'local')   // local dfx
localStorage.removeItem('taco_network_override')         // auto-detect
```

Workers automatically clear cache and re-fetch when network changes.

## Troubleshooting

### Data not loading
1. Check browser console for worker errors
2. Verify data key is in `HANDLED_KEYS` of the correct worker
3. Ensure subscription is set up in `setupWorkerSubscriptions()`
4. Check if data key is in `WORKER_ASSIGNMENT`

### Stale data
1. Check `STALENESS_THRESHOLDS` for the data key
2. Verify `force=true` is passed for manual refresh
3. Check if idle detection paused refreshes

### Mobile browsers not working
1. Ensure both SharedWorker AND DedicatedWorker files are updated
2. Check Eruda console (add to index.html for debugging):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
   <script>eruda.init();</script>
   ```

### Identity/Auth issues
1. Verify `SET_IDENTITY` message is sent after login
2. Check authenticated worker has the identity set
3. Ensure `AUTH_REQUIRED_KEYS` includes the data key if it needs auth
