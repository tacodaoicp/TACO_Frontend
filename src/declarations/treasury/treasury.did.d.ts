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
export type Result_2 = { 'ok' : string } |
  { 'err' : SyncErrorTreasury };
export type Result_3 = {
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
export type Result_4 = { 'ok' : Array<[Principal, Array<PricePoint__1>]> } |
  { 'err' : string };
export type Result_5 = { 'ok' : string } |
  { 'err' : string };
export type Result_6 = { 'ok' : bigint } |
  { 'err' : PriceFailsafeError };
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
  'addTriggerCondition' : ActorMethod<
    [string, PriceDirection__1, number, bigint, Array<Principal>],
    Result_6
  >,
  'admin_executeTradingCycle' : ActorMethod<[], Result_1>,
  'admin_recoverPoolBalances' : ActorMethod<[], Result_5>,
  'admin_syncWithDao' : ActorMethod<[], Result_5>,
  'clearLogs' : ActorMethod<[], undefined>,
  'clearPriceAlerts' : ActorMethod<[], Result>,
  'getCurrentAllocations' : ActorMethod<[], Array<[Principal, bigint]>>,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
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
  'getTokenPriceHistory' : ActorMethod<[Array<Principal>], Result_4>,
  'getTradingStatus' : ActorMethod<[], Result_3>,
  'getTriggerCondition' : ActorMethod<[bigint], [] | [TriggerCondition]>,
  'listTriggerConditions' : ActorMethod<[], Array<TriggerCondition>>,
  'receiveTransferTasks' : ActorMethod<
    [Array<[TransferRecipient, bigint, Principal, number]>, boolean],
    [boolean, [] | [Array<[Principal, bigint]>]]
  >,
  'removeTriggerCondition' : ActorMethod<[bigint], Result>,
  'resetRebalanceState' : ActorMethod<[], Result_1>,
  'setTest' : ActorMethod<[boolean], undefined>,
  'setTriggerConditionActive' : ActorMethod<[bigint, boolean], Result>,
  'startRebalancing' : ActorMethod<[], Result_1>,
  'stopRebalancing' : ActorMethod<[], Result_1>,
  'syncTokenDetailsFromDAO' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
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
