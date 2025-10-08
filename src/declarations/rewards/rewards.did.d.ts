import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export type AllocationChangeType = {
    'FollowAction' : { 'followedUser' : Principal }
  } |
  { 'UserUpdate' : { 'userInitiated' : boolean } } |
  { 'SystemRebalance' : null } |
  { 'VotingPowerChange' : null };
export interface CheckpointData {
  'maker' : [] | [Principal],
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
  'actualDistributed' : bigint,
  'totalRewardPot' : bigint,
  'totalRewardScore' : number,
  'neuronRewards' : Array<NeuronReward>,
  'failedNeurons' : Array<FailedNeuron>,
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
  'rewardAmount' : bigint,
  'performanceScore' : number,
  'votingPower' : bigint,
  'rewardScore' : number,
  'checkpoints' : Array<CheckpointData>,
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
export type Result = { 'Ok' : bigint } |
  { 'Err' : TransferError };
export type Result__1 = { 'ok' : string } |
  { 'err' : RewardsError };
export type Result__1_1 = {
    'ok' : { 'withdrawals' : Array<WithdrawalRecord> }
  } |
  { 'err' : RewardsError };
export type Result__1_2 = {
    'ok' : {
      'totalRecordsInHistory' : bigint,
      'totalWithdrawn' : bigint,
      'totalWithdrawals' : bigint,
    }
  } |
  { 'err' : RewardsError };
export type Result__1_3 = { 'ok' : Array<WithdrawalRecord> } |
  { 'err' : RewardsError };
export type Result__1_4 = { 'ok' : Array<Uint8Array | number[]> } |
  { 'err' : RewardsError };
export type Result__1_5 = {
    'ok' : { 'distributions' : Array<DistributionRecord> }
  } |
  { 'err' : RewardsError };
export type Result__1_6 = { 'ok' : PerformanceResult } |
  { 'err' : RewardsError };
export interface Rewards {
  'addToRewardSkipList' : ActorMethod<[Uint8Array | number[]], Result__1>,
  'calculateNeuronPerformance' : ActorMethod<
    [Uint8Array | number[], bigint, bigint, PriceType],
    Result__1_6
  >,
  'getAllNeuronRewardBalances' : ActorMethod<
    [],
    Array<[Uint8Array | number[], bigint]>
  >,
  'getAllWithdrawalHistory' : ActorMethod<[[] | [bigint]], Result__1_3>,
  'getAvailableBalance' : ActorMethod<[], bigint>,
  'getCanisterStatus' : ActorMethod<
    [],
    {
      'priceArchiveId' : Principal,
      'environment' : string,
      'distributionStatus' : {
        'lastDistribution' : bigint,
        'totalRewardsDistributed' : bigint,
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
      'rewardSkipListSize' : bigint,
      'maxDistributionHistory' : bigint,
      'periodicRewardPot' : bigint,
      'performanceScorePower' : number,
      'totalDistributions' : bigint,
      'nextScheduledDistribution' : [] | [bigint],
      'votingPowerPower' : number,
      'lastDistributionTime' : bigint,
      'timerRunning' : boolean,
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
  'getCurrentTotalNeuronBalances' : ActorMethod<[], bigint>,
  'getDistributionHistory' : ActorMethod<
    [[] | [bigint]],
    Array<DistributionRecord>
  >,
  'getDistributionsSince' : ActorMethod<[bigint, bigint], Result__1_5>,
  'getNeuronRewardBalance' : ActorMethod<[Uint8Array | number[]], bigint>,
  'getNeuronRewardBalances' : ActorMethod<
    [Array<Uint8Array | number[]>],
    Array<[Uint8Array | number[], bigint]>
  >,
  'getRewardSkipList' : ActorMethod<[], Result__1_4>,
  'getTacoBalance' : ActorMethod<[], bigint>,
  'getTotalDistributed' : ActorMethod<[], bigint>,
  'getUserWithdrawalHistory' : ActorMethod<[[] | [bigint]], Result__1_3>,
  'getWithdrawalStats' : ActorMethod<[], Result__1_2>,
  'getWithdrawalsSince' : ActorMethod<[bigint, bigint], Result__1_1>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  'removeFromRewardSkipList' : ActorMethod<[Uint8Array | number[]], Result__1>,
  'setDistributionEnabled' : ActorMethod<[boolean], Result__1>,
  'setDistributionPeriod' : ActorMethod<[bigint], Result__1>,
  'setPerformanceScorePower' : ActorMethod<[number], Result__1>,
  'setPeriodicRewardPot' : ActorMethod<[bigint], Result__1>,
  'setRewardSkipList' : ActorMethod<[Array<Uint8Array | number[]>], Result__1>,
  'setVotingPowerPower' : ActorMethod<[number], Result__1>,
  'startDistributionTimer' : ActorMethod<[], Result__1>,
  'startDistributionTimerAt' : ActorMethod<[bigint], Result__1>,
  'stopDistributionTimer' : ActorMethod<[], Result__1>,
  'triggerDistribution' : ActorMethod<[], Result__1>,
  'triggerDistributionCustom' : ActorMethod<
    [bigint, bigint, PriceType],
    Result__1
  >,
  'withdraw' : ActorMethod<[Account, Array<Uint8Array | number[]>], Result>,
}
export type RewardsError = { 'AllocationDataMissing' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'DistributionInProgress' : null } |
  { 'PriceDataMissing' : { 'token' : Principal, 'timestamp' : bigint } } |
  { 'NeuronNotFound' : null } |
  { 'InvalidTimeRange' : null } |
  { 'InsufficientRewardPot' : null };
export type TransferError = {
    'GenericError' : { 'message' : string, 'error_code' : bigint }
  } |
  { 'TemporarilyUnavailable' : null } |
  { 'BadBurn' : { 'min_burn_amount' : bigint } } |
  { 'Duplicate' : { 'duplicate_of' : bigint } } |
  { 'BadFee' : { 'expected_fee' : bigint } } |
  { 'CreatedInFuture' : { 'ledger_time' : bigint } } |
  { 'TooOld' : null } |
  { 'InsufficientFunds' : { 'balance' : bigint } };
export interface WithdrawalRecord {
  'id' : bigint,
  'fee' : bigint,
  'amountSent' : bigint,
  'neuronWithdrawals' : Array<[Uint8Array | number[], bigint]>,
  'totalAmount' : bigint,
  'timestamp' : bigint,
  'caller' : Principal,
  'targetAccount' : Account,
  'transactionId' : [] | [bigint],
}
export interface _SERVICE extends Rewards {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
