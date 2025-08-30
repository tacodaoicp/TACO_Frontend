import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export type ArchiveError = { 'StorageFull' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'InvalidData' : null } |
  { 'BlockNotFound' : null } |
  { 'InvalidBlockType' : null } |
  { 'InvalidTimeRange' : null };
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
export interface BlockType { 'url' : string, 'block_type' : string }
export interface CheckpointData {
  'maker' : [] | [Principal],
  'totalPortfolioValue' : number,
  'pricesUsed' : Array<[Principal, PriceInfo]>,
  'timestamp' : bigint,
  'allocations' : Array<Allocation>,
  'tokenValues' : Array<[Principal, number]>,
}
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export type DistributionStatus = { 'Failed' : string } |
  {
    'PartiallyCompleted' : {
      'successfulNeurons' : bigint,
      'failedNeurons' : bigint,
    }
  } |
  { 'InProgress' : { 'currentNeuron' : bigint, 'totalNeurons' : bigint } } |
  { 'Completed' : null };
export interface FailedNeuron {
  'errorMessage' : string,
  'neuronId' : Uint8Array | number[],
}
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
export interface NeuronReward {
  'rewardAmount' : bigint,
  'performanceScore' : number,
  'votingPower' : bigint,
  'rewardScore' : number,
  'checkpoints' : Array<CheckpointData>,
  'neuronId' : Uint8Array | number[],
}
export interface PriceInfo {
  'usdPrice' : number,
  'timestamp' : bigint,
  'icpPrice' : bigint,
}
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : Array<RewardDistributionBlockData> } |
  { 'err' : ArchiveError };
export type Result_2 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export interface RewardDistributionArchive {
  'archiveRewardDistribution' : ActorMethod<
    [RewardDistributionBlockData],
    Result_3
  >,
  'getArchiveStats' : ActorMethod<[], ArchiveStatus>,
  'getArchiveStatus' : ActorMethod<[], Result_2>,
  'getBatchImportStatus' : ActorMethod<
    [],
    { 'intervalSeconds' : bigint, 'isRunning' : boolean }
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getRewardDistributionsByDistributionId' : ActorMethod<
    [bigint, [] | [bigint], bigint],
    Result_1
  >,
  'getRewardDistributionsByTimeRange' : ActorMethod<
    [bigint, bigint, bigint],
    Result_1
  >,
  'getTimerStatus' : ActorMethod<[], TimerStatus>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'resetImportTimestamps' : ActorMethod<[], Result>,
  'runManualBatchImport' : ActorMethod<[], Result>,
  'setMaxInnerLoopIterations' : ActorMethod<[bigint], Result>,
  'startBatchImportSystem' : ActorMethod<[], Result>,
  'stopAllTimers' : ActorMethod<[], Result>,
  'stopBatchImportSystem' : ActorMethod<[], Result>,
}
export interface RewardDistributionBlockData {
  'id' : bigint,
  'startTime' : bigint,
  'status' : DistributionStatus,
  'neuronsProcessed' : bigint,
  'endTime' : bigint,
  'actualDistributed' : bigint,
  'totalRewardPot' : bigint,
  'timestamp' : bigint,
  'totalRewardScore' : number,
  'neuronRewards' : Array<NeuronReward>,
  'failedNeurons' : Array<FailedNeuron>,
}
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
export interface _SERVICE extends RewardDistributionArchive {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
