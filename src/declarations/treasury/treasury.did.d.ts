import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ChangeType = { 'CurrentToMax' : null } |
  { 'CurrentToMin' : null } |
  { 'MinToMax' : null };
export interface ClaimsReply {
  'ts' : bigint,
  'fee' : bigint,
  'status' : string,
  'claim_id' : bigint,
  'desc' : string,
  'chain' : string,
  'canister_id' : [] | [string],
  'to_address' : string,
  'amount' : bigint,
  'symbol' : string,
}
export interface EnhancedTreasuryDashboard {
  'systemParameters' : RebalanceConfigResponse,
  'portfolioSnapshotStatus' : {
    'status' : { 'Stopped' : null } |
      { 'Running' : null },
    'lastSnapshotTime' : bigint,
    'intervalMinutes' : bigint,
  },
  'longSyncTimerStatus' : {
    'nextScheduledTime' : bigint,
    'lastRunTime' : bigint,
    'intervalNS' : bigint,
    'timerId' : bigint,
    'isRunning' : boolean,
  },
  'recentSnapshots' : {
    'totalCount' : bigint,
    'snapshots' : Array<PortfolioSnapshot>,
  },
  'tradingPauses' : TradingPausesResponse,
  'tradingStatus' : {
    'executedTrades' : Array<TradeRecord>,
    'metrics' : {
      'avgSlippage' : number,
      'successRate' : number,
      'lastUpdate' : bigint,
      'totalTradesExecuted' : bigint,
      'lastRebalanceAttempt' : bigint,
      'skipBreakdown' : SkipBreakdown,
      'skipRate' : number,
      'totalTradesFailed' : bigint,
      'totalTradesSkipped' : bigint,
    },
    'rebalanceStatus' : RebalanceStatus,
    'portfolioState' : {
      'currentAllocations' : Array<[Principal, bigint]>,
      'totalValueICP' : bigint,
      'totalValueUSD' : number,
      'targetAllocations' : Array<[Principal, bigint]>,
    },
  },
}
export type ExchangeType = { 'KongSwap' : null } |
  { 'ICPSwap' : null };
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
export interface PortfolioCircuitBreakerCondition {
  'id' : bigint,
  'direction' : PortfolioDirection,
  'timeWindowNS' : bigint,
  'name' : string,
  'createdAt' : bigint,
  'createdBy' : Principal,
  'isActive' : boolean,
  'valueType' : PortfolioValueType,
  'percentage' : number,
}
export type PortfolioCircuitBreakerError = { 'InvalidTimeWindow' : null } |
  { 'DuplicateName' : null } |
  { 'SystemError' : string } |
  { 'InvalidParameters' : string } |
  { 'ConditionNotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'InvalidPercentage' : null };
export interface PortfolioCircuitBreakerLog {
  'id' : bigint,
  'portfolioData' : PortfolioTriggerData,
  'timestamp' : bigint,
  'pausedTokens' : Array<Principal>,
  'triggeredCondition' : PortfolioCircuitBreakerCondition,
}
export interface PortfolioCircuitBreakerUpdate {
  'direction' : [] | [PortfolioDirection],
  'timeWindowNS' : [] | [bigint],
  'name' : [] | [string],
  'isActive' : [] | [boolean],
  'valueType' : [] | [PortfolioValueType],
  'percentage' : [] | [number],
}
export type PortfolioDirection = { 'Up' : null } |
  { 'Down' : null };
export interface PortfolioHistoryResponse {
  'totalCount' : bigint,
  'snapshots' : Array<PortfolioSnapshot>,
}
export interface PortfolioSnapshot {
  'totalValueICP' : bigint,
  'totalValueUSD' : number,
  'tokens' : Array<TokenSnapshot>,
  'snapshotReason' : SnapshotReason,
  'timestamp' : bigint,
}
export type PortfolioSnapshotError = { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'InvalidLimit' : null };
export interface PortfolioTriggerData {
  'maxValueInWindow' : number,
  'minValueInWindow' : number,
  'actualChangePercent' : number,
  'currentValue' : number,
  'valueType' : PortfolioValueType,
  'windowStartTime' : bigint,
}
export type PortfolioValueType = { 'ICP' : null } |
  { 'USD' : null };
export interface PriceAlertLog {
  'id' : bigint,
  'token' : Principal,
  'tokenSymbol' : string,
  'timestamp' : bigint,
  'priceData' : TriggerPriceData,
  'triggeredCondition' : TriggerCondition,
}
export type PriceDirection = { 'Up' : null } |
  { 'Down' : null };
export type PriceFailsafeError = { 'InvalidTimeWindow' : null } |
  { 'DuplicateName' : null } |
  { 'SystemError' : string } |
  { 'ConditionNotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'InvalidPercentage' : null } |
  { 'InvalidTokenList' : null };
export interface PricePoint {
  'usdPrice' : number,
  'time' : bigint,
  'icpPrice' : bigint,
}
export interface RebalanceConfigResponse {
  'tokenSyncTimeoutNS' : bigint,
  'maxSlippageBasisPoints' : bigint,
  'shortSyncIntervalNS' : bigint,
  'rebalanceIntervalNS' : bigint,
  'maxTradesStored' : bigint,
  'maxTradeValueICP' : bigint,
  'minTradeValueICP' : bigint,
  'minAllocationDiffBasisPoints' : bigint,
  'portfolioRebalancePeriodNS' : bigint,
  'longSyncIntervalNS' : bigint,
  'maxTradeAttemptsPerInterval' : bigint,
  'maxKongswapAttempts' : bigint,
}
export type RebalanceError = { 'LiquidityError' : string } |
  { 'TradeError' : string } |
  { 'SystemError' : string } |
  { 'ConfigError' : string } |
  { 'PriceError' : string };
export type RebalanceStatus = { 'Failed' : string } |
  { 'Idle' : null } |
  { 'Trading' : null };
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : PriceFailsafeError };
export type Result_10 = {
    'ok' : {
      'executedTrades' : Array<TradeRecord>,
      'metrics' : {
        'avgSlippage' : number,
        'successRate' : number,
        'lastUpdate' : bigint,
        'totalTradesExecuted' : bigint,
        'skipBreakdown' : {
          'tokensFiltered' : bigint,
          'insufficientCandidates' : bigint,
          'noExecutionPath' : bigint,
          'noPairsFound' : bigint,
          'pausedTokens' : bigint,
        },
        'skipRate' : number,
        'totalTradesFailed' : bigint,
        'totalTradesSkipped' : bigint,
      },
      'rebalanceStatus' : RebalanceStatus,
      'portfolioState' : {
        'currentAllocations' : Array<[Principal, bigint]>,
        'totalValueICP' : bigint,
        'totalValueUSD' : number,
        'targetAllocations' : Array<[Principal, bigint]>,
      },
    }
  } |
  { 'err' : string };
export type Result_11 = {
    'ok' : {
      'executedTrades' : Array<TradeRecord>,
      'metrics' : {
        'avgSlippage' : number,
        'successRate' : number,
        'lastUpdate' : bigint,
        'totalTradesExecuted' : bigint,
        'lastRebalanceAttempt' : bigint,
        'skipBreakdown' : {
          'tokensFiltered' : bigint,
          'insufficientCandidates' : bigint,
          'noExecutionPath' : bigint,
          'noPairsFound' : bigint,
          'pausedTokens' : bigint,
        },
        'skipRate' : number,
        'totalTradesFailed' : bigint,
        'totalTradesSkipped' : bigint,
      },
      'rebalanceStatus' : RebalanceStatus,
      'portfolioState' : {
        'currentAllocations' : Array<[Principal, bigint]>,
        'totalValueICP' : bigint,
        'totalValueUSD' : number,
        'targetAllocations' : Array<[Principal, bigint]>,
      },
    }
  } |
  { 'err' : string };
export type Result_12 = { 'ok' : Array<[Principal, Array<PricePoint>]> } |
  { 'err' : string };
export type Result_13 = { 'ok' : PortfolioHistoryResponse } |
  { 'err' : PortfolioSnapshotError };
export type Result_14 = { 'ok' : EnhancedTreasuryDashboard } |
  { 'err' : string };
export type Result_15 = { 'ok' : Array<ClaimsReply> } |
  { 'err' : string };
export type Result_16 = { 'ok' : bigint } |
  { 'err' : PriceFailsafeError };
export type Result_17 = { 'ok' : bigint } |
  { 'err' : PortfolioCircuitBreakerError };
export type Result_2 = { 'ok' : string } |
  { 'err' : RebalanceError };
export type Result_3 = { 'ok' : string } |
  { 'err' : PortfolioCircuitBreakerError };
export type Result_4 = { 'ok' : string } |
  { 'err' : PortfolioSnapshotError };
export type Result_5 = { 'ok' : string } |
  { 'err' : TradingPauseError };
export type Result_6 = { 'ok' : string } |
  { 'err' : SyncErrorTreasury };
export type Result_7 = {
    'ok' : {
      'icpPriceUSD' : number,
      'tokenDetails' : Array<[Principal, TokenDetails]>,
      'tokensRefreshed' : bigint,
      'timestamp' : bigint,
    }
  } |
  { 'err' : string };
export type Result_8 = {
    'ok' : {
      'icpPriceUSD' : number,
      'tokensRefreshed' : bigint,
      'timestamp' : bigint,
    }
  } |
  { 'err' : string };
export type Result_9 = { 'ok' : TreasuryAdminActionsSinceResponse } |
  { 'err' : TradingPauseError };
export interface SkipBreakdown {
  'tokensFiltered' : bigint,
  'insufficientCandidates' : bigint,
  'noExecutionPath' : bigint,
  'noPairsFound' : bigint,
  'pausedTokens' : bigint,
}
export type SnapshotReason = { 'PreTrade' : null } |
  { 'PostTrade' : null } |
  { 'Scheduled' : null } |
  { 'PriceUpdate' : null } |
  { 'Manual' : null };
export type Subaccount = Uint8Array | number[];
export type SyncErrorTreasury = { 'NotDAO' : null } |
  { 'UnexpectedError' : string };
export interface TokenDetails {
  'lastTimeSynced' : bigint,
  'balance' : bigint,
  'isPaused' : boolean,
  'Active' : boolean,
  'epochAdded' : bigint,
  'priceInICP' : bigint,
  'priceInUSD' : number,
  'tokenTransferFee' : bigint,
  'tokenDecimals' : bigint,
  'pastPrices' : Array<PricePoint>,
  'tokenSymbol' : string,
  'tokenName' : string,
  'pausedDueToSyncFailure' : boolean,
  'tokenType' : TokenType,
}
export interface TokenSnapshot {
  'decimals' : bigint,
  'token' : Principal,
  'balance' : bigint,
  'priceInICP' : bigint,
  'priceInUSD' : number,
  'valueInICP' : bigint,
  'valueInUSD' : number,
  'symbol' : string,
}
export type TokenType = { 'ICP' : null } |
  { 'ICRC3' : null } |
  { 'ICRC12' : null };
export interface TradeRecord {
  'error' : [] | [string],
  'amountSold' : bigint,
  'amountBought' : bigint,
  'timestamp' : bigint,
  'tokenSold' : Principal,
  'success' : boolean,
  'exchange' : ExchangeType,
  'tokenBought' : Principal,
  'slippage' : number,
}
export type TradingPauseError = { 'TokenNotPaused' : null } |
  { 'TokenNotFound' : null } |
  { 'TokenAlreadyPaused' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null };
export type TradingPauseReason = {
    'PriceAlert' : {
      'conditionName' : string,
      'alertId' : bigint,
      'triggeredAt' : bigint,
    }
  } |
  {
    'CircuitBreaker' : {
      'triggeredAt' : bigint,
      'severity' : string,
      'reason' : string,
    }
  };
export interface TradingPauseRecord {
  'pausedAt' : bigint,
  'token' : Principal,
  'tokenSymbol' : string,
  'reason' : TradingPauseReason,
}
export interface TradingPausesResponse {
  'totalCount' : bigint,
  'pausedTokens' : Array<TradingPauseRecord>,
}
export type TransferRecipient = { 'principal' : Principal } |
  { 'accountId' : { 'owner' : Principal, 'subaccount' : [] | [Subaccount] } };
export interface TreasuryAdminActionRecord {
  'id' : bigint,
  'admin' : Principal,
  'errorMessage' : [] | [string],
  'actionType' : TreasuryAdminActionType,
  'timestamp' : bigint,
  'success' : boolean,
  'reason' : string,
}
export type TreasuryAdminActionType = { 'StopRebalancing' : null } |
  {
    'UpdatePortfolioCircuitBreaker' : {
      'newCondition' : string,
      'conditionId' : bigint,
      'oldCondition' : string,
    }
  } |
  { 'ClearAllTradingPauses' : null } |
  { 'UnpauseToken' : { 'token' : Principal } } |
  { 'ExecuteTradingCycle' : null } |
  { 'PauseTokenManual' : { 'token' : Principal, 'pauseType' : string } } |
  { 'CanisterStart' : null } |
  {
    'SetPortfolioCircuitBreakerActive' : {
      'conditionId' : bigint,
      'isActive' : boolean,
    }
  } |
  { 'StartRebalancing' : null } |
  { 'SetTestMode' : { 'isTestMode' : boolean } } |
  { 'ClearPortfolioCircuitBreakerLogs' : null } |
  {
    'AddPortfolioCircuitBreaker' : {
      'conditionId' : bigint,
      'conditionType' : string,
      'details' : string,
    }
  } |
  {
    'UpdateTriggerCondition' : {
      'newCondition' : string,
      'conditionId' : bigint,
      'oldCondition' : string,
    }
  } |
  { 'RemoveTriggerCondition' : { 'conditionId' : bigint } } |
  { 'TakeManualSnapshot' : null } |
  {
    'UpdatePausedTokenThreshold' : {
      'newThreshold' : bigint,
      'oldThreshold' : bigint,
    }
  } |
  { 'UpdateRebalanceConfig' : { 'newConfig' : string, 'oldConfig' : string } } |
  { 'StartPortfolioSnapshots' : null } |
  {
    'UpdatePortfolioSnapshotInterval' : {
      'newIntervalNS' : bigint,
      'oldIntervalNS' : bigint,
    }
  } |
  { 'StopPortfolioSnapshots' : null } |
  {
    'AddTriggerCondition' : {
      'conditionId' : bigint,
      'conditionType' : string,
      'details' : string,
    }
  } |
  { 'RemovePortfolioCircuitBreaker' : { 'conditionId' : bigint } } |
  {
    'SetTriggerConditionActive' : {
      'conditionId' : bigint,
      'isActive' : boolean,
    }
  } |
  {
    'UpdateMaxPortfolioSnapshots' : { 'oldLimit' : bigint, 'newLimit' : bigint }
  } |
  { 'ResetRebalanceState' : null } |
  { 'ClearSystemLogs' : null } |
  { 'ClearPriceAlerts' : null } |
  { 'CanisterStop' : null };
export interface TreasuryAdminActionsSinceResponse {
  'totalCount' : bigint,
  'actions' : Array<TreasuryAdminActionRecord>,
}
export interface TriggerCondition {
  'id' : bigint,
  'direction' : PriceDirection,
  'timeWindowNS' : bigint,
  'name' : string,
  'createdAt' : bigint,
  'createdBy' : Principal,
  'isActive' : boolean,
  'percentage' : number,
  'applicableTokens' : Array<Principal>,
}
export interface TriggerConditionUpdate {
  'direction' : [] | [PriceDirection],
  'timeWindowNS' : [] | [bigint],
  'name' : [] | [string],
  'isActive' : [] | [boolean],
  'percentage' : [] | [number],
  'applicableTokens' : [] | [Array<Principal>],
}
export interface TriggerPriceData {
  'currentPrice' : bigint,
  'actualChangePercent' : number,
  'changeType' : ChangeType,
  'windowStartTime' : bigint,
  'maxPriceInWindow' : bigint,
  'minPriceInWindow' : bigint,
}
export interface UpdateConfig {
  'maxPriceHistoryEntries' : [] | [bigint],
  'priceUpdateIntervalNS' : [] | [bigint],
  'tokenSyncTimeoutNS' : [] | [bigint],
  'maxSlippageBasisPoints' : [] | [bigint],
  'shortSyncIntervalNS' : [] | [bigint],
  'rebalanceIntervalNS' : [] | [bigint],
  'maxTradesStored' : [] | [bigint],
  'maxTradeValueICP' : [] | [bigint],
  'minTradeValueICP' : [] | [bigint],
  'minAllocationDiffBasisPoints' : [] | [bigint],
  'portfolioRebalancePeriodNS' : [] | [bigint],
  'longSyncIntervalNS' : [] | [bigint],
  'maxTradeAttemptsPerInterval' : [] | [bigint],
  'maxKongswapAttempts' : [] | [bigint],
}
export interface treasury {
  /**
   * / * Add a portfolio circuit breaker condition
   * /    *
   * /    * Creates a circuit breaker rule that will pause all trading when portfolio value
   * /    * changes exceed the specified threshold within the time window.
   * /    *
   * /    * Only callable by admins with appropriate permissions.
   */
  'addPortfolioCircuitBreakerCondition' : ActorMethod<
    [string, PortfolioDirection, number, bigint, PortfolioValueType],
    Result_17
  >,
  /**
   * / * Add a new price trigger condition
   * /    *
   * /    * Creates a failsafe rule that will pause tokens when price movements
   * /    * exceed the specified threshold within the time window.
   * /    *
   * /    * Only callable by admins with appropriate permissions.
   */
  'addTriggerCondition' : ActorMethod<
    [string, PriceDirection, number, bigint, Array<Principal>],
    Result_16
  >,
  /**
   * / * Execute all pending KongSwap claims to recover tokens
   */
  'admin_executeKongClaims' : ActorMethod<[], Result>,
  'admin_executeTradingCycle' : ActorMethod<[[] | [string]], Result_2>,
  /**
   * / * Query pending KongSwap claims for this treasury
   * /    * Returns list of claims that can be recovered
   */
  'admin_getKongClaims' : ActorMethod<[], Result_15>,
  'admin_recoverPoolBalances' : ActorMethod<[], Result>,
  /**
   * / * Manually refresh ICPSwap pools from factory
   * /    * Use this to pick up newly created pools
   */
  'admin_refreshICPSwapPools' : ActorMethod<[], Result>,
  /**
   * / * Timer for data synchronization
   * /    *
   * /    * Schedules periodic updates of token info from:
   * /    * - DAO (allocation targets and token status)
   * /    * - NTN service (token prices)
   * /    * - Ledgers (token balances)
   */
  'admin_startShortSyncTimer' : ActorMethod<[], boolean>,
  'admin_syncToDao' : ActorMethod<[], Result>,
  'admin_syncWithDao' : ActorMethod<[], Result>,
  'admin_syncWithDaoNoPull' : ActorMethod<[], Result>,
  /**
   * / * Clear all trading pauses (emergency function)
   * /    *
   * /    * Removes all tokens from the trading pause registry.
   * /    * Only callable by master admins.
   */
  'clearAllTradingPauses' : ActorMethod<[[] | [string]], Result_5>,
  /**
   * / * Clear all logs
   * /    * Only accessible by master admin or controller
   */
  'clearLogs' : ActorMethod<[], undefined>,
  /**
   * / * Clear portfolio circuit breaker logs
   */
  'clearPortfolioCircuitBreakerLogs' : ActorMethod<[], Result_3>,
  /**
   * / * Clear price alerts log
   * /    *
   * /    * Removes all price alert history.
   * /    * Only callable by admins with appropriate permissions.
   */
  'clearPriceAlerts' : ActorMethod<[], Result_1>,
  /**
   * / * Get current token allocations in basis points
   */
  'getCurrentAllocations' : ActorMethod<[], Array<[Principal, bigint]>>,
  'getEnhancedTreasuryDashboard' : ActorMethod<[], Result_14>,
  /**
   * / * Get ICPSwap pool info for a specific token pair
   * /    *
   * /    * Returns the pool data if a pool exists for the given token pair,
   * /    * or null if no pool is mapped.
   */
  'getICPSwapPoolInfo' : ActorMethod<
    [Principal, Principal],
    [] | [
      {
        'fee' : bigint,
        'token0' : string,
        'token1' : string,
        'canisterId' : Principal,
      }
    ]
  >,
  /**
   * / * Get the last N log entries
   * /    * Only accessible by master admin, controller, or DAO
   */
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  /**
   * / * Get the last N log entries for a specific context
   * /    * Only accessible by master admin, controller, or DAO
   */
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  /**
   * / * Get the last N log entries for a specific level
   * /    * Only accessible by master admin, controller, or DAO
   */
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  /**
   * / * Get Long Sync Timer status
   * /    *
   * /    * Returns information about the Long Sync Timer including:
   * /    * - lastRunTime: The last time the timer executed (0 if never run)
   * /    * - nextScheduledTime: The next scheduled execution time (0 if not scheduled)
   * /    * - isRunning: Whether the timer is currently active
   * /    * - timerId: The timer ID (0 if not running)
   * /    * - intervalNS: The configured interval in nanoseconds
   * /    *
   * /    * Accessible by any user with query access.
   */
  'getLongSyncTimerStatus' : ActorMethod<
    [],
    {
      'nextScheduledTime' : bigint,
      'lastRunTime' : bigint,
      'intervalNS' : bigint,
      'timerId' : bigint,
      'isRunning' : boolean,
    }
  >,
  /**
   * / * Get the current maximum portfolio snapshots limit
   * /    *
   * /    * Returns the current limit for portfolio snapshots storage.
   * /    * Accessible by any user with query access.
   */
  'getMaxPortfolioSnapshots' : ActorMethod<[], bigint>,
  /**
   * / * Get current maximum price history entries configuration
   * /    *
   * /    * Returns the current limit for price history entries per token.
   * /    * Accessible by any user with query access.
   */
  'getMaxPriceHistoryEntries' : ActorMethod<[], bigint>,
  /**
   * / * Get the current paused token threshold for circuit breaker
   */
  'getPausedTokenThresholdForCircuitBreaker' : ActorMethod<[], bigint>,
  /**
   * / * Get a specific portfolio circuit breaker condition
   */
  'getPortfolioCircuitBreakerCondition' : ActorMethod<
    [bigint],
    [] | [PortfolioCircuitBreakerCondition]
  >,
  /**
   * / * Get portfolio circuit breaker logs
   */
  'getPortfolioCircuitBreakerLogs' : ActorMethod<
    [bigint, bigint],
    { 'logs' : Array<PortfolioCircuitBreakerLog>, 'totalCount' : bigint }
  >,
  /**
   * / * Get portfolio history
   * /    *
   * /    * Returns recent portfolio snapshots for analysis and charting.
   * /    * Public query - allows anyone to view portfolio history (read-only transparency).
   */
  'getPortfolioHistory' : ActorMethod<[bigint], Result_13>,
  /**
   * / * Get portfolio history filtered by timestamp (for archive efficiency)
   * /    * Returns only snapshots newer than the specified timestamp
   * /    * Public query - allows anyone to view portfolio history (read-only transparency).
   */
  'getPortfolioHistorySince' : ActorMethod<[bigint, bigint], Result_13>,
  /**
   * / * Get portfolio snapshot status
   */
  'getPortfolioSnapshotStatus' : ActorMethod<
    [],
    {
      'status' : { 'Stopped' : null } |
        { 'Running' : null },
      'lastSnapshotTime' : bigint,
      'intervalMinutes' : bigint,
    }
  >,
  /**
   * / * Get price alerts (paginated)
   * /    *
   * /    * Returns recent price alert events that triggered token pausing.
   * /    * Accessible by any user with query access.
   */
  'getPriceAlerts' : ActorMethod<
    [bigint, bigint],
    { 'alerts' : Array<PriceAlertLog>, 'totalCount' : bigint }
  >,
  /**
   * / * Get price alerts for a specific token
   * /    *
   * /    * Returns price alert events for a particular token.
   * /    * Accessible by any user with query access.
   */
  'getPriceAlertsForToken' : ActorMethod<
    [Principal, bigint],
    Array<PriceAlertLog>
  >,
  /**
   * / * Get skip metrics and breakdown
   * /    *
   * /    * Returns detailed information about skipped trades including:
   * /    * - Total skipped trades
   * /    * - Breakdown by skip reason
   * /    * - Skip rate as percentage of all attempts
   */
  'getSkipMetrics' : ActorMethod<
    [],
    {
      'skipBreakdown' : {
        'tokensFiltered' : bigint,
        'insufficientCandidates' : bigint,
        'noExecutionPath' : bigint,
        'noPairsFound' : bigint,
        'pausedTokens' : bigint,
      },
      'skipRate' : number,
      'totalTradesSkipped' : bigint,
    }
  >,
  /**
   * / * Get system rebalance parameters
   * /  *
   * /  * Returns all rebalancing configuration parameters that control the behavior
   * /  * of the Treasury including trading intervals, size limits, slippage tolerance, etc.
   * /  *
   * /  * Accessible by any user with query access.
   */
  'getSystemParameters' : ActorMethod<[], RebalanceConfigResponse>,
  /**
   * / * Get all token details including balances and prices
   */
  'getTokenDetails' : ActorMethod<[], Array<[Principal, TokenDetails]>>,
  'getTokenDetailsCache' : ActorMethod<
    [],
    {
      'icpPriceUSD' : number,
      'tokenDetails' : Array<[Principal, TokenDetails]>,
      'timestamp' : bigint,
      'tradingPauses' : Array<TradingPauseRecord>,
    }
  >,
  /**
   * / * Get token details with price history filtered by timestamp (for archive efficiency)
   * /    * Returns only price points newer than the specified timestamp per token
   */
  'getTokenDetailsSince' : ActorMethod<
    [bigint],
    Array<[Principal, TokenDetails]>
  >,
  'getTokenPriceHistory' : ActorMethod<[Array<Principal>], Result_12>,
  /**
   * / * Get trading pause record for a specific token
   * /    *
   * /    * Returns the pause record if the token is paused from trading, null otherwise.
   * /    * Accessible by any user with query access.
   */
  'getTradingPauseInfo' : ActorMethod<[Principal], [] | [TradingPauseRecord]>,
  /**
   * / * Get detailed rebalancing status information
   * /    *
   * /    * Returns:
   * /    * - Current system status
   * /    * - Recent trade history
   * /    * - Portfolio valuation
   * /    * - Current vs target allocations
   * /    * - Performance metrics
   */
  'getTradingStatus' : ActorMethod<[], Result_11>,
  /**
   * / * Get trading status with trades filtered by timestamp (for archive efficiency)
   * /    * Returns only trades newer than the specified timestamp
   */
  'getTradingStatusSince' : ActorMethod<[bigint], Result_10>,
  'getTreasuryAdminActionsSince' : ActorMethod<[bigint, bigint], Result_9>,
  /**
   * / * Get a specific trigger condition by ID
   * /    *
   * /    * Returns details of a single failsafe rule.
   * /    * Accessible by any user with query access.
   */
  'getTriggerCondition' : ActorMethod<[bigint], [] | [TriggerCondition]>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  /**
   * / * List all discovered ICPSwap pools
   * /    *
   * /    * Returns a unique list of all ICPSwap pools that have been discovered.
   * /    * Since pools are stored bidirectionally, this filters out duplicates.
   */
  'listICPSwapPools' : ActorMethod<
    [],
    Array<
      {
        'fee' : bigint,
        'token0' : string,
        'token1' : string,
        'canisterId' : Principal,
      }
    >
  >,
  /**
   * / * List all portfolio circuit breaker conditions
   */
  'listPortfolioCircuitBreakerConditions' : ActorMethod<
    [],
    Array<PortfolioCircuitBreakerCondition>
  >,
  /**
   * / * List all tokens currently paused from trading
   * /    *
   * /    * Returns all tokens in the trading pause registry with their pause reasons.
   * /    * Accessible by any user with query access.
   */
  'listTradingPauses' : ActorMethod<[], TradingPausesResponse>,
  /**
   * / * List all trigger conditions
   * /    *
   * /    * Returns all configured failsafe rules.
   * /    * Accessible by any user with query access.
   */
  'listTriggerConditions' : ActorMethod<[], Array<TriggerCondition>>,
  /**
   * / * Manually pause a token from trading (for admin use)
   * /    *
   * /    * Allows admins to pause tokens from trading with a circuit breaker reason.
   * /    * Only callable by admins with appropriate permissions.
   */
  'pauseTokenFromTradingManual' : ActorMethod<[Principal, string], Result_5>,
  /**
   * / * Process batch transfers from the DAO
   * /    *
   * /    * Handles both immediate and queued transfers of various token types.
   * /    * Only callable by DAO.
   * /    *
   * /    * tempTransferQueue - Array of transfer instructions
   * /    * Immediate - If true, process immediately and return block IDs
   * /    *
   */
  'receiveTransferTasks' : ActorMethod<
    [Array<[TransferRecipient, bigint, Principal, number]>, boolean],
    [boolean, [] | [Array<[Principal, bigint]>]]
  >,
  /**
   * / * Public price refresh function for nachos_vault and authorized callers.
   * /    * Rate-limited to MIN_PRICE_REFRESH_INTERVAL_NS between calls.
   * /    * Wraps the private syncPriceWithDEX() function.
   */
  'refreshAllPrices' : ActorMethod<[], Result_8>,
  'refreshPricesAndGetDetails' : ActorMethod<[], Result_7>,
  /**
   * / * Remove a portfolio circuit breaker condition
   */
  'removePortfolioCircuitBreakerCondition' : ActorMethod<[bigint], Result_3>,
  /**
   * / * Remove a trigger condition
   * /    *
   * /    * Deletes a failsafe rule permanently.
   * /    * Only callable by admins with appropriate permissions.
   */
  'removeTriggerCondition' : ActorMethod<[bigint], Result_1>,
  /**
   * / * Reset the rebalancing state to initial values
   * /    *
   * /    * Completely resets all metrics, trade history, and timers
   * /    * Only callable by DAO or controller.
   */
  'resetRebalanceState' : ActorMethod<[[] | [string]], Result_2>,
  'sendToken' : ActorMethod<
    [Principal, bigint, Principal, [] | [Subaccount]],
    undefined
  >,
  /**
   * / * Set portfolio circuit breaker condition active/inactive
   */
  'setPortfolioCircuitBreakerConditionActive' : ActorMethod<
    [bigint, boolean],
    Result_3
  >,
  /**
   * / * Activate or deactivate a trigger condition
   * /    *
   * /    * Enables or disables a failsafe rule without deleting it.
   * /    * Only callable by admins with appropriate permissions.
   */
  'setTriggerConditionActive' : ActorMethod<[bigint, boolean], Result_1>,
  /**
   * / * Start portfolio snapshots (Admin method)
   */
  'startPortfolioSnapshots' : ActorMethod<[[] | [string]], Result>,
  /**
   * / * Start the automatic rebalancing process
   * /    *
   * /    * Initializes the rebalancing engine, which will periodically:
   * /    * 1. Check current vs target allocations
   * /    * 2. Select tokens to trade
   * /    * 3. Execute trades on the best exchange
   * /    *
   * /    * Only callable by DAO or controller.
   */
  'startRebalancing' : ActorMethod<[[] | [string]], Result_2>,
  /**
   * / * Stop portfolio snapshots (Admin method)
   */
  'stopPortfolioSnapshots' : ActorMethod<[[] | [string]], Result>,
  /**
   * / * Stop the automatic rebalancing process
   * /    *
   * /    * Cancels all timers and sets the system to idle state
   * /    * Only callable by DAO or controller.
   */
  'stopRebalancing' : ActorMethod<[[] | [string]], Result_2>,
  /**
   * / * Synchronize token details with DAO
   * /    *
   * /    * Updates token status from the DAO including:
   * /    * - Active/Inactive status
   * /    * - Paused/Unpaused state
   */
  'syncTokenDetailsFromDAO' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
    Result_6
  >,
  /**
   * / * Manually trigger a portfolio snapshot (admin function)
   */
  'takeManualPortfolioSnapshot' : ActorMethod<[[] | [string]], Result_4>,
  /**
   * / * Manually unpause a token from trading
   * /    *
   * /    * Removes a token from the trading pause registry, allowing it to trade again.
   * /    * Only callable by admins with appropriate permissions.
   */
  'unpauseTokenFromTrading' : ActorMethod<[Principal, [] | [string]], Result_5>,
  /**
   * / * Update the maximum portfolio snapshots limit
   * /    *
   * /    * Sets the maximum number of portfolio snapshots to store.
   * /    * Older snapshots will be automatically removed when the limit is exceeded.
   * /    * Only callable by admins with appropriate permissions.
   */
  'updateMaxPortfolioSnapshots' : ActorMethod<
    [bigint, [] | [string]],
    Result_4
  >,
  /**
   * / * Update the paused token threshold for circuit breaker
   * /    *
   * /    * Sets the number of paused tokens that will trigger the circuit breaker.
   * /    * Only callable by admins with appropriate permissions.
   */
  'updatePausedTokenThresholdForCircuitBreaker' : ActorMethod<
    [bigint],
    Result_3
  >,
  /**
   * / * Update an existing portfolio circuit breaker condition
   */
  'updatePortfolioCircuitBreakerCondition' : ActorMethod<
    [bigint, PortfolioCircuitBreakerUpdate],
    Result_3
  >,
  /**
   * / * Update portfolio snapshot interval (Admin method)
   */
  'updatePortfolioSnapshotInterval' : ActorMethod<
    [bigint, [] | [string]],
    Result
  >,
  /**
   * / * Update the rebalancing configuration parameters
   * /    *
   * /    * Allows adjustment of trading intervals, sizes, and safety limits
   * /    * Only callable by DAO or controller.
   */
  'updateRebalanceConfig' : ActorMethod<
    [UpdateConfig, [] | [boolean], [] | [string]],
    Result_2
  >,
  /**
   * / * Update an existing trigger condition
   * /    *
   * /    * Modifies parameters of an existing failsafe rule.
   * /    * Only callable by admins with appropriate permissions.
   */
  'updateTriggerCondition' : ActorMethod<
    [bigint, TriggerConditionUpdate],
    Result_1
  >,
  'withdrawAllCyclesToSelf' : ActorMethod<[], Result>,
}
export interface _SERVICE extends treasury {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
