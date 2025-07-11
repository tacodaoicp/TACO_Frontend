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
export interface PortfolioCircuitBreakerCondition__1 {
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
  'triggeredCondition' : PortfolioCircuitBreakerCondition__1,
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
export type PortfolioDirection__1 = { 'Up' : null } |
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
export type PortfolioValueType__1 = { 'ICP' : null } |
  { 'USD' : null };
export interface PriceAlertLog {
  'id' : bigint,
  'token' : Principal,
  'tokenSymbol' : string,
  'timestamp' : bigint,
  'priceData' : TriggerPriceData,
  'triggeredCondition' : TriggerCondition__1,
}
export type PriceDirection = { 'Up' : null } |
  { 'Down' : null };
export type PriceDirection__1 = { 'Up' : null } |
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
export interface PricePoint__1 {
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
export type Result_10 = { 'ok' : bigint } |
  { 'err' : PriceFailsafeError };
export type Result_11 = { 'ok' : bigint } |
  { 'err' : PortfolioCircuitBreakerError };
export type Result_2 = { 'ok' : string } |
  { 'err' : PortfolioCircuitBreakerError };
export type Result_3 = { 'ok' : string } |
  { 'err' : PortfolioSnapshotError };
export type Result_4 = { 'ok' : string } |
  { 'err' : TradingPauseError };
export type Result_5 = { 'ok' : string } |
  { 'err' : SyncErrorTreasury };
export type Result_6 = {
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
export type Result_7 = { 'ok' : Array<[Principal, Array<PricePoint__1>]> } |
  { 'err' : string };
export type Result_8 = { 'ok' : PortfolioHistoryResponse } |
  { 'err' : PortfolioSnapshotError };
export type Result_9 = { 'ok' : string } |
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
export interface TradingPauseRecord__1 {
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
export interface TriggerCondition__1 {
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
    [string, PortfolioDirection__1, number, bigint, PortfolioValueType__1],
    Result_11
  >,
  'addTriggerCondition' : ActorMethod<
    [string, PriceDirection__1, number, bigint, Array<Principal>],
    Result_10
  >,
  'admin_executeTradingCycle' : ActorMethod<[], Result_1>,
  'admin_recoverPoolBalances' : ActorMethod<[], Result_9>,
  'admin_syncWithDao' : ActorMethod<[], Result_9>,
  'clearAllTradingPauses' : ActorMethod<[], Result_4>,
  'clearLogs' : ActorMethod<[], undefined>,
  'clearPortfolioCircuitBreakerLogs' : ActorMethod<[], Result_2>,
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
  'getPortfolioHistory' : ActorMethod<[bigint], Result_8>,
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
  'getTokenPriceHistory' : ActorMethod<[Array<Principal>], Result_7>,
  'getTradingPauseInfo' : ActorMethod<
    [Principal],
    [] | [TradingPauseRecord__1]
  >,
  'getTradingStatus' : ActorMethod<[], Result_6>,
  'getTriggerCondition' : ActorMethod<[bigint], [] | [TriggerCondition]>,
  'listPortfolioCircuitBreakerConditions' : ActorMethod<
    [],
    Array<PortfolioCircuitBreakerCondition>
  >,
  'listTradingPauses' : ActorMethod<[], TradingPausesResponse>,
  'listTriggerConditions' : ActorMethod<[], Array<TriggerCondition>>,
  'pauseTokenFromTradingManual' : ActorMethod<[Principal, string], Result_4>,
  'receiveTransferTasks' : ActorMethod<
    [Array<[TransferRecipient, bigint, Principal, number]>, boolean],
    [boolean, [] | [Array<[Principal, bigint]>]]
  >,
  'removePortfolioCircuitBreakerCondition' : ActorMethod<[bigint], Result_2>,
  'removeTriggerCondition' : ActorMethod<[bigint], Result>,
  'resetRebalanceState' : ActorMethod<[], Result_1>,
  'setPortfolioCircuitBreakerConditionActive' : ActorMethod<
    [bigint, boolean],
    Result_2
  >,
  'setTest' : ActorMethod<[boolean], undefined>,
  'setTriggerConditionActive' : ActorMethod<[bigint, boolean], Result>,
  'startRebalancing' : ActorMethod<[], Result_1>,
  'stopRebalancing' : ActorMethod<[], Result_1>,
  'syncTokenDetailsFromDAO' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
    Result_5
  >,
  'takeManualPortfolioSnapshot' : ActorMethod<[], Result_3>,
  'unpauseTokenFromTrading' : ActorMethod<[Principal], Result_4>,
  'updateMaxPortfolioSnapshots' : ActorMethod<[bigint], Result_3>,
  'updatePausedTokenThresholdForCircuitBreaker' : ActorMethod<
    [bigint],
    Result_2
  >,
  'updatePortfolioCircuitBreakerCondition' : ActorMethod<
    [bigint, PortfolioCircuitBreakerUpdate],
    Result_2
  >,
  'updateRebalanceConfig' : ActorMethod<
    [UpdateConfig, [] | [boolean]],
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
