export const idlFactory = ({ IDL }) => {
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
  const Result__1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : RewardsError });
  const BackfillConfig = IDL.Record({
    'periodDays' : IDL.Nat,
    'startTime' : IDL.Int,
    'skipExistingPeriods' : IDL.Bool,
    'clearExisting' : IDL.Bool,
    'maxPeriods' : IDL.Nat,
  });
  const BackfillResult = IDL.Record({
    'startTime' : IDL.Int,
    'neuronsProcessed' : IDL.Nat,
    'periodsCreated' : IDL.Nat,
    'totalNeuronRewards' : IDL.Nat,
    'endTime' : IDL.Int,
    'errors' : IDL.Vec(IDL.Text),
  });
  const Result__1_11 = IDL.Variant({
    'ok' : BackfillResult,
    'err' : RewardsError,
  });
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
    'penaltyMultiplier' : IDL.Opt(IDL.Nat),
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
  const Result__1_10 = IDL.Variant({
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
    'performanceScoreICP' : IDL.Opt(IDL.Float64),
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
  const Result__1_9 = IDL.Variant({
    'ok' : IDL.Record({ 'distributions' : IDL.Vec(DistributionRecord) }),
    'err' : RewardsError,
  });
  const LeaderboardTimeframe = IDL.Variant({
    'AllTime' : IDL.Null,
    'OneWeek' : IDL.Null,
    'OneYear' : IDL.Null,
    'OneMonth' : IDL.Null,
  });
  const LeaderboardPriceType = IDL.Variant({
    'ICP' : IDL.Null,
    'USD' : IDL.Null,
  });
  const LeaderboardEntry = IDL.Record({
    'principal' : IDL.Principal,
    'performanceScore' : IDL.Float64,
    'lastActivity' : IDL.Int,
    'rank' : IDL.Nat,
    'distributionsCount' : IDL.Nat,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const LogLevel = IDL.Variant({
    'INFO' : IDL.Null,
    'WARN' : IDL.Null,
    'ERROR' : IDL.Null,
  });
  const LogEntry = IDL.Record({
    'component' : IDL.Text,
    'context' : IDL.Text,
    'level' : LogLevel,
    'message' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const NeuronPerformanceDetail = IDL.Record({
    'lastAllocationChange' : IDL.Int,
    'votingPower' : IDL.Nat,
    'performance' : IDL.Record({
      'oneMonthICP' : IDL.Opt(IDL.Float64),
      'oneMonthUSD' : IDL.Opt(IDL.Float64),
      'oneWeekICP' : IDL.Opt(IDL.Float64),
      'oneWeekUSD' : IDL.Opt(IDL.Float64),
      'oneYearICP' : IDL.Opt(IDL.Float64),
      'oneYearUSD' : IDL.Opt(IDL.Float64),
      'allTimeICP' : IDL.Opt(IDL.Float64),
      'allTimeUSD' : IDL.Opt(IDL.Float64),
    }),
    'distributionsParticipated' : IDL.Nat,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const Result__1_8 = IDL.Variant({
    'ok' : NeuronPerformanceDetail,
    'err' : RewardsError,
  });
  const Result__1_7 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat)),
    'err' : RewardsError,
  });
  const Result__1_6 = IDL.Variant({
    'ok' : IDL.Opt(IDL.Nat),
    'err' : RewardsError,
  });
  const Result__1_5 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'err' : RewardsError,
  });
  const UserPerformanceResult = IDL.Record({
    'principal' : IDL.Principal,
    'lastActivity' : IDL.Int,
    'totalVotingPower' : IDL.Nat,
    'aggregatedPerformance' : IDL.Record({
      'oneMonthICP' : IDL.Opt(IDL.Float64),
      'oneMonthUSD' : IDL.Opt(IDL.Float64),
      'oneWeekICP' : IDL.Opt(IDL.Float64),
      'oneWeekUSD' : IDL.Opt(IDL.Float64),
      'oneYearICP' : IDL.Opt(IDL.Float64),
      'oneYearUSD' : IDL.Opt(IDL.Float64),
      'allTimeICP' : IDL.Opt(IDL.Float64),
      'allTimeUSD' : IDL.Opt(IDL.Float64),
    }),
    'distributionsParticipated' : IDL.Nat,
    'neurons' : IDL.Vec(NeuronPerformanceDetail),
  });
  const Result__1_4 = IDL.Variant({
    'ok' : UserPerformanceResult,
    'err' : RewardsError,
  });
  const UserPerformanceGraphData = IDL.Record({
    'timeframe' : IDL.Record({ 'startTime' : IDL.Int, 'endTime' : IDL.Int }),
    'neuronData' : IDL.Vec(
      IDL.Record({
        'checkpoints' : IDL.Vec(CheckpointData),
        'neuronId' : IDL.Vec(IDL.Nat8),
        'performanceScoreICP' : IDL.Opt(IDL.Float64),
        'performanceScoreUSD' : IDL.Float64,
      })
    ),
    'aggregatedPerformanceICP' : IDL.Opt(IDL.Float64),
    'aggregatedPerformanceUSD' : IDL.Float64,
  });
  const Result__1_3 = IDL.Variant({
    'ok' : UserPerformanceGraphData,
    'err' : RewardsError,
  });
  const Result__1_1 = IDL.Variant({
    'ok' : IDL.Record({ 'withdrawals' : IDL.Vec(WithdrawalRecord) }),
    'err' : RewardsError,
  });
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
    'addToRewardSkipList' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result__1], []),
    'admin_backfillDistributionHistory' : IDL.Func(
        [BackfillConfig],
        [Result__1_11],
        [],
      ),
    'admin_recalculateAllIcpPerformance' : IDL.Func([], [Result__1], []),
    'admin_recalculateIcpPerformanceForDistribution' : IDL.Func(
        [IDL.Nat],
        [Result__1],
        [],
      ),
    'calculateNeuronPerformance' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, PriceType],
        [Result__1_10],
        [],
      ),
    'calculateNeuronPerformanceQuery' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, PriceType],
        [Result__1_10],
        ['composite_query'],
      ),
    'clearLogs' : IDL.Func([], [], []),
    'getAllNeuronRewardBalances' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat))],
        ['query'],
      ),
    'getAllWithdrawalHistory' : IDL.Func([IDL.Opt(IDL.Nat)], [Result__1_2], []),
    'getAvailableBalance' : IDL.Func([], [IDL.Nat], []),
    'getBackfillStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'startedAt' : IDL.Int,
            'dataStartTime' : IDL.Int,
            'lastErrors' : IDL.Vec(IDL.Text),
            'totalPeriods' : IDL.Nat,
            'currentPeriodStart' : IDL.Int,
            'elapsedNS' : IDL.Int,
            'periodsCompleted' : IDL.Nat,
            'dataEndTime' : IDL.Int,
            'currentPeriodEnd' : IDL.Int,
            'progressPercent' : IDL.Nat,
            'inProgress' : IDL.Bool,
          }),
        ],
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
            'rewardSkipListSize' : IDL.Nat,
            'maxDistributionHistory' : IDL.Nat,
            'periodicRewardPot' : IDL.Nat,
            'rewardPenaltiesCount' : IDL.Nat,
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
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'hasMore' : IDL.Bool,
            'records' : IDL.Vec(DistributionRecord),
          }),
        ],
        ['query'],
      ),
    'getDistributionsSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result__1_9],
        ['query'],
      ),
    'getLeaderboard' : IDL.Func(
        [
          LeaderboardTimeframe,
          LeaderboardPriceType,
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
        ],
        [IDL.Vec(LeaderboardEntry)],
        ['query'],
      ),
    'getLeaderboardInfo' : IDL.Func(
        [],
        [
          IDL.Record({
            'updateEnabled' : IDL.Bool,
            'lastUpdate' : IDL.Int,
            'leaderboardCounts' : IDL.Record({
              'oneMonthICP' : IDL.Nat,
              'oneMonthUSD' : IDL.Nat,
              'oneWeekICP' : IDL.Nat,
              'oneWeekUSD' : IDL.Nat,
              'oneYearICP' : IDL.Nat,
              'oneYearUSD' : IDL.Nat,
              'allTimeICP' : IDL.Nat,
              'allTimeUSD' : IDL.Nat,
            }),
            'totalDistributions' : IDL.Nat,
            'maxSize' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getLogsByContext' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Vec(LogEntry)],
        ['query'],
      ),
    'getLogsByLevel' : IDL.Func(
        [LogLevel, IDL.Nat],
        [IDL.Vec(LogEntry)],
        ['query'],
      ),
    'getNeuronPerformance' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [Result__1_8],
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
    'getRewardPenalties' : IDL.Func([], [Result__1_7], ['query']),
    'getRewardPenalty' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [Result__1_6],
        ['query'],
      ),
    'getRewardSkipList' : IDL.Func([], [Result__1_5], ['query']),
    'getTacoBalance' : IDL.Func([], [IDL.Nat], []),
    'getTotalDistributed' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserPerformance' : IDL.Func(
        [IDL.Principal],
        [Result__1_4],
        ['composite_query'],
      ),
    'getUserPerformanceGraphData' : IDL.Func(
        [IDL.Principal, IDL.Int, IDL.Int],
        [Result__1_3],
        ['composite_query'],
      ),
    'getUserWithdrawalHistory' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [Result__1_2],
        [],
      ),
    'getWithdrawalStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalRecordsInHistory' : IDL.Nat,
            'totalWithdrawn' : IDL.Nat,
            'totalWithdrawals' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getWithdrawalsSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result__1_1],
        ['query'],
      ),
    'get_canister_cycles' : IDL.Func(
        [],
        [IDL.Record({ 'cycles' : IDL.Nat })],
        ['query'],
      ),
    'refreshLeaderboards' : IDL.Func([], [Result__1], []),
    'removeFromRewardSkipList' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result__1], []),
    'removeRewardPenalty' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result__1], []),
    'setDistributionEnabled' : IDL.Func([IDL.Bool], [Result__1], []),
    'setDistributionPeriod' : IDL.Func([IDL.Nat], [Result__1], []),
    'setMaxDistributionHistory' : IDL.Func([IDL.Nat], [Result__1], []),
    'setPerformanceScorePower' : IDL.Func([IDL.Float64], [Result__1], []),
    'setPeriodicRewardPot' : IDL.Func([IDL.Nat], [Result__1], []),
    'setRewardPenalties' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat))],
        [Result__1],
        [],
      ),
    'setRewardPenalty' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Nat],
        [Result__1],
        [],
      ),
    'setRewardSkipList' : IDL.Func(
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        [Result__1],
        [],
      ),
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
    'updateLeaderboardConfig' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Bool)],
        [Result__1],
        [],
      ),
    'withdraw' : IDL.Func([Account, IDL.Vec(IDL.Vec(IDL.Nat8))], [Result], []),
  });
  return Rewards;
};
export const init = ({ IDL }) => { return []; };
