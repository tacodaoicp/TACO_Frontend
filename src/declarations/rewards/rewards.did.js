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
    'PriceDataMissing' : IDL.Record({
      'token' : IDL.Principal,
      'timestamp' : IDL.Int,
    }),
    'NeuronNotFound' : IDL.Null,
    'InvalidTimeRange' : IDL.Null,
  });
  const Result = IDL.Variant({
    'ok' : PerformanceResult,
    'err' : RewardsError,
  });
  const Rewards = IDL.Service({
    'calculateNeuronPerformance' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, PriceType],
        [Result],
        [],
      ),
    'getCanisterStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'priceArchiveId' : IDL.Principal,
            'environment' : IDL.Text,
            'neuronAllocationArchiveId' : IDL.Principal,
          }),
        ],
        [],
      ),
  });
  return Rewards;
};
export const init = ({ IDL }) => { return []; };
