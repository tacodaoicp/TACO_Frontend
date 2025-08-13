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
export interface CheckpointData {
  'totalPortfolioValue' : number,
  'pricesUsed' : Array<[Principal, PriceInfo]>,
  'timestamp' : bigint,
  'allocations' : Array<Allocation>,
  'tokenValues' : Array<[Principal, number]>,
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
export interface PerformanceResult {
  'startTime' : bigint,
  'endTime' : bigint,
  'performanceScore' : number,
  'finalValue' : number,
  'preTimespanAllocation' : [] | [NeuronAllocationChangeBlockData],
  'checkpoints' : Array<CheckpointData>,
  'neuronId' : Uint8Array | number[],
  'allocationChanges' : bigint,
  'inTimespanChanges' : Array<NeuronAllocationChangeBlockData>,
  'initialValue' : number,
}
export interface PriceInfo {
  'usdPrice' : number,
  'timestamp' : bigint,
  'icpPrice' : bigint,
}
export type PriceType = { 'ICP' : null } |
  { 'USD' : null };
export type Result = { 'ok' : PerformanceResult } |
  { 'err' : RewardsError };
export interface Rewards {
  'calculateNeuronPerformance' : ActorMethod<
    [Uint8Array | number[], bigint, bigint, PriceType],
    Result
  >,
  'getCanisterStatus' : ActorMethod<
    [],
    {
      'priceArchiveId' : Principal,
      'environment' : string,
      'neuronAllocationArchiveId' : Principal,
    }
  >,
}
export type RewardsError = { 'AllocationDataMissing' : null } |
  { 'SystemError' : string } |
  { 'PriceDataMissing' : { 'token' : Principal, 'timestamp' : bigint } } |
  { 'NeuronNotFound' : null } |
  { 'InvalidTimeRange' : null };
export interface _SERVICE extends Rewards {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
