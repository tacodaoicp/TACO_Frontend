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
export interface PriceArchiveV2 {
  'archivePriceBlock' : ActorMethod<[PriceBlockData], Result_9>,
  'catchUpImport' : ActorMethod<[], Result_1>,
  'forceResetMiddleLoop' : ActorMethod<[], Result_1>,
  'getArchiveStats' : ActorMethod<[], ArchiveStatus>,
  'getArchiveStatus' : ActorMethod<[], Result_8>,
  'getBatchImportStatus' : ActorMethod<
    [],
    {
      'lastImportedPriceTime' : bigint,
      'intervalSeconds' : bigint,
      'isRunning' : boolean,
    }
  >,
  'getLatestPrice' : ActorMethod<[Principal], Result_5>,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getPriceAtOrAfterTime' : ActorMethod<[Principal, bigint], Result_5>,
  'getPriceAtTime' : ActorMethod<[Principal, bigint], Result_5>,
  'getPriceHistory' : ActorMethod<[Principal, bigint, bigint], Result_4>,
  'getPricesAtTime' : ActorMethod<[Array<Principal>, bigint], Result_3>,
  'getTimerStatus' : ActorMethod<[], TimerStatus>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
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
export interface PriceBlockData {
  'token' : Principal,
  'change24h' : [] | [number],
  'source' : PriceSource,
  'volume24h' : [] | [bigint],
  'timestamp' : bigint,
  'priceICP' : bigint,
  'priceUSD' : number,
}
export type PriceSource = { 'NTN' : null } |
  { 'Aggregated' : null } |
  { 'Oracle' : null } |
  { 'Exchange' : ExchangeType };
export type Result = { 'ok' : string } |
  { 'err' : ArchiveError };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : ArchiveQueryResult } |
  { 'err' : ArchiveError };
export type Result_3 = {
    'ok' : Array<
      [
        Principal,
        [] | [
          { 'usdPrice' : number, 'timestamp' : bigint, 'icpPrice' : bigint }
        ],
      ]
    >
  } |
  { 'err' : ArchiveError };
export type Result_4 = { 'ok' : Array<PriceBlockData> } |
  { 'err' : ArchiveError };
export type Result_5 = {
    'ok' : [] | [
      { 'usdPrice' : number, 'timestamp' : bigint, 'icpPrice' : bigint }
    ]
  } |
  { 'err' : ArchiveError };
export type Result_8 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
export type Result_9 = { 'ok' : bigint } |
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
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export interface _SERVICE extends PriceArchiveV2 {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
