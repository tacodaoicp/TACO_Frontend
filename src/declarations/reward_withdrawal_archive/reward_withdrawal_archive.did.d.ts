import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

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
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
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
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : Array<RewardWithdrawalBlockData> } |
  { 'err' : ArchiveError };
export type Result_2 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export interface RewardWithdrawalArchive {
  'archiveRewardWithdrawal' : ActorMethod<
    [RewardWithdrawalBlockData],
    Result_3
  >,
  'getArchiveStats' : ActorMethod<[], ArchiveStatus>,
  'getArchiveStatus' : ActorMethod<[], Result_2>,
  'getBatchImportStatus' : ActorMethod<
    [],
    { 'intervalSeconds' : bigint, 'isRunning' : boolean }
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getRewardWithdrawalsByCaller' : ActorMethod<
    [Principal, [] | [bigint], bigint],
    Result_1
  >,
  'getRewardWithdrawalsByNeuron' : ActorMethod<
    [Uint8Array | number[], [] | [bigint], bigint],
    Result_1
  >,
  'getRewardWithdrawalsByTimeRange' : ActorMethod<
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
export interface RewardWithdrawalBlockData {
  'id' : bigint,
  'fee' : bigint,
  'amountSent' : bigint,
  'targetAccountOwner' : Principal,
  'neuronWithdrawals' : Array<[Uint8Array | number[], bigint]>,
  'totalAmount' : bigint,
  'timestamp' : bigint,
  'caller' : Principal,
  'targetAccountSubaccount' : [] | [Uint8Array | number[]],
  'transactionId' : [] | [bigint],
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
export interface _SERVICE extends RewardWithdrawalArchive {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
