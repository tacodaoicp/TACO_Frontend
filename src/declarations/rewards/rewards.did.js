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
    'maker' : IDL.Opt(IDL.Principal),
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
  const Result__1_3 = IDL.Variant({
    'ok' : PerformanceResult,
    'err' : RewardsError,
  });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const WithdrawalRecord = IDL.Record({
    'id' : IDL.Nat,
    'fee' : IDL.Nat,
    'amountSent' : IDL.Nat,
    'neuronWithdrawals' : IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat)),
    'totalAmount' : IDL.Nat,
    'timestamp' : IDL.Int,
    'caller' : IDL.Principal,
    'targetAccount' : Account,
    'transactionId' : IDL.Opt(IDL.Nat),
  });
  const Result__1_2 = IDL.Variant({
    'ok' : IDL.Vec(WithdrawalRecord),
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
    'rewardAmount' : IDL.Nat,
    'performanceScore' : IDL.Float64,
    'votingPower' : IDL.Nat,
    'rewardScore' : IDL.Float64,
    'checkpoints' : IDL.Vec(CheckpointData),
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
    'actualDistributed' : IDL.Nat,
    'totalRewardPot' : IDL.Nat,
    'totalRewardScore' : IDL.Float64,
    'neuronRewards' : IDL.Vec(NeuronReward),
    'failedNeurons' : IDL.Vec(FailedNeuron),
  });
  const Result__1_1 = IDL.Variant({
    'ok' : IDL.Record({
      'totalRecordsInHistory' : IDL.Nat,
      'totalWithdrawn' : IDL.Nat,
      'totalWithdrawals' : IDL.Nat,
    }),
    'err' : RewardsError,
  });
  const Result__1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : RewardsError });
  const TransferError = IDL.Variant({
    'GenericError' : IDL.Record({
      'message' : IDL.Text,
      'error_code' : IDL.Nat,
    }),
    'TemporarilyUnavailable' : IDL.Null,
    'BadBurn' : IDL.Record({ 'min_burn_amount' : IDL.Nat }),
    'Duplicate' : IDL.Record({ 'duplicate_of' : IDL.Nat }),
    'BadFee' : IDL.Record({ 'expected_fee' : IDL.Nat }),
    'CreatedInFuture' : IDL.Record({ 'ledger_time' : IDL.Nat64 }),
    'TooOld' : IDL.Null,
    'InsufficientFunds' : IDL.Record({ 'balance' : IDL.Nat }),
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : TransferError });
  const Rewards = IDL.Service({
    'calculateNeuronPerformance' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, PriceType],
        [Result__1_3],
        [],
      ),
    'getAllNeuronRewardBalances' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat))],
        ['query'],
      ),
    'getAllWithdrawalHistory' : IDL.Func([IDL.Opt(IDL.Nat)], [Result__1_2], []),
    'getAvailableBalance' : IDL.Func([], [IDL.Nat], []),
    'getCanisterStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'priceArchiveId' : IDL.Principal,
            'environment' : IDL.Text,
            'distributionStatus' : IDL.Record({
              'lastDistribution' : IDL.Int,
              'totalRewardsDistributed' : IDL.Nat,
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
            'periodicRewardPot' : IDL.Nat,
            'performanceScorePower' : IDL.Float64,
            'totalDistributions' : IDL.Nat,
            'nextScheduledDistribution' : IDL.Opt(IDL.Int),
            'votingPowerPower' : IDL.Float64,
            'lastDistributionTime' : IDL.Int,
            'timerRunning' : IDL.Bool,
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
    'getCurrentTotalNeuronBalances' : IDL.Func([], [IDL.Nat], ['query']),
    'getDistributionHistory' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [IDL.Vec(DistributionRecord)],
        ['query'],
      ),
    'getNeuronRewardBalance' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Nat],
        ['query'],
      ),
    'getNeuronRewardBalances' : IDL.Func(
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat))],
        ['query'],
      ),
    'getTacoBalance' : IDL.Func([], [IDL.Nat], []),
    'getTotalDistributed' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserWithdrawalHistory' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [Result__1_2],
        [],
      ),
    'getWithdrawalStats' : IDL.Func([], [Result__1_1], []),
    'setDistributionEnabled' : IDL.Func([IDL.Bool], [Result__1], []),
    'setDistributionPeriod' : IDL.Func([IDL.Nat], [Result__1], []),
    'setPerformanceScorePower' : IDL.Func([IDL.Float64], [Result__1], []),
    'setPeriodicRewardPot' : IDL.Func([IDL.Nat], [Result__1], []),
    'setVotingPowerPower' : IDL.Func([IDL.Float64], [Result__1], []),
    'startDistributionTimer' : IDL.Func([], [Result__1], []),
    'startDistributionTimerAt' : IDL.Func([IDL.Int], [Result__1], []),
    'stopDistributionTimer' : IDL.Func([], [Result__1], []),
    'triggerDistribution' : IDL.Func([], [Result__1], []),
    'triggerDistributionCustom' : IDL.Func(
        [IDL.Int, IDL.Int, PriceType],
        [Result__1],
        [],
      ),
    'withdraw' : IDL.Func([Account, IDL.Vec(IDL.Vec(IDL.Nat8))], [Result], []),
  });
  return Rewards;
};
export const init = ({ IDL }) => { return []; };
