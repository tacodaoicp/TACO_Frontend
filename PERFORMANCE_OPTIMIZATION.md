# Performance Optimization - Lazy Loading Heavy Dependencies

## Problem
The app took 6-8 seconds to show content because `taco.store.ts` imported heavy @dfinity packages at the top level, which blocked JavaScript execution during module parsing:

- `@dfinity/auth-client` - 204K
- `@dfinity/agent` - 1.8M
- `@dfinity/sns` - 2.2M
- `@dfinity/utils` - 372K
- `@dfinity/identity` - 372K
- `@dfinity/ledger-icp` - 768K
- Plus IDL factory imports from declarations

These imports were parsed synchronously on app load, even though they're only needed when the user interacts with blockchain features (login, voting, transactions, etc.).

## Solution
Moved heavy @dfinity imports from top-level to **dynamic imports** that are loaded lazily when first needed.

### Architecture

```
App Load (Fast)                 First Blockchain Action (Lazy Load)
     │                                       │
     ▼                                       ▼
┌─────────────┐                    ┌─────────────────────┐
│ taco.store  │                    │ initializeShims()   │
│ (Refs Only) │                    │ - @dfinity/agent    │
│ - appLoading│                    │ - @dfinity/auth     │
│ - toasts    │                    │ - @dfinity/sns      │
│ - userLogin │                    │ - @dfinity/utils    │
└─────────────┘                    │ - IDL factories     │
                                   └─────────────────────┘
```

### Files Modified

#### 1. `src/stores/taco.store.ts`

**Before (Synchronous - Blocks Load):**
```typescript
import { AuthClient, IdbStorage, KEY_STORAGE_KEY } from "@dfinity/auth-client"
import { Actor, AnonymousIdentity } from "@dfinity/agent"
import { createAgent } from '@dfinity/utils'
import { DelegationIdentity } from '@dfinity/identity'
import { AccountIdentifier } from '@dfinity/ledger-icp'
import { SnsGovernanceCanister, SnsNeuronPermissionType } from '@dfinity/sns'
import { idlFactory } from "../../../declarations/ledger_canister/..."
// ... 9 more IDL imports
```

**After (Lazy - Loads On Demand):**
```typescript
// Type-only imports (no runtime cost)
import type { AuthClient } from "@dfinity/auth-client"
import type { Actor as ActorType } from "@dfinity/agent"
// ... etc

// Only small, frequently-used imports kept synchronous
import { Principal } from '@dfinity/principal'  // 220K, used everywhere
import { IDL } from '@dfinity/candid'  // 892K, required for GNSF_REGISTRY constant

// Lazy loaders
async function getAuthClientModule() {
    if (!_authClientModule) {
        _authClientModule = await import('@dfinity/auth-client')
    }
    return _authClientModule
}
// Similar loaders for: agent, utils, identity, ledger-icp, sns

// Shim variables populated on first use
let Actor, createAgent, AnonymousIdentity, DelegationIdentity, ...

// Called once on first blockchain interaction
async function initializeShims() {
    if (_shimsInitialized) return

    // Load all modules in parallel
    const [agentMod, utilsMod, ...] = await Promise.all([
        getAgentModule(),
        getUtilsModule(),
        // ...
    ])

    // Populate shims
    Actor = agentMod.Actor
    createAgent = utilsMod.createAgent
    // ...
}
```

**Key Pattern - Shims:**
The shim variables (`Actor`, `createAgent`, etc.) look like direct imports to existing code, but are lazily initialized. This minimizes changes to the rest of the 10,000+ line file.

#### 2. `src/main.js`

All views now use dynamic imports for code splitting:
```javascript
// Before
import AdminView from "./views/AdminView.vue"

// After
const AdminView = () => import("./views/AdminView.vue")
```

#### 3. `src/App.vue`

HomeView is loaded asynchronously:
```javascript
const HomeView = defineAsyncComponent(() => import('./views/HomeView.vue'))
```

#### 4. `index.html`

Static LCP (Largest Contentful Paint) image renders before JavaScript:
```html
<body style="background-color: #f5a623; margin: 0;">
  <!-- Shows immediately, hidden once Vue mounts -->
  <div id="static-lcp">
    <img src="/src/assets/images/tacoDaoTaco.svg" ...>
  </div>
  <div id="app"></div>
</body>
```

### Impact

| Metric | Before | After |
|--------|--------|-------|
| LCP (4x CPU, Fast 4G) | 36s | ~2-3s |
| Initial JS Parse | ~6s | <1s |
| First Blockchain Op | ~0ms | ~300-500ms |

- **Initial Load**: Dramatically faster - only Vue, Pinia, Router, and minimal store state
- **First Blockchain Interaction**: One-time delay (~300-500ms) to load @dfinity modules
- **Subsequent Interactions**: No additional delay - modules cached in memory

### What Remains Synchronous

1. **`@dfinity/principal`** (220K) - Small and used throughout the app

### IDL (Candid) Lazy Loading

The `@dfinity/candid` module (892K) is now lazy-loaded via `getGNSFRegistry()`:

```typescript
// Before: Loaded on app start
export const GNSF_REGISTRY: Record<string, GNSFunctionInfo> = {
    'stopRebalancing': {
        parameterTypes: [IDL.Opt(IDL.Text)],  // IDL used at module load
    },
    // ...
}

// After: Loaded when dialog opens
let _gnsfRegistryCache: Record<string, GNSFunctionInfo> | null = null
export async function getGNSFRegistry(): Promise<Record<string, GNSFunctionInfo>> {
    if (_gnsfRegistryCache) return _gnsfRegistryCache
    const { IDL } = await getCandidModule()
    _gnsfRegistryCache = { /* ... */ }
    return _gnsfRegistryCache
}
```

Components using GNSF_REGISTRY must load it asynchronously:
```typescript
// GNSFProposalDialog.vue
const registry = ref<Record<string, GNSFunctionInfo> | null>(null)
watch(() => props.show, async (show) => {
  if (show && !registry.value) {
    registry.value = await getGNSFRegistry()
  }
})

```

### Worker Serialization Optimization

The SharedWorker architecture requires serializing data (BigInt, Principal, Uint8Array) to pass between workers and the main thread. This was a significant bottleneck:

**Problem:**
- `Principal.toText()` during serialization: ~491ms
- `Principal.fromText()` during deserialization: ~419ms
- These operations are CPU-intensive (CRC32, Base32 encoding)

**Solution - Caching:**
```typescript
// src/workers/shared/fetch-functions.ts

// Cache for Principal.fromText() - avoids repeated expensive conversions
const principalCache = new Map<string, Principal>()

// Cache for Principal.toText() - uses WeakMap for GC
const principalToTextCache = new WeakMap<Principal, string>()

function getCachedPrincipal(text: string): Principal {
  let principal = principalCache.get(text)
  if (!principal) {
    principal = Principal.fromText(text)
    principalCache.set(text, principal)
    principalToTextCache.set(principal, text) // Cache reverse too
  }
  return principal
}

function getCachedPrincipalText(principal: Principal): string {
  let text = principalToTextCache.get(principal)
  if (!text) {
    text = principal.toText()
    principalToTextCache.set(principal, text)
  }
  return text
}
```

**Impact:**
- First page load: Same (cache is cold)
- Subsequent navigations: Much faster (Principals cached)
- Data refreshes: Much faster (same Principals reused)

#### 5. `src/composables/useAdminCheck.ts`

Lazy-loads `@dfinity/agent` and `@dfinity/auth-client` only when admin check is actually performed:

```typescript
// Before: Loaded when any admin view imports this
import { Actor, HttpAgent } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'

// After: Loaded only when checkAdminStatus() is called
let _agentModule: typeof import('@dfinity/agent') | null = null
let _authClientModule: typeof import('@dfinity/auth-client') | null = null

async function getAgentModule() {
  if (!_agentModule) {
    _agentModule = await import('@dfinity/agent')
  }
  return _agentModule
}

const checkAdminStatus = async () => {
  const { AuthClient } = await getAuthClientModule()
  const { Actor, HttpAgent } = await getAgentModule()
  // ... rest of the function
}
```

### Deferred Deserialization

Worker message callbacks now use `requestIdleCallback` (or `setTimeout(0)` fallback) to defer deserialization:

```typescript
// src/workers/shared/fetch-functions.ts
export function deserializeDeferred<T>(obj: unknown): Promise<T> {
  return new Promise((resolve) => {
    const scheduleWork = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 0)
    scheduleWork(() => {
      resolve(deserializeFromTransfer(obj) as T)
    })
  })
}

// taco.store.ts - worker subscriptions now use async/await
workerBridge.subscribe('tokenDetails', async (data: unknown) => {
  const tokenDetails = await deserializeDeferred<TrustedTokenEntry[]>(data)
  fetchedTokenDetails.value = tokenDetails
})
```

**Impact:**
- Browser can render between deserialization operations
- UI shell appears immediately, data populates progressively
- No more blocking main thread during initial page load

**Which subscriptions are deferred:**
- All heavy data (tokenDetails, aggregateAllocation, tradingStatus, timerStatus)
- All admin data (systemLogs, voterDetails, priceHistory, etc.)
- Only cryptoPrices and allNames remain synchronous (lightweight data)

### Future Improvements

1. **Split taco.store.ts** - The 10,000+ line store could be split into domain-specific stores
2. **Preload on idle** - Could preload @dfinity modules after initial render during idle time
3. **Web Worker for heavy ops** - Some blockchain operations could run in workers
4. **Keep Principals as strings in UI** - Many places just display the Principal text, no need to reconstitute the object

## Testing

1. Run type check: `npx vue-tsc --noEmit`
2. Build: `npx vite build`
3. Test performance: Chrome DevTools > Performance > 4x CPU slowdown + Fast 4G
