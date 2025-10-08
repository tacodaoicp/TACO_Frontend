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
export interface DAOGovernanceArchive {
  'archiveNeuronUpdate' : ActorMethod<[NeuronUpdateBlockData], Result_2>,
  'archiveVotingPowerChange' : ActorMethod<[VotingPowerBlockData], Result_2>,
  'getArchiveStats' : ActorMethod<[], ArchiveStatus>,
  'getArchiveStatus' : ActorMethod<[], Result_4>,
  'getBatchImportStatus' : ActorMethod<
    [],
    { 'intervalSeconds' : bigint, 'isRunning' : boolean }
  >,
  'getGovernanceMetrics' : ActorMethod<
    [],
    {
      'totalActiveUsers' : bigint,
      'averageVotingPowerPerUser' : bigint,
      'activeNeuronCount' : bigint,
      'totalVotingPowerInSystem' : bigint,
    }
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getNeuronUpdatesByNeuron' : ActorMethod<
    [Uint8Array | number[], bigint],
    Result_3
  >,
  'getTimerStatus' : ActorMethod<[], TimerStatus>,
  'getUserVotingPowerAtTime' : ActorMethod<[Principal, bigint], Result_2>,
  'getVotingPowerChangesByUser' : ActorMethod<[Principal, bigint], Result_1>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'importNeuronUpdates' : ActorMethod<[], Result>,
  'importVotingPowerChanges' : ActorMethod<[], Result>,
  'resetImportTimestamps' : ActorMethod<[], Result>,
  'runManualBatchImport' : ActorMethod<[], Result>,
  'setMaxInnerLoopIterations' : ActorMethod<[bigint], Result>,
  'startBatchImportSystem' : ActorMethod<[], Result>,
  'stopAllTimers' : ActorMethod<[], Result>,
  'stopBatchImportSystem' : ActorMethod<[], Result>,
}
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
export interface NeuronUpdateBlockData {
  'id' : bigint,
  'updateType' : NeuronUpdateType,
  'oldVotingPower' : [] | [bigint],
  'timestamp' : bigint,
  'neuronId' : Uint8Array | number[],
  'newVotingPower' : [] | [bigint],
  'affectedUsers' : Array<Principal>,
}
export type NeuronUpdateType = { 'VotingPowerChanged' : null } |
  { 'StateChanged' : null } |
  { 'Added' : null } |
  { 'Removed' : null };
export interface NeuronVP {
  'votingPower' : bigint,
  'neuronId' : Uint8Array | number[],
}
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : Array<VotingPowerBlockData> } |
  { 'err' : ArchiveError };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : Array<NeuronUpdateBlockData> } |
  { 'err' : ArchiveError };
export type Result_4 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
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
export interface VotingPowerBlockData {
  'id' : bigint,
  'changeType' : VotingPowerChangeType,
  'user' : Principal,
  'oldVotingPower' : bigint,
  'timestamp' : bigint,
  'newVotingPower' : bigint,
  'neurons' : Array<NeuronVP>,
}
export type VotingPowerChangeType = { 'SystemUpdate' : null } |
  { 'NeuronSnapshot' : null } |
  { 'ManualRefresh' : null };
export interface _SERVICE extends DAOGovernanceArchive {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
