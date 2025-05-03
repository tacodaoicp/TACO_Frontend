import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export type FollowError = { 'FollowLimitReached' : null } |
  { 'FollowerNoAllocationYetMade' : null } |
  { 'NotAllowed' : null } |
  { 'AlreadyFollowing' : null } |
  { 'FollowerNotFound' : null } |
  { 'FollowUnfollowLimitReached' : null } |
  { 'NotAdmin' : null } |
  { 'FolloweeNotFound' : null } |
  { 'FolloweeIsSelf' : null } |
  { 'UnexpectedError' : string } |
  { 'FolloweeLimitReached' : null } |
  { 'FolloweeNoAllocationYetMade' : null } |
  { 'SystemInactive' : null };
export interface NeuronVP {
  'votingPower' : bigint,
  'neuronId' : Uint8Array | number[],
}
export type Result = { 'ok' : string } |
  { 'err' : UpdateError };
export type Result_1 = { 'ok' : string } |
  { 'err' : UnfollowError };
export type Result_2 = { 'ok' : SwapResult } |
  { 'err' : string };
export type Result_3 = { 'ok' : string } |
  { 'err' : FollowError };
export type SwapError = { 'InvalidBlock' : null } |
  { 'InvalidAmount' : null } |
  { 'TransferError' : null } |
  { 'InvalidPrice' : null } |
  { 'BlockAlreadyProcessed' : null } |
  { 'InsufficientBalance' : null } |
  { 'SwapAlreadyRunning' : null } |
  { 'UnexpectedError' : string } |
  { 'TokenNotTrusted' : null };
export interface SwapResult {
  'returnedSentAmount' : bigint,
  'blockNumber' : bigint,
  'wantedTokenAddress' : string,
  'error' : [] | [SwapError],
  'sentTokenAddress' : string,
  'usedSentAmount' : bigint,
  'success' : boolean,
  'returnedWantedAmount' : bigint,
  'swappedAmount' : bigint,
}
export type UnfollowError = { 'NotAllowed' : null } |
  { 'FollowerNotFound' : null } |
  { 'FollowUnfollowLimitReached' : null } |
  { 'NotAdmin' : null } |
  { 'FolloweeNotFound' : null } |
  { 'FolloweeIsSelf' : null } |
  { 'UnexpectedError' : string } |
  { 'AlreadyUnfollowing' : null } |
  { 'SystemInactive' : null };
export type UpdateError = { 'NotAllowed' : null } |
  { 'UnexpectedError' : string } |
  { 'InvalidAllocation' : null } |
  { 'NoVotingPower' : null } |
  { 'SystemInactive' : null };
export interface UserState {
  'lastVotingPowerUpdate' : bigint,
  'votingPower' : bigint,
  'allocationFollows' : Array<{ 'since' : bigint, 'follow' : Principal }>,
  'lastAllocationMaker' : Principal,
  'allocationFollowedBy' : Array<{ 'since' : bigint, 'follow' : Principal }>,
  'followUnfollowActions' : Array<bigint>,
  'pastAllocations' : Array<
    {
      'to' : bigint,
      'from' : bigint,
      'allocation' : Array<Allocation>,
      'allocationMaker' : Principal,
    }
  >,
  'allocations' : Array<Allocation>,
  'lastAllocationUpdate' : bigint,
  'neurons' : Array<NeuronVP>,
}
export interface _SERVICE {
  'TransferICPtoMintVault' : ActorMethod<[bigint], bigint>,
  'TransferICRCAtoMintVault' : ActorMethod<[bigint], bigint>,
  'TransferICRCBtoMintVault' : ActorMethod<[bigint], bigint>,
  'followAllocation' : ActorMethod<[Principal], Result_3>,
  'getUserAllocation' : ActorMethod<[], [] | [UserState]>,
  'swapTokenForTaco' : ActorMethod<[Principal, bigint, bigint], Result_2>,
  'unfollowAllocation' : ActorMethod<[Principal], Result_1>,
  'updateAllocation' : ActorMethod<[Array<Allocation>], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
