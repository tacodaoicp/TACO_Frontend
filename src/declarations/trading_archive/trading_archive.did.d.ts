import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ArchiveConfig {
  'maxBlocksPerCanister' : bigint,
  'blockRetentionPeriodNS' : bigint,
  'autoArchiveEnabled' : boolean,
  'enableCompression' : boolean,
}
export type ArchiveError = { 'StorageFull' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'InvalidData' : null } |
  { 'BlockNotFound' : null } |
  { 'InvalidBlockType' : null } |
  { 'InvalidTimeRange' : null };
export interface ArchiveQueryResult {
  'hasMore' : boolean,
  'totalCount' : bigint,
  'nextIndex' : [] | [bigint],
  'blocks' : Array<Block>,
}
export interface ArchiveStatus {
  'supportedBlockTypes' : Array<string>,
  'newestBlock' : [] | [bigint],
  'storageUsed' : bigint,
  'oldestBlock' : [] | [bigint],
  'totalBlocks' : bigint,
  'lastArchiveTime' : bigint,
}
export interface ArchivedBlock {
  'args' : GetBlocksArgs,
  'callback' : [Principal, string],
}
export interface Block { 'id' : bigint, 'block' : Value }
export interface BlockFilter {
  'maxAmount' : [] | [bigint],
  'startTime' : [] | [bigint],
  'minAmount' : [] | [bigint],
  'endTime' : [] | [bigint],
  'traders' : [] | [Array<Principal>],
  'tokens' : [] | [Array<Principal>],
  'blockTypes' : [] | [Array<TacoBlockType>],
}
export interface BlockType { 'url' : string, 'block_type' : string }
export interface CircuitBreakerBlockData {
  'tokensAffected' : Array<Principal>,
  'systemResponse' : string,
  'triggerToken' : [] | [Principal],
  'actualValue' : number,
  'timestamp' : bigint,
  'severity' : string,
  'thresholdValue' : number,
  'eventType' : CircuitBreakerEventType,
}
export type CircuitBreakerEventType = { 'TradingPause' : null } |
  { 'PortfolioBreaker' : null } |
  { 'PriceAlert' : null } |
  { 'SystemEmergency' : null };
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export type ExchangeType = { 'KongSwap' : null } |
  { 'ICPSwap' : null };
export interface GetArchivesArgs { 'from' : [] | [Principal] }
export type GetArchivesResult = Array<
  { 'end' : bigint, 'canister_id' : Principal, 'start' : bigint }
>;
export type GetBlocksArgs = Array<{ 'start' : bigint, 'length' : bigint }>;
export interface GetBlocksResult {
  'log_length' : bigint,
  'blocks' : Array<Block>,
  'archived_blocks' : Array<ArchivedBlock>,
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
export type Result = { 'ok' : string } |
  { 'err' : ArchiveError };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : ArchiveQueryResult } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : TradingMetrics } |
  { 'err' : ArchiveError };
export type Result_4 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
export type Result_5 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export type TacoBlockType = { 'NeuronUpdate' : null } |
  { 'VotingPower' : null } |
  { 'RewardDistribution' : null } |
  { 'AllocationChange' : null } |
  { 'Pause' : null } |
  { 'Price' : null } |
  { 'FollowAction' : null } |
  { 'Portfolio' : null } |
  { 'Trade' : null } |
  { 'RewardWithdrawal' : null } |
  { 'Admin' : null } |
  { 'Allocation' : null } |
  { 'Circuit' : null };
export interface TimerStatus {
  'innerLoopRunning' : boolean,
  'middleLoopCurrentState' : string,
  'middleLoopStartTime' : bigint,
  'outerLoopLastRun' : bigint,
  'outerLoopRunning' : boolean,
  'innerLoopCurrentType' : string,
  'innerLoopCurrentBatch' : bigint,
  'middleLoopTotalRuns' : bigint,
  'outerLoopIntervalSeconds' : bigint,
  'innerLoopStartTime' : bigint,
  'middleLoopNextScheduled' : bigint,
  'outerLoopTotalRuns' : bigint,
  'middleLoopLastRun' : bigint,
  'middleLoopRunning' : boolean,
  'innerLoopLastRun' : bigint,
  'innerLoopNextScheduled' : bigint,
  'innerLoopTotalBatches' : bigint,
}
export interface TradeBlockData {
  'fee' : bigint,
  'trader' : Principal,
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
export interface TradingArchiveV2 {
  'archiveCircuitBreakerBlock' : ActorMethod<
    [CircuitBreakerBlockData],
    Result_5
  >,
  'archiveTradeBlock' : ActorMethod<[TradeBlockData], Result_5>,
  'archiveTradingPauseBlock' : ActorMethod<[TradingPauseBlockData], Result_5>,
  'catchUpImport' : ActorMethod<[], Result_1>,
  'getArchiveStats' : ActorMethod<[], ArchiveStatus>,
  'getArchiveStatus' : ActorMethod<[], Result_4>,
  'getBatchImportStatus' : ActorMethod<
    [],
    {
      'lastImportedTradeTimestamp' : bigint,
      'intervalSeconds' : bigint,
      'isRunning' : boolean,
      'lastImportedPriceAlertId' : bigint,
    }
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getTimerStatus' : ActorMethod<[], TimerStatus>,
  'getTradingMetrics' : ActorMethod<[bigint, bigint], Result_3>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'queryBlocks' : ActorMethod<[BlockFilter], Result_2>,
  'resetImportTimestamps' : ActorMethod<[], Result_1>,
  'runLegacyManualBatchImport' : ActorMethod<[], Result_1>,
  'runManualBatchImport' : ActorMethod<[], Result_1>,
  'setMaxInnerLoopIterations' : ActorMethod<[bigint], Result_1>,
  'startBatchImportSystem' : ActorMethod<[], Result_1>,
  'startLegacyBatchImportSystem' : ActorMethod<[], Result_1>,
  'stopAllTimers' : ActorMethod<[], Result_1>,
  'stopBatchImportSystem' : ActorMethod<[], Result_1>,
  'updateConfig' : ActorMethod<[ArchiveConfig], Result>,
}
export interface TradingMetrics {
  'exchangeBreakdown' : Array<[ExchangeType, bigint]>,
  'totalTrades' : bigint,
  'totalVolume' : bigint,
  'uniqueTraders' : bigint,
  'avgSlippage' : number,
  'successfulTrades' : bigint,
  'avgTradeSize' : bigint,
  'topTokensByVolume' : Array<[Principal, bigint]>,
}
export interface TradingPauseBlockData {
  'token' : Principal,
  'duration' : [] | [bigint],
  'tokenSymbol' : string,
  'timestamp' : bigint,
  'reason' : TradingPauseReason,
}
export type TradingPauseReason = { 'PriceVolatility' : null } |
  { 'AdminAction' : null } |
  { 'LiquidityIssue' : null } |
  { 'CircuitBreaker' : null } |
  { 'SystemMaintenance' : null };
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export interface _SERVICE extends TradingArchiveV2 {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
