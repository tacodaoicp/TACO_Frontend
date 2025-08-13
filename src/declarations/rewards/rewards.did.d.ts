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
export interface DistributionRecord {
  'id' : bigint,
  'startTime' : bigint,
  'status' : DistributionStatus,
  'distributionTime' : bigint,
  'neuronsProcessed' : bigint,
  'endTime' : bigint,
  'totalRewardPot' : number,
  'totalRewardScore' : number,
  'neuronRewards' : Array<NeuronReward>,
}
export type DistributionStatus = { 'Failed' : string } |
  { 'InProgress' : { 'currentNeuron' : bigint, 'totalNeurons' : bigint } } |
  { 'Completed' : null };
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
export interface NeuronReward {
  'rewardAmount' : number,
  'performanceScore' : number,
  'votingPower' : bigint,
  'rewardScore' : number,
  'neuronId' : Uint8Array | number[],
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
export type Result = { 'ok' : string } |
  { 'err' : RewardsError };
export type Result_1 = { 'ok' : PerformanceResult } |
  { 'err' : RewardsError };
export interface Rewards {
  'calculateNeuronPerformance' : ActorMethod<
    [Uint8Array | number[], bigint, bigint, PriceType],
    Result_1
  >,
  'getAllNeuronRewardBalances' : ActorMethod<
    [],
    Array<[Uint8Array | number[], number]>
  >,
  'getCanisterStatus' : ActorMethod<
    [],
    {
      'priceArchiveId' : Principal,
      'environment' : string,
      'distributionStatus' : {
        'lastDistribution' : bigint,
        'totalRewardsDistributed' : number,
        'totalDistributions' : bigint,
        'inProgress' : boolean,
        'nextDistribution' : bigint,
      },
      'daoId' : Principal,
      'neuronAllocationArchiveId' : Principal,
    }
  >,
  'getConfiguration' : ActorMethod<
    [],
    {
      'distributionEnabled' : boolean,
      'distributionPeriodNS' : bigint,
      'maxDistributionHistory' : bigint,
      'weeklyRewardPot' : number,
    }
  >,
  'getCurrentDistributionStatus' : ActorMethod<
    [],
    {
      'nextDistributionTime' : bigint,
      'distributionEnabled' : boolean,
      'currentDistributionId' : [] | [bigint],
      'lastDistributionTime' : bigint,
      'inProgress' : boolean,
    }
  >,
  'getDistributionHistory' : ActorMethod<
    [[] | [bigint]],
    Array<DistributionRecord>
  >,
  'getNeuronRewardBalance' : ActorMethod<[Uint8Array | number[]], number>,
  'setDistributionEnabled' : ActorMethod<[boolean], Result>,
  'setDistributionPeriod' : ActorMethod<[bigint], Result>,
  'setWeeklyRewardPot' : ActorMethod<[number], Result>,
  'startDistributionTimer' : ActorMethod<[], Result>,
  'stopDistributionTimer' : ActorMethod<[], Result>,
  'triggerDistribution' : ActorMethod<[], Result>,
}
export type RewardsError = { 'AllocationDataMissing' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'DistributionInProgress' : null } |
  { 'PriceDataMissing' : { 'token' : Principal, 'timestamp' : bigint } } |
  { 'NeuronNotFound' : null } |
  { 'InvalidTimeRange' : null } |
  { 'InsufficientRewardPot' : null };
export interface _SERVICE extends Rewards {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
