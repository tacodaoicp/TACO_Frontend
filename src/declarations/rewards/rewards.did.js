export const idlFactory = ({ IDL }) => {
  const PriceType = IDL.Variant({ 'ICP' : IDL.Null, 'USD' : IDL.Null });
  const PerformanceResult = IDL.Record({
    'startTime' : IDL.Int,
    'endTime' : IDL.Int,
    'user' : IDL.Principal,
    'finalValue' : IDL.Float64,
    'allocationChanges' : IDL.Nat,
    'initialValue' : IDL.Float64,
  });
  const RewardsError = IDL.Variant({
    'AllocationDataMissing' : IDL.Null,
    'SystemError' : IDL.Text,
    'PriceDataMissing' : IDL.Record({
      'token' : IDL.Principal,
      'timestamp' : IDL.Int,
    }),
    'InvalidTimeRange' : IDL.Null,
    'UserNotFound' : IDL.Null,
  });
  const Result = IDL.Variant({
    'ok' : PerformanceResult,
    'err' : RewardsError,
  });
  const Rewards = IDL.Service({
    'calculateUserPerformance' : IDL.Func(
        [IDL.Principal, IDL.Int, IDL.Int, PriceType],
        [Result],
        ['query'],
      ),
    'getCanisterStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'allocationArchiveId' : IDL.Principal,
            'priceArchiveId' : IDL.Principal,
            'environment' : IDL.Text,
          }),
        ],
        [],
      ),
  });
  return Rewards;
};
export const init = ({ IDL }) => { return []; };
