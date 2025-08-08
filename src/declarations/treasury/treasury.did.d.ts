import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ChangeType = { 'CurrentToMax' : null } |
  { 'CurrentToMin' : null } |
  { 'MinToMax' : null };
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
export interface RebalanceConfig {
  'tokenSyncTimeoutNS' : bigint,
  'maxSlippageBasisPoints' : bigint,
  'shortSyncIntervalNS' : bigint,
  'rebalanceIntervalNS' : bigint,
  'maxTradesStored' : bigint,
  'maxTradeValueICP' : bigint,
  'minTradeValueICP' : bigint,
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
  { 'err' : PriceFailsafeError };
export type Result_1 = { 'ok' : string } |
  { 'err' : RebalanceError };
export type Result_10 = { 'ok' : Array<[Principal, Array<PricePoint>]> } |
  { 'err' : string };
export type Result_11 = { 'ok' : PortfolioHistoryResponse } |
  { 'err' : PortfolioSnapshotError };
export type Result_12 = { 'ok' : bigint } |
  { 'err' : PriceFailsafeError };
export type Result_13 = { 'ok' : bigint } |
  { 'err' : PortfolioCircuitBreakerError };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Result_3 = { 'ok' : string } |
  { 'err' : PortfolioCircuitBreakerError };
export type Result_4 = { 'ok' : string } |
  { 'err' : PortfolioSnapshotError };
export type Result_5 = { 'ok' : string } |
  { 'err' : TradingPauseError };
export type Result_6 = { 'ok' : string } |
  { 'err' : SyncErrorTreasury };
export type Result_7 = { 'ok' : TreasuryAdminActionsSinceResponse } |
  { 'err' : TradingPauseError };
export type Result_8 = {
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
export type Result_9 = {
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
  'portfolioRebalancePeriodNS' : [] | [bigint],
  'longSyncIntervalNS' : [] | [bigint],
  'maxTradeAttemptsPerInterval' : [] | [bigint],
  'maxKongswapAttempts' : [] | [bigint],
}
export interface treasury {
  'addPortfolioCircuitBreakerCondition' : ActorMethod<
    [string, PortfolioDirection, number, bigint, PortfolioValueType],
    Result_13
  >,
  'addTriggerCondition' : ActorMethod<
    [string, PriceDirection, number, bigint, Array<Principal>],
    Result_12
  >,
  'admin_executeTradingCycle' : ActorMethod<[[] | [string]], Result_1>,
  'admin_recoverPoolBalances' : ActorMethod<[], Result_2>,
  'admin_syncWithDao' : ActorMethod<[], Result_2>,
  'clearAllTradingPauses' : ActorMethod<[[] | [string]], Result_5>,
  'clearLogs' : ActorMethod<[], undefined>,
  'clearPortfolioCircuitBreakerLogs' : ActorMethod<[], Result_3>,
  'clearPriceAlerts' : ActorMethod<[], Result>,
  'getCurrentAllocations' : ActorMethod<[], Array<[Principal, bigint]>>,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  'getMaxPortfolioSnapshots' : ActorMethod<[], bigint>,
  'getMaxPriceHistoryEntries' : ActorMethod<[], bigint>,
  'getPausedTokenThresholdForCircuitBreaker' : ActorMethod<[], bigint>,
  'getPortfolioCircuitBreakerCondition' : ActorMethod<
    [bigint],
    [] | [PortfolioCircuitBreakerCondition]
  >,
  'getPortfolioCircuitBreakerLogs' : ActorMethod<
    [bigint, bigint],
    { 'logs' : Array<PortfolioCircuitBreakerLog>, 'totalCount' : bigint }
  >,
  'getPortfolioHistory' : ActorMethod<[bigint], Result_11>,
  'getPortfolioHistorySince' : ActorMethod<[bigint, bigint], Result_11>,
  'getPortfolioSnapshotStatus' : ActorMethod<
    [],
    {
      'status' : { 'Stopped' : null } |
        { 'Running' : null },
      'lastSnapshotTime' : bigint,
      'intervalMinutes' : bigint,
    }
  >,
  'getPriceAlerts' : ActorMethod<
    [bigint, bigint],
    { 'alerts' : Array<PriceAlertLog>, 'totalCount' : bigint }
  >,
  'getPriceAlertsForToken' : ActorMethod<
    [Principal, bigint],
    Array<PriceAlertLog>
  >,
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
  'getSystemParameters' : ActorMethod<[], RebalanceConfig>,
  'getTokenDetails' : ActorMethod<[], Array<[Principal, TokenDetails]>>,
  'getTokenDetailsSince' : ActorMethod<
    [bigint],
    Array<[Principal, TokenDetails]>
  >,
  'getTokenPriceHistory' : ActorMethod<[Array<Principal>], Result_10>,
  'getTradingPauseInfo' : ActorMethod<[Principal], [] | [TradingPauseRecord]>,
  'getTradingStatus' : ActorMethod<[], Result_9>,
  'getTradingStatusSince' : ActorMethod<[bigint], Result_8>,
  'getTreasuryAdminActionsSince' : ActorMethod<[bigint, bigint], Result_7>,
  'getTriggerCondition' : ActorMethod<[bigint], [] | [TriggerCondition]>,
  'listPortfolioCircuitBreakerConditions' : ActorMethod<
    [],
    Array<PortfolioCircuitBreakerCondition>
  >,
  'listTradingPauses' : ActorMethod<[], TradingPausesResponse>,
  'listTriggerConditions' : ActorMethod<[], Array<TriggerCondition>>,
  'pauseTokenFromTradingManual' : ActorMethod<[Principal, string], Result_5>,
  'receiveTransferTasks' : ActorMethod<
    [Array<[TransferRecipient, bigint, Principal, number]>, boolean],
    [boolean, [] | [Array<[Principal, bigint]>]]
  >,
  'removePortfolioCircuitBreakerCondition' : ActorMethod<[bigint], Result_3>,
  'removeTriggerCondition' : ActorMethod<[bigint], Result>,
  'resetRebalanceState' : ActorMethod<[[] | [string]], Result_1>,
  'setPortfolioCircuitBreakerConditionActive' : ActorMethod<
    [bigint, boolean],
    Result_3
  >,
  'setTest' : ActorMethod<[boolean], undefined>,
  'setTriggerConditionActive' : ActorMethod<[bigint, boolean], Result>,
  'startPortfolioSnapshots' : ActorMethod<[[] | [string]], Result_2>,
  'startRebalancing' : ActorMethod<[[] | [string]], Result_1>,
  'stopPortfolioSnapshots' : ActorMethod<[[] | [string]], Result_2>,
  'stopRebalancing' : ActorMethod<[[] | [string]], Result_1>,
  'syncTokenDetailsFromDAO' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
    Result_6
  >,
  'takeManualPortfolioSnapshot' : ActorMethod<[[] | [string]], Result_4>,
  'unpauseTokenFromTrading' : ActorMethod<[Principal, [] | [string]], Result_5>,
  'updateMaxPortfolioSnapshots' : ActorMethod<
    [bigint, [] | [string]],
    Result_4
  >,
  'updatePausedTokenThresholdForCircuitBreaker' : ActorMethod<
    [bigint],
    Result_3
  >,
  'updatePortfolioCircuitBreakerCondition' : ActorMethod<
    [bigint, PortfolioCircuitBreakerUpdate],
    Result_3
  >,
  'updatePortfolioSnapshotInterval' : ActorMethod<
    [bigint, [] | [string]],
    Result_2
  >,
  'updateRebalanceConfig' : ActorMethod<
    [UpdateConfig, [] | [boolean], [] | [string]],
    Result_1
  >,
  'updateTriggerCondition' : ActorMethod<
    [bigint, TriggerConditionUpdate],
    Result
  >,
}
export interface _SERVICE extends treasury {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
