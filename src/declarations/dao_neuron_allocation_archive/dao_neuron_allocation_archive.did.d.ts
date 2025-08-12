import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export type AllocationChangeType = {
    'FollowAction' : { 'followedUser' : Principal }
  } |
  { 'UserUpdate' : { 'userInitiated' : boolean } } |
  { 'SystemRebalance' : null } |
  { 'VotingPowerChange' : null };
export type ArchiveError = { 'StorageFull' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'InvalidData' : null } |
  { 'BlockNotFound' : null } |
  { 'InvalidBlockType' : null } |
  { 'InvalidTimeRange' : null };
export interface ArchivedBlock {
  'args' : GetBlocksArgs,
  'callback' : [Principal, string],
}
export interface Block { 'id' : bigint, 'block' : Value }
export interface BlockType { 'url' : string, 'block_type' : string }
export interface DAONeuronAllocationArchive {
  'archiveNeuronAllocationChange' : ActorMethod<
    [NeuronAllocationChangeBlockData],
    Result_2
  >,
  'getArchiveStats' : ActorMethod<[], Result_1>,
  'getNeuronAllocationChangesByMaker' : ActorMethod<
    [Principal, bigint],
    Result
  >,
  'getNeuronAllocationChangesByNeuron' : ActorMethod<
    [Uint8Array | number[], bigint],
    Result
  >,
  'getNeuronAllocationChangesByNeuronInTimeRange' : ActorMethod<
    [Uint8Array | number[], bigint, bigint, bigint],
    Result
  >,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
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
export interface NeuronAllocationChangeBlockData {
  'id' : bigint,
  'maker' : Principal,
  'oldAllocations' : Array<Allocation>,
  'changeType' : AllocationChangeType,
  'votingPower' : bigint,
  'newAllocations' : Array<Allocation>,
  'timestamp' : bigint,
  'neuronId' : Uint8Array | number[],
  'reason' : [] | [string],
}
export type Result = { 'ok' : Array<NeuronAllocationChangeBlockData> } |
  { 'err' : ArchiveError };
export type Result_1 = {
    'ok' : {
      'totalBlocks' : bigint,
      'totalNeuronAllocationChanges' : bigint,
      'makerCount' : bigint,
      'neuronCount' : bigint,
    }
  } |
  { 'err' : ArchiveError };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export interface _SERVICE extends DAONeuronAllocationArchive {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
