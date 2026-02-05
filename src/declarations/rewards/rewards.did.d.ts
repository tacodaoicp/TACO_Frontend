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
export interface BackfillConfig {
  'periodDays' : bigint,
  'startTime' : bigint,
  'skipExistingPeriods' : boolean,
  'clearExisting' : boolean,
  'maxPeriods' : bigint,
}
export interface BackfillResult {
  'startTime' : bigint,
  'neuronsProcessed' : bigint,
  'periodsCreated' : bigint,
  'totalNeuronRewards' : bigint,
  'endTime' : bigint,
  'errors' : Array<string>,
}
export interface CheckpointData {
  'maker' : [] | [Principal],
  'totalPortfolioValue' : number,
  'pricesUsed' : Array<[Principal, PriceInfo]>,
  'timestamp' : bigint,
  'allocations' : Array<Allocation>,
  'tokenValues' : Array<[Principal, number]>,
  'reason' : [] | [string],
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
export interface GraphCheckpointData {
  'maker' : [] | [Principal],
  'totalPortfolioValue' : number,
  'totalPortfolioValueICP' : number,
  'pricesUsed' : Array<[Principal, PriceInfo]>,
  'timestamp' : bigint,
  'allocations' : Array<Allocation>,
  'tokenValues' : Array<[Principal, number]>,
  'reason' : [] | [string],
}
export interface LeaderboardEntry {
  'principal' : Principal,
  'displayName' : [] | [string],
  'performanceScore' : number,
  'lastActivity' : bigint,
  'rank' : bigint,
  'distributionsCount' : bigint,
  'neuronId' : Uint8Array | number[],
}
export type LeaderboardPriceType = { 'ICP' : null } |
  { 'USD' : null };
export type LeaderboardTimeframe = { 'AllTime' : null } |
  { 'OneWeek' : null } |
  { 'OneYear' : null } |
  { 'OneMonth' : null };
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
export interface NeuronAllocationChangeBlockData {
  'id' : bigint,
  'maker' : Principal,
  'oldAllocations' : Array<Allocation>,
  'changeType' : AllocationChangeType,
  'votingPower' : bigint,
  'newAllocations' : Array<Allocation>,
  'timestamp' : bigint,
  'neuronId' : Uint8Array | number[],
  'penaltyMultiplier' : [] | [bigint],
  'reason' : [] | [string],
}
export interface NeuronGraphDataExtended {
  'oneMonthICP' : [] | [number],
  'oneMonthUSD' : [] | [number],
  'votingPower' : bigint,
  'allocationChangeCount' : bigint,
  'oneWeekICP' : [] | [number],
  'oneWeekUSD' : [] | [number],
  'oneYearICP' : [] | [number],
  'oneYearUSD' : [] | [number],
  'checkpoints' : Array<GraphCheckpointData>,
  'neuronId' : Uint8Array | number[],
  'performanceScoreICP' : [] | [number],
  'performanceScoreUSD' : number,
}
export interface NeuronPerformanceDetail {
  'lastAllocationChange' : bigint,
  'votingPower' : bigint,
  'performance' : {
    'oneMonthICP' : [] | [number],
    'oneMonthUSD' : [] | [number],
    'oneWeekICP' : [] | [number],
    'oneWeekUSD' : [] | [number],
    'oneYearICP' : [] | [number],
    'oneYearUSD' : [] | [number],
    'allTimeICP' : [] | [number],
    'allTimeUSD' : [] | [number],
  },
  'distributionsParticipated' : bigint,
  'neuronId' : Uint8Array | number[],
}
export interface NeuronReward {
  'rewardAmount' : bigint,
  'performanceScore' : number,
  'votingPower' : bigint,
  'rewardScore' : number,
  'checkpoints' : Array<CheckpointData>,
  'neuronId' : Uint8Array | number[],
  'performanceScoreICP' : [] | [number],
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
export type Result__1_10 = { 'ok' : Array<string> } |
  { 'err' : RewardsError };
export type Result__1_11 = { 'ok' : PerformanceResult } |
  { 'err' : RewardsError };
export type Result__1_12 = { 'ok' : BackfillResult } |
  { 'err' : RewardsError };
export type Result__1_2 = { 'ok' : Array<WithdrawalRecord> } |
  { 'err' : RewardsError };
export type Result__1_3 = { 'ok' : UserPerformanceGraphData } |
  { 'err' : RewardsError };
export type Result__1_4 = { 'ok' : UserPerformanceResult } |
  { 'err' : RewardsError };
export type Result__1_5 = { 'ok' : Array<Uint8Array | number[]> } |
  { 'err' : RewardsError };
export type Result__1_6 = { 'ok' : [] | [bigint] } |
  { 'err' : RewardsError };
export type Result__1_7 = { 'ok' : Array<[Uint8Array | number[], bigint]> } |
  { 'err' : RewardsError };
export type Result__1_8 = { 'ok' : NeuronPerformanceDetail } |
  { 'err' : RewardsError };
export type Result__1_9 = {
    'ok' : { 'distributions' : Array<DistributionRecord> }
  } |
  { 'err' : RewardsError };
export interface Rewards {
  'addBannedWords' : ActorMethod<[Array<string>], Result__1>,
  'addToRewardSkipList' : ActorMethod<[Uint8Array | number[]], Result__1>,
  'adminDeleteDisplayName' : ActorMethod<[Principal], Result__1>,
  'admin_backfillDistributionHistory' : ActorMethod<
    [BackfillConfig],
    Result__1_12
  >,
  'admin_recalculateAllIcpPerformance' : ActorMethod<[], Result__1>,
  'admin_recalculateIcpPerformanceForDistribution' : ActorMethod<
    [bigint],
    Result__1
  >,
  'calculateNeuronPerformance' : ActorMethod<
    [Uint8Array | number[], bigint, bigint, PriceType],
    Result__1_11
  >,
  'calculateNeuronPerformanceQuery' : ActorMethod<
    [Uint8Array | number[], bigint, bigint, PriceType],
    Result__1_11
  >,
  /**
   * / * Clear all logs
   */
  'clearLogs' : ActorMethod<[], undefined>,
  'deleteMyDisplayName' : ActorMethod<[], Result__1>,
  'getAllNeuronRewardBalances' : ActorMethod<
    [],
    Array<[Uint8Array | number[], bigint]>
  >,
  'getAllWithdrawalHistory' : ActorMethod<[[] | [bigint]], Result__1_2>,
  'getAvailableBalance' : ActorMethod<[], bigint>,
  'getBackfillStatus' : ActorMethod<
    [],
    {
      'startedAt' : bigint,
      'dataStartTime' : bigint,
      'lastErrors' : Array<string>,
      'totalPeriods' : bigint,
      'currentPeriodStart' : bigint,
      'elapsedNS' : bigint,
      'periodsCompleted' : bigint,
      'dataEndTime' : bigint,
      'currentPeriodEnd' : bigint,
      'progressPercent' : bigint,
      'inProgress' : boolean,
    }
  >,
  'getBannedWords' : ActorMethod<[], Result__1_10>,
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
      'rewardPenaltiesCount' : bigint,
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
  'getDisplayName' : ActorMethod<[Principal], [] | [string]>,
  'getDisplayNames' : ActorMethod<
    [Array<Principal>],
    Array<[Principal, [] | [string]]>
  >,
  'getDistributionHistory' : ActorMethod<
    [bigint, bigint],
    {
      'total' : bigint,
      'hasMore' : boolean,
      'records' : Array<DistributionRecord>,
    }
  >,
  'getDistributionsSince' : ActorMethod<[bigint, bigint], Result__1_9>,
  'getLeaderboard' : ActorMethod<
    [LeaderboardTimeframe, LeaderboardPriceType, [] | [bigint], [] | [bigint]],
    Array<LeaderboardEntry>
  >,
  'getLeaderboardCutoffDate' : ActorMethod<[], bigint>,
  'getLeaderboardInfo' : ActorMethod<
    [],
    {
      'updateEnabled' : boolean,
      'lastUpdate' : bigint,
      'leaderboardCounts' : {
        'oneMonthICP' : bigint,
        'oneMonthUSD' : bigint,
        'oneWeekICP' : bigint,
        'oneWeekUSD' : bigint,
        'oneYearICP' : bigint,
        'oneYearUSD' : bigint,
        'allTimeICP' : bigint,
        'allTimeUSD' : bigint,
      },
      'totalDistributions' : bigint,
      'maxSize' : bigint,
    }
  >,
  'getLeaderboardTimerStatus' : ActorMethod<
    [],
    { 'active' : boolean, 'intervalHours' : bigint }
  >,
  /**
   * / * Get the last N log entries
   */
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  /**
   * / * Get the last N log entries for a specific context
   */
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  /**
   * / * Get the last N log entries for a specific level
   */
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  'getNeuronPerformance' : ActorMethod<[Uint8Array | number[]], Result__1_8>,
  'getNeuronRewardBalance' : ActorMethod<[Uint8Array | number[]], bigint>,
  'getNeuronRewardBalances' : ActorMethod<
    [Array<Uint8Array | number[]>],
    Array<[Uint8Array | number[], bigint]>
  >,
  'getRewardPenalties' : ActorMethod<[], Result__1_7>,
  'getRewardPenalty' : ActorMethod<[Uint8Array | number[]], Result__1_6>,
  'getRewardSkipList' : ActorMethod<[], Result__1_5>,
  'getTacoBalance' : ActorMethod<[], bigint>,
  'getTotalDistributed' : ActorMethod<[], bigint>,
  'getUserPerformance' : ActorMethod<[Principal], Result__1_4>,
  'getUserPerformanceGraphData' : ActorMethod<
    [Principal, bigint, bigint],
    Result__1_3
  >,
  'getUserWithdrawalHistory' : ActorMethod<[[] | [bigint]], Result__1_2>,
  'getWithdrawalStats' : ActorMethod<
    [],
    {
      'totalRecordsInHistory' : bigint,
      'totalWithdrawn' : bigint,
      'totalWithdrawals' : bigint,
    }
  >,
  'getWithdrawalsSince' : ActorMethod<[bigint, bigint], Result__1_1>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  'refreshLeaderboards' : ActorMethod<[], Result__1>,
  'removeBannedWords' : ActorMethod<[Array<string>], Result__1>,
  'removeFromRewardSkipList' : ActorMethod<[Uint8Array | number[]], Result__1>,
  'removeRewardPenalty' : ActorMethod<[Uint8Array | number[]], Result__1>,
  'setDisplayName' : ActorMethod<[string], Result__1>,
  'setDistributionEnabled' : ActorMethod<[boolean], Result__1>,
  'setDistributionPeriod' : ActorMethod<[bigint], Result__1>,
  'setLeaderboardCutoffDate' : ActorMethod<[bigint], Result__1>,
  'setMaxDistributionHistory' : ActorMethod<[bigint], Result__1>,
  'setPerformanceScorePower' : ActorMethod<[number], Result__1>,
  'setPeriodicRewardPot' : ActorMethod<[bigint], Result__1>,
  'setRewardPenalties' : ActorMethod<
    [Array<[Uint8Array | number[], bigint]>],
    Result__1
  >,
  'setRewardPenalty' : ActorMethod<[Uint8Array | number[], bigint], Result__1>,
  'setRewardSkipList' : ActorMethod<[Array<Uint8Array | number[]>], Result__1>,
  'setVotingPowerPower' : ActorMethod<[number], Result__1>,
  'startDistributionTimer' : ActorMethod<[], Result__1>,
  'startDistributionTimerAt' : ActorMethod<[bigint], Result__1>,
  'stopDistributionTimer' : ActorMethod<[], Result__1>,
  'stopLeaderboardTimer' : ActorMethod<[], Result__1>,
  'triggerDistribution' : ActorMethod<[], Result__1>,
  'triggerDistributionCustom' : ActorMethod<
    [bigint, bigint, PriceType],
    Result__1
  >,
  'updateLeaderboardConfig' : ActorMethod<
    [[] | [bigint], [] | [boolean]],
    Result__1
  >,
  'withdraw' : ActorMethod<[Account, Array<Uint8Array | number[]>], Result>,
}
export type RewardsError = { 'AllocationDataMissing' : null } |
  { 'InvalidDisplayName' : string } |
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
export interface UserPerformanceGraphData {
  'timeframe' : { 'startTime' : bigint, 'endTime' : bigint },
  'aggregatedPerformanceICP' : [] | [number],
  'aggregatedPerformanceUSD' : number,
  'allocationNeuronId' : [] | [Uint8Array | number[]],
  'neurons' : Array<NeuronGraphDataExtended>,
}
export interface UserPerformanceResult {
  'principal' : Principal,
  'lastActivity' : bigint,
  'totalVotingPower' : bigint,
  'aggregatedPerformance' : {
    'oneMonthICP' : [] | [number],
    'oneMonthUSD' : [] | [number],
    'oneWeekICP' : [] | [number],
    'oneWeekUSD' : [] | [number],
    'oneYearICP' : [] | [number],
    'oneYearUSD' : [] | [number],
    'allTimeICP' : [] | [number],
    'allTimeUSD' : [] | [number],
  },
  'distributionsParticipated' : bigint,
  'neurons' : Array<NeuronPerformanceDetail>,
}
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
