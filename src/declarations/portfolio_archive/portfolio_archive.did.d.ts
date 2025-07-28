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
export interface PortfolioArchiveV2 {
  'archivePortfolioBlock' : ActorMethod<[PortfolioBlockData], Result_3>,
  'getArchiveStatus' : ActorMethod<[], Result_2>,
  'getBatchImportStatus' : ActorMethod<
    [],
    {
      'lastPortfolioImportTime' : bigint,
      'intervalSeconds' : bigint,
      'isRunning' : boolean,
    }
  >,
  'getTimerStatus' : ActorMethod<[], TimerStatus>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
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
export interface PortfolioBlockData {
  'totalValueICP' : bigint,
  'totalValueUSD' : number,
  'timestamp' : bigint,
  'tokenCount' : bigint,
  'pausedTokens' : Array<Principal>,
  'activeTokens' : Array<Principal>,
  'reason' : SnapshotReason,
}
export type Result = { 'ok' : string } |
  { 'err' : ArchiveError };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export type SnapshotReason = { 'ManualTrigger' : null } |
  { 'SystemEvent' : null } |
  { 'PostTrade' : null } |
  { 'Scheduled' : null } |
  { 'CircuitBreaker' : null };
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
export interface _SERVICE extends PortfolioArchiveV2 {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
