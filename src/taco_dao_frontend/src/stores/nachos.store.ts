/**
 * NACHOS Vault Store - Frontend implementation for NACHOS vault functionality
 * Provides all state management, canister interactions, caching, and polling
 * for the NACHOS index token vault (staging only)
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from './taco.store'
import { getEffectiveNetwork } from '../config/network-config'
import { workerBridge } from './worker-bridge'
import { deserializeFromTransfer } from '../workers/shared/fetch-functions'
// Vault IDL factory now managed by taco.store's lazy loader + actor cache
import type {
  MintResult, BurnResult, NachosError, CachedNAV, ActiveDeposit,
  MintRecord, BurnRecord, NavSnapshot, MintMode, DepositStatus,
  TransferStatus, TransferOperationType, AcceptedTokenConfig
} from '../../../declarations/nachos_vault/nachos_vault.did.d.ts'

// ============================================================================
// Constants
// ============================================================================

const NACHOS_VAULT_ID = () => {
  switch (getEffectiveNetwork()) {
    case 'staging': return 'p4nog-baaaa-aaaad-qkwpa-cai'
    default: return 'p4nog-baaaa-aaaad-qkwpa-cai'
  }
}
const NACHOS_LEDGER_ID = 'pabnq-2qaaa-aaaam-qhryq-cai'
const ICP_LEDGER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const TREASURY_ID = () => {
  switch (getEffectiveNetwork()) {
    case 'ic': return 'v6t5d-6yaaa-aaaan-qzzja-cai'
    case 'staging': return 'tptia-syaaa-aaaai-atieq-cai'
    default: return 'tptia-syaaa-aaaai-atieq-cai'
  }
}

// Subaccounts (32-byte Uint8Arrays)
const DEPOSIT_SUBACCOUNT = (() => { const a = new Uint8Array(32); a[0] = 2; return a })()
const BURN_SUBACCOUNT = (() => { const a = new Uint8Array(32); a[0] = 1; return a })()

// Polling intervals
const POLL_FAST_MS = 5_000
const POLL_SLOW_MS = 15_000
const POLL_SWITCH_AFTER_MS = 60_000

// localStorage key prefix
const DEPOSIT_CACHE_PREFIX = 'nachos_ops_'

// ============================================================================
// Interfaces
// ============================================================================

export interface CachedOperation {
  type: 'mint_icp' | 'mint_token' | 'mint_portfolio' | 'burn'
  userPrincipal: string
  tokenPrincipal: string
  blockNumber: string      // BigInt serialized as string
  amount: string           // BigInt serialized as string
  status: 'pending_mint' | 'minting' | 'completed' | 'failed' | 'cancelled'
  timestamp: number
  mintMode?: string        // 'ICP' | 'SingleToken' | 'PortfolioShare'
  error?: string
  mintId?: string
  burnId?: string
  refundTaskId?: string
}

// ============================================================================
// Store
// ============================================================================

export const useNachosStore = defineStore('nachos', () => {
  const tacoStore = useTacoStore()

  // ============================================================================
  // State
  // ============================================================================

  const dashboardData = ref<any | null>(null)
  const userActivity = ref<any | null>(null)
  const navHistory = ref<NavSnapshot[]>([])
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)
  const activeOperationStatus = ref<string | null>(null)
  const cachedOperations = ref<CachedOperation[]>([])
  const slippageBP = ref(100) // 1% default
  const vaultConfig = ref<any | null>(null)

  // Polling state (not exposed)
  let pollTimeoutId: ReturnType<typeof setTimeout> | null = null
  let pollStartTime = 0

  // ============================================================================
  // Worker Subscriptions (Auto-update from worker cache)
  // ============================================================================

  // Track worker unsubscribers for cleanup
  const workerUnsubscribers: (() => void)[] = []

  // Subscribe to nachos worker data - updates store refs automatically
  workerUnsubscribers.push(
    workerBridge.subscribe('nachosVaultDashboard', (data: unknown) => {
      if (data) {
        dashboardData.value = deserializeFromTransfer(data)
        lastError.value = null
      }
    })
  )

  workerUnsubscribers.push(
    workerBridge.subscribe('nachosConfig', (data: unknown) => {
      if (data) {
        vaultConfig.value = deserializeFromTransfer(data)
      }
    })
  )

  workerUnsubscribers.push(
    workerBridge.subscribe('nachosNavHistory', (data: unknown) => {
      if (data && Array.isArray(data)) {
        navHistory.value = deserializeFromTransfer(data) as NavSnapshot[]
      }
    })
  )

  // ============================================================================
  // Computed
  // ============================================================================

  const userPrincipal = computed(() => tacoStore.userPrincipal)
  const userLoggedIn = computed(() => tacoStore.userLoggedIn)
  const icpPriceUsd = computed(() => tacoStore.icpPriceUsd || 0)

  // Dashboard-derived computed
  const nav = computed(() => dashboardData.value?.nav?.[0] ?? null)
  const navPerToken = computed(() => nav.value?.navPerTokenE8s ?? 0n)
  const portfolioValueICP = computed(() => dashboardData.value?.portfolioValueICP ?? 0n)
  const nachosSupply = computed(() => dashboardData.value?.nachosSupply ?? 0n)
  const portfolio = computed(() => dashboardData.value?.portfolio ?? [])
  const mintingEnabled = computed(() => dashboardData.value?.mintingEnabled ?? false)
  const burningEnabled = computed(() => dashboardData.value?.burningEnabled ?? false)
  const systemPaused = computed(() => dashboardData.value?.systemPaused ?? false)
  const circuitBreakerActive = computed(() => dashboardData.value?.circuitBreakerActive ?? false)
  const genesisComplete = computed(() => dashboardData.value?.genesisComplete ?? false)
  const hasPausedTokens = computed(() => dashboardData.value?.hasPausedTokens ?? false)
  const pausedTokens = computed(() => dashboardData.value?.pausedTokens ?? [])
  const acceptedTokens = computed(() => dashboardData.value?.acceptedTokens ?? [])
  const mintFeeBasisPoints = computed(() => dashboardData.value?.mintFeeBasisPoints ?? 0n)
  const burnFeeBasisPoints = computed(() => dashboardData.value?.burnFeeBasisPoints ?? 0n)
  const minMintValueICP = computed(() => dashboardData.value?.minMintValueICP ?? 1_000_000n)
  const minBurnValueICP = computed(() => dashboardData.value?.minBurnValueICP ?? 1_000_000n)
  const dataSource = computed(() => dashboardData.value?.dataSource ?? 'unknown')

  const canMint = computed(() =>
    genesisComplete.value &&
    !systemPaused.value &&
    mintingEnabled.value &&
    !circuitBreakerActive.value &&
    !hasPausedTokens.value
  )
  const canBurn = computed(() =>
    genesisComplete.value &&
    !systemPaused.value &&
    burningEnabled.value &&
    !circuitBreakerActive.value
  )

  // Config-derived limits
  const maxMintAmountICP = computed(() => vaultConfig.value?.maxMintAmountICP ?? 0n)
  const maxBurnAmountNachos = computed(() => vaultConfig.value?.maxBurnAmountNachos ?? 0n)
  const maxMintICPPerUser4Hours = computed(() => vaultConfig.value?.maxMintICPPerUser4Hours ?? 0n)
  const maxBurnNachosPerUser4Hours = computed(() => vaultConfig.value?.maxBurnNachosPerUser4Hours ?? 0n)
  const maxMintOpsPerUser4Hours = computed(() => vaultConfig.value?.maxMintOpsPerUser4Hours ?? 0n)
  const maxBurnOpsPerUser4Hours = computed(() => vaultConfig.value?.maxBurnOpsPerUser4Hours ?? 0n)

  // User rate limits from getUserActivity
  const userRateLimits = computed(() => userActivity.value?.rateLimits ?? null)

  // Global limits from dashboard
  const globalMintIn4h = computed(() => dashboardData.value?.globalMintIn4h ?? 0n)
  const globalBurnIn4h = computed(() => dashboardData.value?.globalBurnIn4h ?? 0n)
  const maxMintPer4h = computed(() => dashboardData.value?.maxMintPer4h ?? 0n)
  const maxBurnPer4h = computed(() => dashboardData.value?.maxBurnPer4h ?? 0n)

  // Remaining capacity — mint (ICP e8s)
  const remainingMintICP = computed(() => {
    if (!userRateLimits.value) return null
    const userRemaining = Number(maxMintICPPerUser4Hours.value) - Number(userRateLimits.value.mintValueIn4h)
    const globalRemaining = Number(maxMintPer4h.value) - Number(globalMintIn4h.value)
    const candidates = [userRemaining, globalRemaining]
    if (Number(maxMintAmountICP.value) > 0) candidates.push(Number(maxMintAmountICP.value))
    return Math.max(0, Math.min(...candidates))
  })

  const remainingMintOps = computed(() => {
    if (!userRateLimits.value) return null
    return Math.max(0, Number(maxMintOpsPerUser4Hours.value) - Number(userRateLimits.value.mintOpsIn4h))
  })

  // Remaining capacity — burn (NACHOS e8s)
  const remainingBurnNachos = computed(() => {
    if (!userRateLimits.value) return null
    const userRemaining = Number(maxBurnNachosPerUser4Hours.value) - Number(userRateLimits.value.burnValueIn4h)
    const globalRemaining = Number(maxBurnPer4h.value) - Number(globalBurnIn4h.value)
    const candidates = [userRemaining, globalRemaining]
    if (Number(maxBurnAmountNachos.value) > 0) candidates.push(Number(maxBurnAmountNachos.value))
    return Math.max(0, Math.min(...candidates))
  })

  const remainingBurnOps = computed(() => {
    if (!userRateLimits.value) return null
    return Math.max(0, Number(maxBurnOpsPerUser4Hours.value) - Number(userRateLimits.value.burnOpsIn4h))
  })

  // ============================================================================
  // Actor Creation (follows kong.store.ts pattern)
  // ============================================================================

  const createVaultActor = async (authenticated = false) => {
    return authenticated
      ? await tacoStore.createNachosVaultActor()
      : await tacoStore.createNachosVaultActorAnonymous()
  }

  // ICRC1 token actor — inline IDL from kong.store.ts
  const createTokenActor = async (tokenPrincipal: string) => {
    const agent = await tacoStore.getAuthenticatedAgent()
    const icrcIDL = ({ IDL }: any) => {
      const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
      })
      const TransferArg = IDL.Record({
        'to': Account,
        'fee': IDL.Opt(IDL.Nat),
        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'created_at_time': IDL.Opt(IDL.Nat64),
        'amount': IDL.Nat,
      })
      const TransferError = IDL.Variant({
        'GenericError': IDL.Record({ 'message': IDL.Text, 'error_code': IDL.Nat }),
        'TemporarilyUnavailable': IDL.Null,
        'BadBurn': IDL.Record({ 'min_burn_amount': IDL.Nat }),
        'Duplicate': IDL.Record({ 'duplicate_of': IDL.Nat }),
        'BadFee': IDL.Record({ 'expected_fee': IDL.Nat }),
        'CreatedInFuture': IDL.Record({ 'ledger_time': IDL.Nat64 }),
        'TooOld': IDL.Null,
        'InsufficientFunds': IDL.Record({ 'balance': IDL.Nat }),
      })
      const TransferResult = IDL.Variant({ 'Ok': IDL.Nat, 'Err': TransferError })
      return IDL.Service({
        'icrc1_transfer': IDL.Func([TransferArg], [TransferResult], []),
        'icrc1_balance_of': IDL.Func([Account], [IDL.Nat], ['query']),
        'icrc1_fee': IDL.Func([], [IDL.Nat], ['query']),
      })
    }
    return Actor.createActor(icrcIDL, { agent, canisterId: tokenPrincipal })
  }

  // Anonymous balance check actor
  const createBalanceActor = async (tokenPrincipal: string) => {
    const agent = await tacoStore.getAnonymousAgentPublic()
    const icrcIDL = ({ IDL }: any) => {
      const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
      })
      return IDL.Service({
        'icrc1_balance_of': IDL.Func([Account], [IDL.Nat], ['query']),
      })
    }
    return Actor.createActor(icrcIDL, { agent, canisterId: tokenPrincipal })
  }

  // ============================================================================
  // Formatting Utilities
  // ============================================================================

  const formatE8s = (e8s: bigint, decimals = 8): string => {
    if (e8s === 0n) return '0'
    const divisor = 10n ** BigInt(decimals)
    const whole = e8s / divisor
    const frac = e8s % divisor
    if (frac === 0n) return whole.toString()
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '')
    return `${whole}.${fracStr}`
  }

  const formatICP = (e8s: bigint): string => formatE8s(e8s, 8) + ' ICP'

  const formatNachos = (e8s: bigint): string => formatE8s(e8s, 8) + ' NACHOS'

  const formatBasisPoints = (bp: bigint): string => (Number(bp) / 100).toFixed(2) + '%'

  // ============================================================================
  // Error Mapping — All NachosError variants
  // ============================================================================

  const mapNachosError = (error: NachosError): string => {
    if ('PriceStale' in error) return 'Token prices are stale. Please wait for price refresh.'
    if ('DepositAlreadyConsumed' in error) return 'This deposit has already been used.'
    if ('MintingDisabled' in error) return 'Minting is currently disabled.'
    if ('DepositNotFound' in error) return 'Deposit not found. It may have expired.'
    if ('TransferError' in error) return `Transfer error: ${(error as any).TransferError}`
    if ('InvalidPrice' in error) return 'Invalid price data. Please try again.'
    if ('MintLimitExceeded' in error) {
      const d = (error as any).MintLimitExceeded
      return `Mint limit exceeded. ${formatE8s(d.recentMints)} / ${formatE8s(d.maxPer4Hours)} ICP used in the last 4 hours.`
    }
    if ('BlockAlreadyProcessed' in error) return 'This block has already been processed.'
    if ('TokenNotActive' in error) return 'This token is not currently active in the portfolio.'
    if ('GenesisNotComplete' in error) return 'System not yet initialized.'
    if ('PortfolioTokenPaused' in error) {
      const names = (error as any).PortfolioTokenPaused.pausedTokens.map((t: any) => t.symbol).join(', ')
      return `Minting paused: ${names} have stale prices.`
    }
    if ('BurningDisabled' in error) return 'Burning is currently disabled.'
    if ('InsufficientBalance' in error) return 'Insufficient balance.'
    if ('TokenPaused' in error) return 'This token is currently paused.'
    if ('NotAuthorized' in error) return 'Not authorized to perform this action.'
    if ('BelowMinimumValue' in error) return `Below minimum value of ${formatE8s(minMintValueICP.value)} ICP.`
    if ('CircuitBreakerActive' in error) return 'Circuit breaker active. Trading halted due to unusual market conditions.'
    if ('SystemPaused' in error) return 'System is currently paused for maintenance.'
    if ('UnexpectedError' in error) return `Unexpected error: ${(error as any).UnexpectedError}`
    if ('BlockVerificationFailed' in error) return `Block verification failed: ${(error as any).BlockVerificationFailed}`
    if ('DepositExpired' in error) return 'Deposit expired (older than 30 days).'
    if ('RateLimitExceeded' in error) return 'Rate limit exceeded. Please wait up to 4 hours.'
    if ('GenesisAlreadyDone' in error) return 'Genesis already completed.'
    if ('PortfolioShareMismatch' in error) return 'Deposit proportions do not match the portfolio. All deposits will be refunded.'
    if ('BurnLimitExceeded' in error) {
      const d = (error as any).BurnLimitExceeded
      return `Burn limit exceeded. ${formatE8s(d.recentBurns)} / ${formatE8s(d.maxPer4Hours)} used in the last 4 hours.`
    }
    if ('NotDepositor' in error) return 'You are not the depositor of this deposit.'
    if ('InsufficientLiquidity' in error) return 'Insufficient liquidity for this token.'
    if ('InvalidAllocation' in error) return 'Invalid allocation.'
    if ('DepositAlreadyCancelled' in error) return 'This deposit has already been cancelled.'
    if ('AllocationExceeded' in error) return 'This token is at its allocation limit.'
    if ('RollbackFailed' in error) return `Rollback failed: ${(error as any).RollbackFailed}`
    if ('SlippageExceeded' in error) return 'Slippage exceeded. The price changed too much. Try increasing slippage tolerance.'
    if ('AboveMaximumValue' in error) {
      const d = (error as any).AboveMaximumValue
      return `Amount exceeds maximum of ${formatE8s(d.max)} per transaction. You requested ${formatE8s(d.requested)}.`
    }
    if ('UserMintLimitExceeded' in error) {
      const d = (error as any).UserMintLimitExceeded
      return `You've minted ${formatE8s(d.recentMints)} ICP in the last 4 hours (limit: ${formatE8s(d.maxPer4Hours)}).`
    }
    if ('UserBurnLimitExceeded' in error) {
      const d = (error as any).UserBurnLimitExceeded
      return `You've burned ${formatE8s(d.recentBurns)} NACHOS in the last 4 hours (limit: ${formatE8s(d.maxPer4Hours)}).`
    }
    if ('TokenNotAccepted' in error) return 'This token is not accepted for minting.'
    if ('OperationInProgress' in error) return 'Another operation is in progress. Please wait.'
    return 'An unknown error occurred.'
  }

  // ============================================================================
  // Slippage Calculation
  // ============================================================================

  const calculateMinimumReceive = (estimate: bigint, slippageBasisPoints?: number): bigint => {
    const bp = BigInt(slippageBasisPoints ?? slippageBP.value)
    return (estimate * (10000n - bp)) / 10000n
  }

  // ============================================================================
  // localStorage Cache — Deposit Tracking
  // ============================================================================

  const getCacheKey = (): string => DEPOSIT_CACHE_PREFIX + userPrincipal.value

  const saveOpsToCache = () => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(cachedOperations.value))
    } catch (e) { console.error('Failed to save nachos ops cache:', e) }
  }

  const loadOpsFromCache = () => {
    try {
      const raw = localStorage.getItem(getCacheKey())
      if (raw) {
        cachedOperations.value = JSON.parse(raw)
      } else {
        cachedOperations.value = []
      }
    } catch (e) {
      console.error('Failed to load nachos ops cache:', e)
      cachedOperations.value = []
    }
  }

  const addCachedOp = (op: CachedOperation) => {
    cachedOperations.value.push(op)
    saveOpsToCache()
  }

  const updateCachedOp = (blockNumber: string, tokenPrincipal: string, updates: Partial<CachedOperation>) => {
    const idx = cachedOperations.value.findIndex(
      o => o.blockNumber === blockNumber && o.tokenPrincipal === tokenPrincipal
    )
    if (idx !== -1) {
      cachedOperations.value[idx] = { ...cachedOperations.value[idx], ...updates }
      saveOpsToCache()
    }
  }

  const pruneOldOps = () => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    cachedOperations.value = cachedOperations.value.filter(
      op => op.timestamp > cutoff || op.status === 'pending_mint' || op.status === 'failed'
    )
    saveOpsToCache()
  }

  // ============================================================================
  // Query Actions (anonymous, read-only)
  // ============================================================================

  const loadDashboard = async (mintEstimateE8s?: bigint, burnEstimateE8s?: bigint) => {
    try {
      const actor = await createVaultActor(false)
      const result = await (actor as any).getVaultDashboard(
        mintEstimateE8s !== undefined ? [mintEstimateE8s] : [],
        burnEstimateE8s !== undefined ? [burnEstimateE8s] : []
      )
      dashboardData.value = result
      lastError.value = null
    } catch (e: any) {
      console.error('Failed to load vault dashboard:', e)
      lastError.value = 'Failed to load vault dashboard'
    }
  }

  const loadUserActivity = async (mintLimit = 10n, mintOffset = 0n, burnLimit = 10n, burnOffset = 0n) => {
    if (!userLoggedIn.value) return
    try {
      const actor = await createVaultActor(false)
      const result = await (actor as any).getUserActivity(
        Principal.fromText(userPrincipal.value),
        mintLimit, mintOffset, burnLimit, burnOffset
      )
      userActivity.value = result
    } catch (e: any) {
      console.error('Failed to load user activity:', e)
    }
  }

  const loadNAVHistory = async () => {
    try {
      const actor = await createVaultActor(false)
      navHistory.value = await (actor as any).getNAVHistoryAdaptive()
    } catch (e: any) {
      console.error('Failed to load NAV history:', e)
    }
  }

  const loadConfig = async () => {
    try {
      const actor = await createVaultActor(false)
      vaultConfig.value = await (actor as any).getConfig()
    } catch (e: any) {
      console.error('Failed to load vault config:', e)
    }
  }

  // ============================================================================
  // Estimate Actions (anonymous)
  // ============================================================================

  const estimateMintICP = async (amountE8s: bigint) => {
    const actor = await createVaultActor(false)
    return await (actor as any).estimateMintICP(amountE8s)
  }

  const estimateMintWithToken = async (tokenPrincipal: Principal, amount: bigint) => {
    const actor = await createVaultActor(false)
    const result = await (actor as any).estimateMintWithToken(tokenPrincipal, amount)
    if ('ok' in result) return result.ok
    throw new Error(mapNachosError(result.err))
  }

  const getRequiredPortfolioShares = async (totalValueICP: bigint) => {
    const actor = await createVaultActor(false)
    return await (actor as any).getRequiredPortfolioShares(totalValueICP)
  }

  const estimateBurn = async (nachosAmount: bigint) => {
    const actor = await createVaultActor(false)
    return await (actor as any).estimateBurnTokens(nachosAmount)
  }

  // ============================================================================
  // ICRC1 Transfer Actions (authenticated)
  // ============================================================================

  const depositICPForMint = async (amountE8s: bigint): Promise<bigint> => {
    const tokenActor = await createTokenActor(ICP_LEDGER_ID)
    const createdAt = BigInt(Date.now()) * 1_000_000n // nanoseconds — fixed across retries for deduplication
    let lastError: any

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await (tokenActor as any).icrc1_transfer({
          to: {
            owner: Principal.fromText(TREASURY_ID()),
            subaccount: [DEPOSIT_SUBACCOUNT],
          },
          amount: amountE8s,
          fee: [10_000n],
          memo: [],
          from_subaccount: [],
          created_at_time: [createdAt],
        })
        if ('Ok' in result) return result.Ok
        if ('Err' in result && 'Duplicate' in result.Err) return result.Err.Duplicate.duplicate_of
        const errStr = JSON.stringify(result.Err, (_, v) => typeof v === 'bigint' ? v.toString() : v)
        if ('Err' in result && ('InsufficientFunds' in result.Err || 'BadFee' in result.Err)) {
          throw new Error(`ICP transfer failed: ${errStr}`)
        }
        lastError = new Error(`ICP transfer failed: ${errStr}`)
      } catch (e: any) {
        lastError = e
        if (e.message?.includes('InsufficientFunds') || e.message?.includes('BadFee')) throw e
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
    throw lastError
  }

  const depositTokenForMint = async (tokenPrincipal: string, amount: bigint, fee: bigint): Promise<bigint> => {
    const tokenActor = await createTokenActor(tokenPrincipal)
    const createdAt = BigInt(Date.now()) * 1_000_000n
    let lastError: any

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await (tokenActor as any).icrc1_transfer({
          to: {
            owner: Principal.fromText(TREASURY_ID()),
            subaccount: [DEPOSIT_SUBACCOUNT],
          },
          amount,
          fee: [fee],
          memo: [],
          from_subaccount: [],
          created_at_time: [createdAt],
        })
        if ('Ok' in result) return result.Ok
        if ('Err' in result && 'Duplicate' in result.Err) return result.Err.Duplicate.duplicate_of
        const errStr = JSON.stringify(result.Err, (_, v) => typeof v === 'bigint' ? v.toString() : v)
        if ('Err' in result && ('InsufficientFunds' in result.Err || 'BadFee' in result.Err)) {
          throw new Error(`Token transfer failed: ${errStr}`)
        }
        lastError = new Error(`Token transfer failed: ${errStr}`)
      } catch (e: any) {
        lastError = e
        if (e.message?.includes('InsufficientFunds') || e.message?.includes('BadFee')) throw e
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
    throw lastError
  }

  const depositNachosForBurn = async (nachosAmount: bigint): Promise<bigint> => {
    const tokenActor = await createTokenActor(NACHOS_LEDGER_ID)
    const createdAt = BigInt(Date.now()) * 1_000_000n
    let lastError: any

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await (tokenActor as any).icrc1_transfer({
          to: {
            owner: Principal.fromText(NACHOS_VAULT_ID()),
            subaccount: [BURN_SUBACCOUNT],
          },
          amount: nachosAmount,
          fee: [10_000n],
          memo: [],
          from_subaccount: [],
          created_at_time: [createdAt],
        })
        if ('Ok' in result) return result.Ok
        if ('Err' in result && 'Duplicate' in result.Err) return result.Err.Duplicate.duplicate_of
        const errStr = JSON.stringify(result.Err, (_, v) => typeof v === 'bigint' ? v.toString() : v)
        if ('Err' in result && ('InsufficientFunds' in result.Err || 'BadFee' in result.Err)) {
          throw new Error(`NACHOS transfer failed: ${errStr}`)
        }
        lastError = new Error(`NACHOS transfer failed: ${errStr}`)
      } catch (e: any) {
        lastError = e
        if (e.message?.includes('InsufficientFunds') || e.message?.includes('BadFee')) throw e
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
    throw lastError
  }

  const getTokenBalance = async (tokenPrincipal: string): Promise<bigint> => {
    const actor = await createBalanceActor(tokenPrincipal)
    return await (actor as any).icrc1_balance_of({
      owner: Principal.fromText(userPrincipal.value),
      subaccount: [],
    }) as bigint
  }

  // ============================================================================
  // Mint Actions (authenticated) — Full flow with caching
  // ============================================================================

  const mintWithICP = async (amountE8s: bigint): Promise<MintResult> => {
    activeOperationStatus.value = 'depositing'
    let blockNumber: bigint

    try {
      blockNumber = await depositICPForMint(amountE8s)
    } catch (e: any) {
      activeOperationStatus.value = null
      throw e
    }

    addCachedOp({
      type: 'mint_icp',
      userPrincipal: userPrincipal.value,
      tokenPrincipal: ICP_LEDGER_ID,
      blockNumber: blockNumber.toString(),
      amount: amountE8s.toString(),
      status: 'minting',
      timestamp: Date.now(),
      mintMode: 'ICP',
    })

    try {
      activeOperationStatus.value = 'minting'
      const estimate = await estimateMintICP(amountE8s)
      const minNachos = calculateMinimumReceive(estimate.nachosEstimate)

      const actor = await createVaultActor(true)
      const result = await (actor as any).mintNachos(blockNumber, minNachos, [], [])

      if ('ok' in result) {
        updateCachedOp(blockNumber.toString(), ICP_LEDGER_ID, {
          status: 'completed',
          mintId: result.ok.mintId.toString(),
        })
        return result.ok
      } else {
        const errorMsg = mapNachosError(result.err)
        updateCachedOp(blockNumber.toString(), ICP_LEDGER_ID, {
          status: 'failed',
          error: errorMsg,
        })
        throw new Error(errorMsg)
      }
    } catch (e: any) {
      updateCachedOp(blockNumber.toString(), ICP_LEDGER_ID, {
        status: 'failed',
        error: e.message || 'Mint failed',
      })
      throw e
    } finally {
      activeOperationStatus.value = null
    }
  }

  const mintWithToken = async (tokenPrincipal: string, amount: bigint, tokenFee: bigint): Promise<MintResult> => {
    activeOperationStatus.value = 'depositing'
    let blockNumber: bigint

    try {
      blockNumber = await depositTokenForMint(tokenPrincipal, amount, tokenFee)
    } catch (e: any) {
      activeOperationStatus.value = null
      throw e
    }

    addCachedOp({
      type: 'mint_token',
      userPrincipal: userPrincipal.value,
      tokenPrincipal,
      blockNumber: blockNumber.toString(),
      amount: amount.toString(),
      status: 'minting',
      timestamp: Date.now(),
      mintMode: 'SingleToken',
    })

    try {
      activeOperationStatus.value = 'minting'
      const estimate = await estimateMintWithToken(Principal.fromText(tokenPrincipal), amount)
      const minNachos = calculateMinimumReceive(estimate.nachosEstimate)

      const actor = await createVaultActor(true)
      const result = await (actor as any).mintNachosWithToken(
        Principal.fromText(tokenPrincipal), blockNumber, minNachos, [], []
      )

      if ('ok' in result) {
        updateCachedOp(blockNumber.toString(), tokenPrincipal, { status: 'completed', mintId: result.ok.mintId.toString() })
        return result.ok
      } else {
        const errorMsg = mapNachosError(result.err)
        updateCachedOp(blockNumber.toString(), tokenPrincipal, { status: 'failed', error: errorMsg })
        throw new Error(errorMsg)
      }
    } catch (e: any) {
      updateCachedOp(blockNumber.toString(), tokenPrincipal, { status: 'failed', error: e.message })
      throw e
    } finally {
      activeOperationStatus.value = null
    }
  }

  const mintWithPortfolioShare = async (
    deposits: Array<{ token: string; amount: bigint; fee: bigint }>,
    totalEstimateNachos: bigint
  ): Promise<MintResult> => {
    activeOperationStatus.value = 'depositing'

    try {
      const depositInfos: Array<{ token: Principal; blockNumber: bigint }> = []
      let remaining = [...deposits]

      // Up to 3 batch passes — each pass retries only the failed deposits in parallel
      for (let batch = 1; batch <= 3 && remaining.length > 0; batch++) {
        const settled = await Promise.allSettled(
          remaining.map(async (d) => {
            const blockNumber = await depositTokenForMint(d.token, d.amount, d.fee)
            addCachedOp({
              type: 'mint_portfolio',
              userPrincipal: userPrincipal.value,
              tokenPrincipal: d.token,
              blockNumber: blockNumber.toString(),
              amount: d.amount.toString(),
              status: 'minting',
              timestamp: Date.now(),
              mintMode: 'PortfolioShare',
            })
            return { token: Principal.fromText(d.token), blockNumber }
          })
        )

        const stillFailed: Array<{ token: string; amount: bigint; fee: bigint }> = []
        for (let i = 0; i < settled.length; i++) {
          const s = settled[i]
          if (s.status === 'fulfilled') {
            depositInfos.push(s.value)
          } else {
            // Don't retry deterministic errors (InsufficientFunds, BadFee)
            const msg = s.reason?.message || ''
            if (msg.includes('InsufficientFunds') || msg.includes('BadFee')) {
              throw s.reason
            }
            stillFailed.push(remaining[i])
          }
        }

        remaining = stillFailed
        if (remaining.length > 0 && batch < 3) {
          await new Promise(r => setTimeout(r, 1000 * batch))
        }
      }

      if (remaining.length > 0) {
        throw new Error(
          `${remaining.length} token deposit(s) failed after retries. ` +
          `${depositInfos.length} deposited successfully (tracked in Operations). ` +
          `Failed: ${remaining.map(d => d.token).join(', ')}`
        )
      }

      activeOperationStatus.value = 'minting'
      const minNachos = calculateMinimumReceive(totalEstimateNachos)
      const actor = await createVaultActor(true)
      const result = await (actor as any).mintNachosWithPortfolioShare(
        depositInfos.map(d => ({ token: d.token, blockNumber: d.blockNumber })),
        minNachos, [], []
      )

      if ('ok' in result) {
        for (const d of depositInfos) {
          updateCachedOp(d.blockNumber.toString(), d.token.toText(), { status: 'completed', mintId: result.ok.mintId.toString() })
        }
        return result.ok
      } else {
        const errorMsg = mapNachosError(result.err)
        for (const d of depositInfos) {
          updateCachedOp(d.blockNumber.toString(), d.token.toText(), { status: 'failed', error: errorMsg })
        }
        throw new Error(errorMsg)
      }
    } catch (e: any) {
      throw e
    } finally {
      activeOperationStatus.value = null
    }
  }

  // ============================================================================
  // Burn Action (authenticated)
  // ============================================================================

  const burnNachos = async (nachosAmount: bigint, perTokenMinimums?: Array<{ token: Principal; minAmount: bigint }>) => {
    activeOperationStatus.value = 'depositing'
    let blockNumber: bigint

    try {
      blockNumber = await depositNachosForBurn(nachosAmount)
    } catch (e: any) {
      activeOperationStatus.value = null
      throw e
    }

    addCachedOp({
      type: 'burn',
      userPrincipal: userPrincipal.value,
      tokenPrincipal: NACHOS_LEDGER_ID,
      blockNumber: blockNumber.toString(),
      amount: nachosAmount.toString(),
      status: 'minting',
      timestamp: Date.now(),
    })

    try {
      activeOperationStatus.value = 'burning'
      const actor = await createVaultActor(true)
      const result = await (actor as any).redeemNachos(
        blockNumber,
        perTokenMinimums ? [perTokenMinimums] : []
      )

      if ('ok' in result) {
        updateCachedOp(blockNumber.toString(), NACHOS_LEDGER_ID, {
          status: 'completed',
          burnId: result.ok.burnId.toString(),
        })
        startPolling()
        return result.ok
      } else {
        const errorMsg = mapNachosError(result.err)
        updateCachedOp(blockNumber.toString(), NACHOS_LEDGER_ID, { status: 'failed', error: errorMsg })
        throw new Error(errorMsg)
      }
    } catch (e: any) {
      updateCachedOp(blockNumber.toString(), NACHOS_LEDGER_ID, { status: 'failed', error: e.message })
      throw e
    } finally {
      activeOperationStatus.value = null
    }
  }

  // ============================================================================
  // Cancel Deposit (authenticated)
  // ============================================================================

  const cancelDeposit = async (tokenPrincipal: string, blockNumber: bigint) => {
    const actor = await createVaultActor(true)
    const result = await (actor as any).cancelDeposit(Principal.fromText(tokenPrincipal), blockNumber)

    if ('ok' in result) {
      updateCachedOp(blockNumber.toString(), tokenPrincipal, {
        status: 'cancelled',
        refundTaskId: result.ok.refundTaskId.toString(),
      })
      return result.ok
    } else {
      throw new Error(mapNachosError(result.err))
    }
  }

  // ============================================================================
  // Retry Failed Mint
  // ============================================================================

  const retryMint = async (op: CachedOperation) => {
    const blockNumber = BigInt(op.blockNumber)
    const amount = BigInt(op.amount)

    updateCachedOp(op.blockNumber, op.tokenPrincipal, { status: 'minting', error: undefined })
    activeOperationStatus.value = 'minting'

    try {
      const actor = await createVaultActor(true)
      let result: any

      if (op.type === 'mint_icp') {
        const estimate = await estimateMintICP(amount)
        const minNachos = calculateMinimumReceive(estimate.nachosEstimate, 300)
        result = await (actor as any).mintNachos(blockNumber, minNachos, [], [])
      } else if (op.type === 'mint_token') {
        const estimate = await estimateMintWithToken(Principal.fromText(op.tokenPrincipal), amount)
        const minNachos = calculateMinimumReceive(estimate.nachosEstimate, 300)
        result = await (actor as any).mintNachosWithToken(Principal.fromText(op.tokenPrincipal), blockNumber, minNachos, [], [])
      }

      if (result && 'ok' in result) {
        updateCachedOp(op.blockNumber, op.tokenPrincipal, { status: 'completed', mintId: result.ok.mintId.toString() })
        return result.ok
      } else if (result) {
        const errorMsg = mapNachosError(result.err)
        updateCachedOp(op.blockNumber, op.tokenPrincipal, { status: 'failed', error: errorMsg })
        throw new Error(errorMsg)
      }
    } catch (e: any) {
      updateCachedOp(op.blockNumber, op.tokenPrincipal, { status: 'failed', error: e.message })
      throw e
    } finally {
      activeOperationStatus.value = null
    }
  }

  // ============================================================================
  // Adaptive Polling (5s first minute, 15s after)
  // ============================================================================

  const startPolling = () => {
    stopPolling()
    pollStartTime = Date.now()
    const tick = async () => {
      try {
        await Promise.all([loadDashboard(), loadUserActivity()])
      } catch (_e) { /* ignore polling errors */ }
      const elapsed = Date.now() - pollStartTime
      const interval = elapsed < POLL_SWITCH_AFTER_MS ? POLL_FAST_MS : POLL_SLOW_MS
      pollTimeoutId = setTimeout(tick, interval)
    }
    tick()
  }

  const stopPolling = () => {
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId)
      pollTimeoutId = null
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  const initialize = async () => {
    loadOpsFromCache()
    pruneOldOps()
    // Worker handles dashboard, config, NAV history - only load user activity
    if (userLoggedIn.value) {
      await loadUserActivity()
    }
  }

  const cleanup = () => {
    stopPolling()
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    dashboardData, userActivity, navHistory, isLoading, lastError,
    activeOperationStatus, cachedOperations, slippageBP, vaultConfig,
    // Computed
    userPrincipal, userLoggedIn, icpPriceUsd,
    nav, navPerToken, portfolioValueICP, nachosSupply, portfolio,
    mintingEnabled, burningEnabled, systemPaused, circuitBreakerActive,
    genesisComplete, hasPausedTokens, pausedTokens, acceptedTokens,
    mintFeeBasisPoints, burnFeeBasisPoints, minMintValueICP, minBurnValueICP,
    dataSource, canMint, canBurn,
    maxMintAmountICP, maxBurnAmountNachos,
    maxMintICPPerUser4Hours, maxBurnNachosPerUser4Hours,
    maxMintOpsPerUser4Hours, maxBurnOpsPerUser4Hours,
    userRateLimits, globalMintIn4h, globalBurnIn4h, maxMintPer4h, maxBurnPer4h,
    remainingMintICP, remainingMintOps, remainingBurnNachos, remainingBurnOps,
    // Query actions
    loadDashboard, loadUserActivity, loadNAVHistory, loadConfig,
    // Estimate actions
    estimateMintICP, estimateMintWithToken, getRequiredPortfolioShares, estimateBurn,
    // Mint actions
    mintWithICP, mintWithToken, mintWithPortfolioShare,
    // Burn actions
    burnNachos,
    // Deposit management
    cancelDeposit, retryMint, loadOpsFromCache, saveOpsToCache,
    // Balance
    getTokenBalance,
    // Polling
    startPolling, stopPolling,
    // Lifecycle
    initialize, cleanup,
    // Actor (for admin views)
    createVaultActor,
    // Utilities
    formatE8s, formatICP, formatNachos, formatBasisPoints, mapNachosError,
    calculateMinimumReceive,
  }
})
