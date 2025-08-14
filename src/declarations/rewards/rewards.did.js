export const idlFactory = ({ IDL }) => {
  const PriceType = IDL.Variant({ 'ICP' : IDL.Null, 'USD' : IDL.Null });
  const Allocation = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const AllocationChangeType = IDL.Variant({
    'FollowAction' : IDL.Record({ 'followedUser' : IDL.Principal }),
    'UserUpdate' : IDL.Record({ 'userInitiated' : IDL.Bool }),
    'SystemRebalance' : IDL.Null,
    'VotingPowerChange' : IDL.Null,
  });
  const NeuronAllocationChangeBlockData = IDL.Record({
    'id' : IDL.Nat,
    'maker' : IDL.Principal,
    'oldAllocations' : IDL.Vec(Allocation),
    'changeType' : AllocationChangeType,
    'votingPower' : IDL.Nat,
    'newAllocations' : IDL.Vec(Allocation),
    'timestamp' : IDL.Int,
    'neuronId' : IDL.Vec(IDL.Nat8),
    'reason' : IDL.Opt(IDL.Text),
  });
  const PriceInfo = IDL.Record({
    'usdPrice' : IDL.Float64,
    'timestamp' : IDL.Int,
    'icpPrice' : IDL.Nat,
  });
  const CheckpointData = IDL.Record({
    'totalPortfolioValue' : IDL.Float64,
    'pricesUsed' : IDL.Vec(IDL.Tuple(IDL.Principal, PriceInfo)),
    'timestamp' : IDL.Int,
    'allocations' : IDL.Vec(Allocation),
    'tokenValues' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Float64)),
  });
  const PerformanceResult = IDL.Record({
    'startTime' : IDL.Int,
    'endTime' : IDL.Int,
    'performanceScore' : IDL.Float64,
    'finalValue' : IDL.Float64,
    'preTimespanAllocation' : IDL.Opt(NeuronAllocationChangeBlockData),
    'checkpoints' : IDL.Vec(CheckpointData),
    'neuronId' : IDL.Vec(IDL.Nat8),
    'allocationChanges' : IDL.Nat,
    'inTimespanChanges' : IDL.Vec(NeuronAllocationChangeBlockData),
    'initialValue' : IDL.Float64,
  });
  const RewardsError = IDL.Variant({
    'AllocationDataMissing' : IDL.Null,
    'SystemError' : IDL.Text,
    'NotAuthorized' : IDL.Null,
    'DistributionInProgress' : IDL.Null,
    'PriceDataMissing' : IDL.Record({
      'token' : IDL.Principal,
      'timestamp' : IDL.Int,
    }),
    'NeuronNotFound' : IDL.Null,
    'InvalidTimeRange' : IDL.Null,
    'InsufficientRewardPot' : IDL.Null,
  });
  const Result_1 = IDL.Variant({
    'ok' : PerformanceResult,
    'err' : RewardsError,
  });
  const DistributionStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'PartiallyCompleted' : IDL.Record({
      'successfulNeurons' : IDL.Nat,
      'failedNeurons' : IDL.Nat,
    }),
    'InProgress' : IDL.Record({
      'currentNeuron' : IDL.Nat,
      'totalNeurons' : IDL.Nat,
    }),
    'Completed' : IDL.Null,
  });
  const NeuronReward = IDL.Record({
    'rewardAmount' : IDL.Float64,
    'performanceScore' : IDL.Float64,
    'votingPower' : IDL.Nat,
    'rewardScore' : IDL.Float64,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const FailedNeuron = IDL.Record({
    'errorMessage' : IDL.Text,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const DistributionRecord = IDL.Record({
    'id' : IDL.Nat,
    'startTime' : IDL.Int,
    'status' : DistributionStatus,
    'distributionTime' : IDL.Int,
    'neuronsProcessed' : IDL.Nat,
    'endTime' : IDL.Int,
    'totalRewardPot' : IDL.Float64,
    'totalRewardScore' : IDL.Float64,
    'neuronRewards' : IDL.Vec(NeuronReward),
    'failedNeurons' : IDL.Vec(FailedNeuron),
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : RewardsError });
  const Rewards = IDL.Service({
    'calculateNeuronPerformance' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, PriceType],
        [Result_1],
        [],
      ),
    'getAllNeuronRewardBalances' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Float64))],
        ['query'],
      ),
    'getCanisterStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'priceArchiveId' : IDL.Principal,
            'environment' : IDL.Text,
            'distributionStatus' : IDL.Record({
              'lastDistribution' : IDL.Int,
              'totalRewardsDistributed' : IDL.Float64,
              'totalDistributions' : IDL.Nat,
              'inProgress' : IDL.Bool,
              'nextDistribution' : IDL.Int,
            }),
            'daoId' : IDL.Principal,
            'neuronAllocationArchiveId' : IDL.Principal,
          }),
        ],
        [],
      ),
    'getConfiguration' : IDL.Func(
        [],
        [
          IDL.Record({
            'distributionEnabled' : IDL.Bool,
            'distributionPeriodNS' : IDL.Nat,
            'maxDistributionHistory' : IDL.Nat,
            'weeklyRewardPot' : IDL.Float64,
          }),
        ],
        ['query'],
      ),
    'getCurrentDistributionStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'nextDistributionTime' : IDL.Int,
            'distributionEnabled' : IDL.Bool,
            'currentDistributionId' : IDL.Opt(IDL.Nat),
            'lastDistributionTime' : IDL.Int,
            'inProgress' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getDistributionHistory' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [IDL.Vec(DistributionRecord)],
        ['query'],
      ),
    'getNeuronRewardBalance' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Float64],
        ['query'],
      ),
    'setDistributionEnabled' : IDL.Func([IDL.Bool], [Result], []),
    'setDistributionPeriod' : IDL.Func([IDL.Nat], [Result], []),
    'setWeeklyRewardPot' : IDL.Func([IDL.Float64], [Result], []),
    'startDistributionTimer' : IDL.Func([], [Result], []),
    'stopDistributionTimer' : IDL.Func([], [Result], []),
    'triggerDistribution' : IDL.Func([], [Result], []),
    'triggerDistributionCustom' : IDL.Func(
        [IDL.Int, IDL.Int, PriceType],
        [Result],
        [],
      ),
  });
  return Rewards;
};
export const init = ({ IDL }) => { return []; };
