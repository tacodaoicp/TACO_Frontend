import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AcceptedTokenConfig {
  'enabled' : boolean,
  'addedAt' : bigint,
  'addedBy' : Principal,
}
export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface ActiveDeposit {
  'status' : DepositStatus,
  'blockKey' : string,
  'tokenPrincipal' : Principal,
  'blockNumber' : bigint,
  'fromSubaccount' : [] | [Uint8Array | number[]],
  'cancellationTxId' : [] | [bigint],
  'timestamp' : bigint,
  'caller' : Principal,
  'amount' : bigint,
  'mintBurnId' : [] | [bigint],
}
export interface BurnRecord {
  'id' : bigint,
  'partialFailure' : boolean,
  'feeValueICP' : bigint,
  'redemptionValueICP' : bigint,
  'netValueICP' : bigint,
  'timestamp' : bigint,
  'nachosBurned' : bigint,
  'nachosLedgerTxId' : [] | [bigint],
  'caller' : Principal,
  'navUsed' : bigint,
  'tokensReceived' : Array<TokenTransferResult>,
  'skippedDustTokens' : Array<Principal>,
}
export interface BurnResult {
  'partialFailure' : boolean,
  'feeValueICP' : bigint,
  'redemptionValueICP' : bigint,
  'failedTokens' : Array<FailedTokenTransfer>,
  'netValueICP' : bigint,
  'nachosBurned' : bigint,
  'nachosLedgerTxId' : [] | [bigint],
  'success' : boolean,
  'navUsed' : bigint,
  'burnId' : bigint,
  'tokensReceived' : Array<TokenTransferResult>,
  'skippedDustTokens' : Array<Principal>,
}
export interface CachedNAV {
  'nachosSupply' : bigint,
  'navPerTokenE8s' : bigint,
  'timestamp' : bigint,
  'portfolioValueICP' : bigint,
}
export type CircuitBreakerAction = { 'RejectOperation' : null } |
  { 'PauseBoth' : null } |
  { 'PauseBurn' : null } |
  { 'PauseMint' : null };
export interface CircuitBreakerAlert {
  'id' : bigint,
  'token' : [] | [Principal],
  'conditionId' : bigint,
  'conditionType' : CircuitBreakerConditionType,
  'tokenSymbol' : string,
  'timestamp' : bigint,
  'details' : string,
  'actionTaken' : CircuitBreakerAction,
}
export interface CircuitBreakerCondition {
  'id' : bigint,
  'direction' : { 'Up' : null } |
    { 'Both' : null } |
    { 'Down' : null },
  'action' : CircuitBreakerAction,
  'timeWindowNS' : bigint,
  'createdAt' : bigint,
  'createdBy' : Principal,
  'conditionType' : CircuitBreakerConditionType,
  'enabled' : boolean,
  'thresholdPercent' : number,
  'applicableTokens' : Array<Principal>,
}
export interface CircuitBreakerConditionInput {
  'direction' : { 'Up' : null } |
    { 'Both' : null } |
    { 'Down' : null },
  'action' : CircuitBreakerAction,
  'timeWindowNS' : bigint,
  'conditionType' : CircuitBreakerConditionType,
  'enabled' : boolean,
  'thresholdPercent' : number,
  'applicableTokens' : Array<Principal>,
}
export type CircuitBreakerConditionType = { 'DecimalChange' : null } |
  { 'BalanceChange' : null } |
  { 'TokenPaused' : null } |
  { 'NavDrop' : null } |
  { 'PriceChange' : null };
export type DepositStatus = { 'Consumed' : null } |
  { 'Cancelled' : null } |
  { 'Processing' : null } |
  { 'Verified' : null } |
  { 'Expired' : null };
export interface FailedDeliveryEntry {
  'status' : FailedDeliveryStatus,
  'token' : Principal,
  'exhaustedAt' : bigint,
  'retriedAt' : [] | [bigint],
  'retryTaskId' : [] | [bigint],
  'originalTaskId' : bigint,
  'amount' : bigint,
}
export type FailedDeliveryStatus = { 'Undelivered' : null } |
  { 'Delivered' : null } |
  { 'RetryQueued' : null };
export interface FailedTokenTransfer {
  'token' : Principal,
  'error' : string,
  'requestedAmount' : bigint,
}
export interface FeeExemptConfig {
  'enabled' : boolean,
  'addedAt' : bigint,
  'addedBy' : Principal,
  'reason' : string,
}
export interface FeeRecord {
  'feeAmountICP' : bigint,
  'feeType' : { 'Burn' : null } |
    { 'Mint' : null },
  'operationId' : bigint,
  'userPrincipal' : Principal,
  'timestamp' : bigint,
}
export interface LogEntry {
  'component' : string,
  'context' : string,
  'level' : LogLevel,
  'message' : string,
  'timestamp' : bigint,
}
export type LogLevel = { 'INFO' : null } |
  { 'WARN' : null } |
  { 'ERROR' : null };
export type MintMode = { 'ICP' : null } |
  { 'PortfolioShare' : null } |
  { 'SingleToken' : null };
export interface MintRecord {
  'id' : bigint,
  'totalDepositValueICP' : bigint,
  'feeValueICP' : bigint,
  'recipient' : [] | [Account],
  'mintMode' : MintMode,
  'netValueICP' : bigint,
  'timestamp' : bigint,
  'excessReturned' : Array<TokenDeposit>,
  'nachosLedgerTxId' : [] | [bigint],
  'caller' : Principal,
  'nachosReceived' : bigint,
  'deposits' : Array<TokenDeposit>,
  'navUsed' : bigint,
}
export interface MintResult {
  'totalDepositValueICP' : bigint,
  'feeValueICP' : bigint,
  'mintId' : bigint,
  'recipient' : Account,
  'mintMode' : MintMode,
  'netValueICP' : bigint,
  'excessReturned' : Array<TokenDeposit>,
  'nachosLedgerTxId' : [] | [bigint],
  'success' : boolean,
  'nachosReceived' : bigint,
  'deposits' : Array<TokenDeposit>,
  'navUsed' : bigint,
}
export type NachosError = { 'PriceStale' : null } |
  { 'DepositAlreadyConsumed' : null } |
  { 'MintingDisabled' : null } |
  { 'DepositNotFound' : null } |
  { 'TransferError' : string } |
  { 'InvalidPrice' : null } |
  {
    'MintLimitExceeded' : {
      'requested' : bigint,
      'recentMints' : bigint,
      'maxPer4Hours' : bigint,
    }
  } |
  { 'BlockAlreadyProcessed' : null } |
  { 'TokenNotActive' : null } |
  { 'GenesisNotComplete' : null } |
  { 'AboveMaximumValue' : { 'max' : bigint, 'requested' : bigint } } |
  {
    'PortfolioTokenPaused' : {
      'pausedTokens' : Array<{ 'token' : Principal, 'symbol' : string }>,
    }
  } |
  {
    'UserBurnLimitExceeded' : {
      'requested' : bigint,
      'maxPer4Hours' : bigint,
      'recentBurns' : bigint,
    }
  } |
  { 'BurningDisabled' : null } |
  { 'InsufficientBalance' : null } |
  { 'TokenPaused' : null } |
  { 'NotAuthorized' : null } |
  { 'BelowMinimumValue' : null } |
  { 'CircuitBreakerActive' : null } |
  { 'SystemPaused' : null } |
  { 'UnexpectedError' : string } |
  { 'BlockVerificationFailed' : string } |
  { 'DepositExpired' : null } |
  { 'RateLimitExceeded' : null } |
  { 'GenesisAlreadyDone' : null } |
  {
    'PortfolioShareMismatch' : {
      'expected' : Array<{ 'token' : Principal, 'basisPoints' : bigint }>,
      'received' : Array<{ 'token' : Principal, 'basisPoints' : bigint }>,
    }
  } |
  {
    'BurnLimitExceeded' : {
      'requested' : bigint,
      'maxPer4Hours' : bigint,
      'recentBurns' : bigint,
    }
  } |
  { 'NotDepositor' : null } |
  {
    'InsufficientLiquidity' : {
      'token' : Principal,
      'requested' : bigint,
      'available' : bigint,
    }
  } |
  { 'InvalidAllocation' : null } |
  { 'DepositAlreadyCancelled' : null } |
  { 'AllocationExceeded' : null } |
  { 'RollbackFailed' : string } |
  { 'SlippageExceeded' : null } |
  {
    'UserMintLimitExceeded' : {
      'requested' : bigint,
      'recentMints' : bigint,
      'maxPer4Hours' : bigint,
    }
  } |
  { 'TokenNotAccepted' : null } |
  { 'OperationInProgress' : null };
export interface NachosUpdateConfig {
  'maxMintICPWorthPer4Hours' : [] | [bigint],
  'minBurnValueICP' : [] | [bigint],
  'portfolioShareMaxDeviationBP' : [] | [bigint],
  'maxBurnNachosPerUser4Hours' : [] | [bigint],
  'cancellationFeeMultiplier' : [] | [bigint],
  'maxSlippageBasisPoints' : [] | [bigint],
  'maxMintOpsPerUser4Hours' : [] | [bigint],
  'maxMintAmountICP' : [] | [bigint],
  'maxBurnOpsPerUser4Hours' : [] | [bigint],
  'burnFeeBasisPoints' : [] | [bigint],
  'mintFeeBasisPoints' : [] | [bigint],
  'navDropThresholdPercent' : [] | [number],
  'navDropTimeWindowNS' : [] | [bigint],
  'PRICE_HISTORY_WINDOW' : [] | [bigint],
  'maxNachosBurnPer4Hours' : [] | [bigint],
  'maxBurnAmountNachos' : [] | [bigint],
  'MAX_PRICE_STALENESS_NS' : [] | [bigint],
  'maxMintICPPerUser4Hours' : [] | [bigint],
  'burningEnabled' : [] | [boolean],
  'minMintValueICP' : [] | [bigint],
  'mintingEnabled' : [] | [boolean],
}
export interface NachosVaultDAO {
  'addAcceptedMintToken' : ActorMethod<[Principal], Result>,
  'addCircuitBreakerCondition' : ActorMethod<
    [CircuitBreakerConditionInput],
    Result_1
  >,
  'addFeeExemptPrincipal' : ActorMethod<[Principal, string], Result>,
  'addRateLimitExemptPrincipal' : ActorMethod<[Principal, string], Result>,
  'adminForceRefreshBalances' : ActorMethod<[], Result>,
  'cancelDeposit' : ActorMethod<
    [Principal, bigint, [] | [Uint8Array | number[]]],
    Result_6
  >,
  'claimBurnFees' : ActorMethod<[Principal, Principal, bigint], Result>,
  'claimCancellationFees' : ActorMethod<[Principal, Principal, bigint], Result>,
  'claimMintFees' : ActorMethod<[Principal, Principal, bigint], Result>,
  'clearNavHistory' : ActorMethod<[], string>,
  'clearTokenPriceHistory' : ActorMethod<[], string>,
  'debugPendingBurns' : ActorMethod<[], Array<[Principal, bigint]>>,
  'debugPendingForwards' : ActorMethod<[], Array<[Principal, bigint]>>,
  'emergencyPause' : ActorMethod<[], Result>,
  'emergencyUnpause' : ActorMethod<[], Result>,
  'enableCircuitBreakerCondition' : ActorMethod<[bigint, boolean], Result>,
  'estimateBurnTokens' : ActorMethod<
    [bigint],
    {
      'redemptionValueICP' : bigint,
      'tokens' : Array<
        {
          'decimals' : bigint,
          'token' : Principal,
          'tokenFee' : bigint,
          'isDust' : boolean,
          'priceICP' : bigint,
          'amount' : bigint,
          'valueICP' : bigint,
          'symbol' : string,
        }
      >,
      'netValueICP' : bigint,
      'feeEstimate' : bigint,
      'nachosAmount' : bigint,
      'navUsed' : bigint,
      'portfolioValueICP' : bigint,
    }
  >,
  'estimateMintICP' : ActorMethod<
    [bigint],
    { 'nachosEstimate' : bigint, 'feeEstimate' : bigint, 'navUsed' : bigint }
  >,
  'estimateMintWithToken' : ActorMethod<[Principal, bigint], Result_5>,
  'estimateRedeem' : ActorMethod<
    [bigint],
    {
      'redemptionValueICP' : bigint,
      'netValueICP' : bigint,
      'feeEstimate' : bigint,
    }
  >,
  'genesisMint' : ActorMethod<
    [bigint, [] | [Uint8Array | number[]], [] | [Account]],
    Result_4
  >,
  'getAcceptedMintTokens' : ActorMethod<
    [],
    Array<[Principal, AcceptedTokenConfig]>
  >,
  'getActiveDepositsCount' : ActorMethod<[], bigint>,
  'getAdminDashboard' : ActorMethod<
    [],
    {
      'nav' : [] | [CachedNAV],
      'totalBurnVolumeICP' : bigint,
      'portfolio' : Array<
        {
          'decimals' : bigint,
          'token' : Principal,
          'balance' : bigint,
          'currentBasisPoints' : bigint,
          'priceICP' : bigint,
          'priceUSD' : number,
          'valueICP' : bigint,
          'symbol' : string,
          'targetBasisPoints' : bigint,
        }
      >,
      'totalBurnCount' : bigint,
      'claimableBurnFees' : Array<
        {
          'token' : Principal,
          'claimed' : bigint,
          'claimable' : bigint,
          'accumulated' : bigint,
        }
      >,
      'dataSource' : string,
      'activeDepositCount' : bigint,
      'mintPausedByCircuitBreaker' : boolean,
      'minBurnValueICP' : bigint,
      'circuitBreakerConditions' : Array<CircuitBreakerCondition>,
      'totalMintCount' : bigint,
      'hasPausedTokens' : boolean,
      'mintsByMode' : {
        'icp' : bigint,
        'portfolioShare' : bigint,
        'singleToken' : bigint,
      },
      'acceptedTokens' : Array<[Principal, AcceptedTokenConfig]>,
      'globalBurnIn4h' : bigint,
      'maxBurnPer4h' : bigint,
      'circuitBreakerActive' : boolean,
      'totalMintVolumeICP' : bigint,
      'nachosLedger' : [] | [Principal],
      'totalFeesCollectedICP' : bigint,
      'maxMintPer4h' : bigint,
      'feeCount' : bigint,
      'burnFeeBasisPoints' : bigint,
      'nachosSupply' : bigint,
      'claimableMintFees' : Array<
        {
          'token' : Principal,
          'claimed' : bigint,
          'claimable' : bigint,
          'accumulated' : bigint,
        }
      >,
      'mintFeeBasisPoints' : bigint,
      'claimableCancellationFees' : Array<
        {
          'token' : Principal,
          'claimed' : bigint,
          'claimable' : bigint,
          'accumulated' : bigint,
        }
      >,
      'mintFeesICP' : bigint,
      'genesisComplete' : boolean,
      'totalBurnVolumeNACHOS' : bigint,
      'recentAlerts' : Array<CircuitBreakerAlert>,
      'canisterCycles' : bigint,
      'globalMintIn4h' : bigint,
      'fullConfig' : {
        'maxMintICPWorthPer4Hours' : bigint,
        'portfolioShareMaxDeviationBP' : bigint,
        'maxBurnNachosPerUser4Hours' : bigint,
        'cancellationFeeMultiplier' : bigint,
        'maxSlippageBasisPoints' : bigint,
        'maxMintOpsPerUser4Hours' : bigint,
        'maxMintAmountICP' : bigint,
        'maxBurnOpsPerUser4Hours' : bigint,
        'navDropThresholdPercent' : number,
        'maxNachosBurnPer4Hours' : bigint,
        'maxBurnAmountNachos' : bigint,
        'maxMintICPPerUser4Hours' : bigint,
      },
      'dataTimestamp' : bigint,
      'burnPausedByCircuitBreaker' : boolean,
      'feeExemptPrincipals' : Array<[Principal, FeeExemptConfig]>,
      'transferQueue' : {
        'tasks' : Array<VaultTransferTask>,
        'pending' : bigint,
        'completed' : bigint,
        'exhausted' : bigint,
      },
      'pausedTokens' : Array<{ 'token' : Principal, 'symbol' : string }>,
      'systemPaused' : boolean,
      'burningEnabled' : boolean,
      'minMintValueICP' : bigint,
      'navChangePercent' : [] | [number],
      'pendingTransferCount' : bigint,
      'burnFeesICP' : bigint,
      'mintingEnabled' : boolean,
      'rateLimitExemptPrincipals' : Array<[Principal, FeeExemptConfig]>,
      'portfolioValueICP' : bigint,
    }
  >,
  'getBurnHistory' : ActorMethod<[bigint, bigint], Array<BurnRecord>>,
  'getCircuitBreakerAlerts' : ActorMethod<
    [bigint, bigint],
    Array<CircuitBreakerAlert>
  >,
  'getCircuitBreakerConditions' : ActorMethod<
    [],
    Array<CircuitBreakerCondition>
  >,
  'getClaimableBurnFees' : ActorMethod<
    [],
    Array<
      {
        'token' : Principal,
        'claimed' : bigint,
        'claimable' : bigint,
        'accumulated' : bigint,
      }
    >
  >,
  'getClaimableCancellationFees' : ActorMethod<
    [],
    Array<
      {
        'token' : Principal,
        'claimed' : bigint,
        'claimable' : bigint,
        'accumulated' : bigint,
      }
    >
  >,
  'getClaimableMintFees' : ActorMethod<
    [],
    Array<
      {
        'token' : Principal,
        'claimed' : bigint,
        'claimable' : bigint,
        'accumulated' : bigint,
      }
    >
  >,
  'getConfig' : ActorMethod<
    [],
    {
      'maxMintICPWorthPer4Hours' : bigint,
      'minBurnValueICP' : bigint,
      'portfolioShareMaxDeviationBP' : bigint,
      'maxBurnNachosPerUser4Hours' : bigint,
      'cancellationFeeMultiplier' : bigint,
      'maxSlippageBasisPoints' : bigint,
      'maxMintOpsPerUser4Hours' : bigint,
      'maxMintAmountICP' : bigint,
      'maxBurnOpsPerUser4Hours' : bigint,
      'burnFeeBasisPoints' : bigint,
      'mintFeeBasisPoints' : bigint,
      'navDropThresholdPercent' : number,
      'maxNachosBurnPer4Hours' : bigint,
      'maxBurnAmountNachos' : bigint,
      'maxMintICPPerUser4Hours' : bigint,
      'minMintValueICP' : bigint,
    }
  >,
  'getDeposit' : ActorMethod<[Principal, bigint], [] | [ActiveDeposit]>,
  'getFailedBurnDeliveries' : ActorMethod<
    [[] | [Principal]],
    Array<{ 'entries' : Array<FailedDeliveryEntry>, 'burnId' : bigint }>
  >,
  'getFailedForwardDeliveries' : ActorMethod<
    [],
    Array<{ 'mintId' : bigint, 'entries' : Array<FailedDeliveryEntry> }>
  >,
  'getFailedRefundDeliveries' : ActorMethod<
    [],
    Array<{ 'opId' : bigint, 'entries' : Array<FailedDeliveryEntry> }>
  >,
  'getFeeExemptPrincipals' : ActorMethod<
    [],
    Array<[Principal, FeeExemptConfig]>
  >,
  'getFeeHistory' : ActorMethod<[bigint], Array<FeeRecord>>,
  'getGlobalRateLimitStatus' : ActorMethod<
    [],
    { 'totalBurnAmountIn4h' : bigint, 'totalMintValueIn4h' : bigint }
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getMintHistory' : ActorMethod<[bigint, bigint], Array<MintRecord>>,
  'getNAV' : ActorMethod<[], [] | [CachedNAV]>,
  'getNAVHistory' : ActorMethod<[bigint], Array<NavSnapshot>>,
  'getNAVHistoryAdaptive' : ActorMethod<
    [],
    Array<
      {
        'navPerTokenE8s' : bigint,
        'timestamp' : bigint,
        'reason' : NavSnapshotReason,
      }
    >
  >,
  'getPortfolioBreakdown' : ActorMethod<
    [],
    Array<
      {
        'token' : Principal,
        'balance' : bigint,
        'basisPoints' : bigint,
        'priceICP' : bigint,
        'valueICP' : bigint,
        'symbol' : string,
      }
    >
  >,
  'getRateLimitExemptPrincipals' : ActorMethod<
    [],
    Array<[Principal, FeeExemptConfig]>
  >,
  'getRequiredPortfolioShares' : ActorMethod<
    [bigint],
    {
      'nachosEstimate' : bigint,
      'tokens' : Array<
        {
          'decimals' : bigint,
          'token' : Principal,
          'tokenFee' : bigint,
          'basisPoints' : bigint,
          'requiredAmount' : bigint,
          'priceICP' : bigint,
          'valueICP' : bigint,
          'symbol' : string,
        }
      >,
      'feeEstimate' : bigint,
      'navUsed' : bigint,
      'portfolioValueICP' : bigint,
    }
  >,
  'getSystemStatus' : ActorMethod<
    [],
    {
      'totalMints' : bigint,
      'activeDepositCount' : bigint,
      'mintPausedByCircuitBreaker' : boolean,
      'hasPausedTokens' : boolean,
      'cachedNAV' : [] | [CachedNAV],
      'circuitBreakerActive' : boolean,
      'nachosLedger' : [] | [Principal],
      'genesisComplete' : boolean,
      'burnPausedByCircuitBreaker' : boolean,
      'totalBurns' : bigint,
      'pausedTokens' : Array<{ 'token' : Principal, 'symbol' : string }>,
      'systemPaused' : boolean,
      'burningEnabled' : boolean,
      'pendingTransferCount' : bigint,
      'mintingEnabled' : boolean,
    }
  >,
  'getTransferQueueStatus' : ActorMethod<
    [],
    {
      'tasks' : Array<VaultTransferTask>,
      'pending' : bigint,
      'completed' : bigint,
      'exhausted' : bigint,
    }
  >,
  'getUserActivity' : ActorMethod<
    [Principal, bigint, bigint, bigint, bigint],
    {
      'rateLimits' : {
        'maxBurnOps' : bigint,
        'maxBurnNachosPerUser4Hours' : bigint,
        'mintOpsIn4h' : bigint,
        'mintValueIn4h' : bigint,
        'maxMintOps' : bigint,
        'burnOpsIn4h' : bigint,
        'maxMintICPPerUser4Hours' : bigint,
        'burnValueIn4h' : bigint,
      },
      'mints' : Array<MintRecord>,
      'totalMints' : bigint,
      'transfers' : Array<
        {
          'id' : bigint,
          'status' : TransferStatus,
          'tokenPrincipal' : Principal,
          'createdAt' : bigint,
          'operationType' : TransferOperationType,
          'updatedAt' : bigint,
          'operationId' : bigint,
          'blockIndex' : [] | [bigint],
          'amount' : bigint,
        }
      >,
      'userTotalMintVolumeICP' : bigint,
      'recentTransactions' : Array<
        {
          'id' : bigint,
          'feeICP' : bigint,
          'mintMode' : [] | [MintMode],
          'timestamp' : bigint,
          'nachosAmount' : bigint,
          'txType' : { 'Burn' : null } |
            { 'Mint' : null },
          'valueICP' : bigint,
        }
      >,
      'userTotalFeesICP' : bigint,
      'burns' : Array<BurnRecord>,
      'totalBurns' : bigint,
      'activeDeposits' : Array<ActiveDeposit>,
      'userTotalBurnVolumeICP' : bigint,
    }
  >,
  'getUserBurnHistory' : ActorMethod<[Principal], Array<BurnRecord>>,
  'getUserDeposits' : ActorMethod<[Principal], Array<ActiveDeposit>>,
  'getUserMintHistory' : ActorMethod<[Principal], Array<MintRecord>>,
  'getUserRateLimitStatus' : ActorMethod<
    [Principal],
    {
      'mintOpsIn4h' : bigint,
      'mintValueIn4h' : bigint,
      'burnOpsIn4h' : bigint,
      'burnValueIn4h' : bigint,
    }
  >,
  'getUserTransferTasks' : ActorMethod<
    [Principal],
    Array<
      {
        'id' : bigint,
        'status' : TransferStatus,
        'tokenPrincipal' : Principal,
        'createdAt' : bigint,
        'operationType' : TransferOperationType,
        'updatedAt' : bigint,
        'operationId' : bigint,
        'blockIndex' : [] | [bigint],
        'amount' : bigint,
      }
    >
  >,
  'getVaultAnalytics' : ActorMethod<
    [],
    {
      'totalBurnVolumeICP' : bigint,
      'totalBurnCount' : bigint,
      'totalMintCount' : bigint,
      'mintsByMode' : {
        'icp' : bigint,
        'portfolioShare' : bigint,
        'singleToken' : bigint,
      },
      'globalBurnIn4h' : bigint,
      'maxBurnPer4h' : bigint,
      'totalMintVolumeICP' : bigint,
      'totalFeesCollectedICP' : bigint,
      'maxMintPer4h' : bigint,
      'feeCount' : bigint,
      'nachosSupply' : bigint,
      'initialNAVPerToken' : bigint,
      'mintFeesICP' : bigint,
      'totalBurnVolumeNACHOS' : bigint,
      'globalMintIn4h' : bigint,
      'effectiveBurnLimit' : bigint,
      'currentNAV' : [] | [CachedNAV],
      'navChangePercent' : [] | [number],
      'burnFeesICP' : bigint,
      'liquidPortfolioICP' : bigint,
      'portfolioValueICP' : bigint,
    }
  >,
  'getVaultDashboard' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    {
      'nav' : [] | [CachedNAV],
      'totalBurnVolumeICP' : bigint,
      'portfolio' : Array<
        {
          'decimals' : bigint,
          'token' : Principal,
          'balance' : bigint,
          'currentBasisPoints' : bigint,
          'priceICP' : bigint,
          'priceUSD' : number,
          'valueICP' : bigint,
          'symbol' : string,
          'targetBasisPoints' : bigint,
        }
      >,
      'totalBurnCount' : bigint,
      'claimableBurnFees' : Array<
        {
          'token' : Principal,
          'claimed' : bigint,
          'claimable' : bigint,
          'accumulated' : bigint,
        }
      >,
      'dataSource' : string,
      'mintPausedByCircuitBreaker' : boolean,
      'minBurnValueICP' : bigint,
      'totalMintCount' : bigint,
      'hasPausedTokens' : boolean,
      'mintsByMode' : {
        'icp' : bigint,
        'portfolioShare' : bigint,
        'singleToken' : bigint,
      },
      'mintEstimate' : [] | [
        {
          'nachosEstimate' : bigint,
          'feeEstimate' : bigint,
          'navUsed' : bigint,
        }
      ],
      'acceptedTokens' : Array<[Principal, AcceptedTokenConfig]>,
      'globalBurnIn4h' : bigint,
      'maxBurnPer4h' : bigint,
      'circuitBreakerActive' : boolean,
      'totalMintVolumeICP' : bigint,
      'totalFeesCollectedICP' : bigint,
      'maxMintPer4h' : bigint,
      'feeCount' : bigint,
      'burnFeeBasisPoints' : bigint,
      'nachosSupply' : bigint,
      'claimableMintFees' : Array<
        {
          'token' : Principal,
          'claimed' : bigint,
          'claimable' : bigint,
          'accumulated' : bigint,
        }
      >,
      'mintFeeBasisPoints' : bigint,
      'claimableCancellationFees' : Array<
        {
          'token' : Principal,
          'claimed' : bigint,
          'claimable' : bigint,
          'accumulated' : bigint,
        }
      >,
      'mintFeesICP' : bigint,
      'genesisComplete' : boolean,
      'burnEstimate' : [] | [
        {
          'redemptionValueICP' : bigint,
          'netValueICP' : bigint,
          'feeEstimate' : bigint,
        }
      ],
      'totalBurnVolumeNACHOS' : bigint,
      'globalMintIn4h' : bigint,
      'dataTimestamp' : bigint,
      'burnPausedByCircuitBreaker' : boolean,
      'pausedTokens' : Array<{ 'token' : Principal, 'symbol' : string }>,
      'systemPaused' : boolean,
      'burningEnabled' : boolean,
      'minMintValueICP' : bigint,
      'navChangePercent' : [] | [number],
      'burnFeesICP' : bigint,
      'mintingEnabled' : boolean,
      'portfolioValueICP' : bigint,
    }
  >,
  'get_canister_cycles' : ActorMethod<[], bigint>,
  'mintNachos' : ActorMethod<
    [bigint, bigint, [] | [Uint8Array | number[]], [] | [Account]],
    Result_4
  >,
  'mintNachosWithPortfolioShare' : ActorMethod<
    [
      Array<{ 'token' : Principal, 'blockNumber' : bigint }>,
      bigint,
      [] | [Uint8Array | number[]],
      [] | [Account],
    ],
    Result_4
  >,
  'mintNachosWithToken' : ActorMethod<
    [Principal, bigint, bigint, [] | [Uint8Array | number[]], [] | [Account]],
    Result_4
  >,
  'pauseBurning' : ActorMethod<[], Result>,
  'pauseMinting' : ActorMethod<[], Result>,
  'recoverStuckNachos' : ActorMethod<[Principal, bigint], Result>,
  'recoverWronglySentTokens' : ActorMethod<
    [Principal, bigint, Principal],
    Result
  >,
  'redeemNachos' : ActorMethod<
    [bigint, [] | [Array<{ 'token' : Principal, 'minAmount' : bigint }>]],
    Result_3
  >,
  'refreshICPSwapPools' : ActorMethod<[], Result>,
  'removeAcceptedMintToken' : ActorMethod<[Principal], Result>,
  'removeCircuitBreakerCondition' : ActorMethod<[bigint], Result>,
  'removeFeeExemptPrincipal' : ActorMethod<[Principal], Result>,
  'removeRateLimitExemptPrincipal' : ActorMethod<[Principal], Result>,
  'resetCircuitBreaker' : ActorMethod<[], Result>,
  'retryFailedBurnDelivery' : ActorMethod<[bigint], Result_2>,
  'retryFailedForwardDelivery' : ActorMethod<[bigint], Result_2>,
  'retryFailedRefundDelivery' : ActorMethod<[bigint], Result_2>,
  'retryFailedTransfers' : ActorMethod<[], Result_1>,
  'setAcceptedMintTokenEnabled' : ActorMethod<[Principal, boolean], Result>,
  'setNachosLedgerPrincipal' : ActorMethod<[Principal], Result>,
  'testRefreshPrices' : ActorMethod<[], Result>,
  'unpauseBurning' : ActorMethod<[], Result>,
  'unpauseMinting' : ActorMethod<[], Result>,
  'updateCancellationFeeMultiplier' : ActorMethod<[bigint], Result>,
  'updateCircuitBreakerCondition' : ActorMethod<
    [
      bigint,
      [] | [number],
      [] | [bigint],
      [] | [{ 'Up' : null } | { 'Both' : null } | { 'Down' : null }],
      [] | [CircuitBreakerAction],
      [] | [Array<Principal>],
    ],
    Result
  >,
  'updateFees' : ActorMethod<[bigint, bigint], Result>,
  'updateNachosConfig' : ActorMethod<[NachosUpdateConfig], Result>,
}
export interface NavSnapshot {
  'nachosSupply' : bigint,
  'navPerTokenE8s' : bigint,
  'timestamp' : bigint,
  'reason' : NavSnapshotReason,
  'portfolioValueICP' : bigint,
}
export type NavSnapshotReason = { 'Burn' : null } |
  { 'Mint' : null } |
  { 'Scheduled' : null } |
  { 'Manual' : null };
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<bigint> } |
  { 'err' : NachosError };
export type Result_3 = { 'ok' : BurnResult } |
  { 'err' : NachosError };
export type Result_4 = { 'ok' : MintResult } |
  { 'err' : NachosError };
export type Result_5 = {
    'ok' : {
      'tokenPriceICP' : bigint,
      'depositValueICP' : bigint,
      'nachosEstimate' : bigint,
      'excessAmount' : bigint,
      'usedAmount' : bigint,
      'feeEstimate' : bigint,
      'excessValueICP' : bigint,
      'allocation' : {
        'wouldExceed' : boolean,
        'afterDepositBasisPoints' : bigint,
        'currentBasisPoints' : bigint,
        'maxAcceptableAmount' : bigint,
        'targetBasisPoints' : bigint,
      },
      'navUsed' : bigint,
      'pendingMintValueICP' : bigint,
      'usedValueICP' : bigint,
    }
  } |
  { 'err' : NachosError };
export type Result_6 = { 'ok' : { 'refundTaskId' : bigint } } |
  { 'err' : NachosError };
export interface TokenDeposit {
  'token' : Principal,
  'priceUsed' : bigint,
  'amount' : bigint,
  'valueICP' : bigint,
}
export interface TokenTransferResult {
  'token' : Principal,
  'txId' : [] | [bigint],
  'amount' : bigint,
}
export type TransferOperationType = { 'MintReturn' : null } |
  { 'ExcessReturn' : null } |
  { 'BurnPayout' : null } |
  { 'Recovery' : null } |
  { 'ForwardToPortfolio' : null } |
  { 'CancelReturn' : null };
export type TransferRecipient = { 'principal' : Principal } |
  {
    'accountId' : {
      'owner' : Principal,
      'subaccount' : [] | [Uint8Array | number[]],
    }
  };
export type TransferStatus = { 'Failed' : string } |
  { 'Sent' : null } |
  { 'Confirmed' : bigint } |
  { 'Pending' : null };
export interface VaultTransferTask {
  'id' : bigint,
  'status' : TransferStatus,
  'tokenPrincipal' : Principal,
  'fromSubaccount' : number,
  'createdAt' : bigint,
  'operationType' : TransferOperationType,
  'recipient' : TransferRecipient,
  'updatedAt' : bigint,
  'retryCount' : bigint,
  'operationId' : bigint,
  'blockIndex' : [] | [bigint],
  'caller' : Principal,
  'amount' : bigint,
  'actualAmountSent' : [] | [bigint],
}
export interface _SERVICE extends NachosVaultDAO {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
