import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export interface AllocationChangeBlockData {
  'id' : bigint,
  'maker' : Principal,
  'oldAllocations' : Array<Allocation>,
  'changeType' : AllocationChangeType,
  'votingPower' : bigint,
  'newAllocations' : Array<Allocation>,
  'user' : Principal,
  'timestamp' : bigint,
  'reason' : [] | [string],
}
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
export interface DAOAllocationArchive {
  'archiveAllocationChange' : ActorMethod<
    [AllocationChangeBlockData],
    Result_3
  >,
  'archiveFollowAction' : ActorMethod<[FollowActionBlockData], Result_3>,
  'getAllocationChangesByToken' : ActorMethod<[Principal, bigint], Result_2>,
  'getAllocationChangesByUser' : ActorMethod<[Principal, bigint], Result_2>,
  'getArchiveStats' : ActorMethod<
    [],
    {
      'totalFollowActions' : bigint,
      'totalBlocks' : bigint,
      'totalFollowCount' : bigint,
      'totalUnfollowCount' : bigint,
      'totalAllocationChanges' : bigint,
      'lastImportedAllocationTimestamp' : bigint,
      'lastImportedFollowTimestamp' : bigint,
    }
  >,
  'getFollowActionsByUser' : ActorMethod<[Principal, bigint], Result_1>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'importAllocationChanges' : ActorMethod<[], Result>,
  'importFollowActions' : ActorMethod<[], Result>,
}
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export interface FollowActionBlockData {
  'id' : bigint,
  'previousFollowCount' : bigint,
  'action' : FollowActionType,
  'followed' : Principal,
  'follower' : Principal,
  'timestamp' : bigint,
  'newFollowCount' : bigint,
}
export type FollowActionType = { 'Follow' : null } |
  { 'Unfollow' : null };
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
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : Array<FollowActionBlockData> } |
  { 'err' : ArchiveError };
export type Result_2 = { 'ok' : Array<AllocationChangeBlockData> } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export interface _SERVICE extends DAOAllocationArchive {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
