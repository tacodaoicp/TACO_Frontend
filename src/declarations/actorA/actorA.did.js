export const idlFactory = ({ IDL }) => {
  const FollowError = IDL.Variant({
    'FollowLimitReached' : IDL.Null,
    'FollowerNoAllocationYetMade' : IDL.Null,
    'NotAllowed' : IDL.Null,
    'AlreadyFollowing' : IDL.Null,
    'FollowerNotFound' : IDL.Null,
    'FollowUnfollowLimitReached' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'FolloweeNotFound' : IDL.Null,
    'FolloweeIsSelf' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'FolloweeLimitReached' : IDL.Null,
    'FolloweeNoAllocationYetMade' : IDL.Null,
    'SystemInactive' : IDL.Null,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : FollowError });
  const Allocation = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const NeuronVP = IDL.Record({
    'votingPower' : IDL.Nat,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const UserState = IDL.Record({
    'lastVotingPowerUpdate' : IDL.Int,
    'votingPower' : IDL.Nat,
    'allocationFollows' : IDL.Vec(
      IDL.Record({ 'since' : IDL.Int, 'follow' : IDL.Principal })
    ),
    'lastAllocationMaker' : IDL.Principal,
    'allocationFollowedBy' : IDL.Vec(
      IDL.Record({ 'since' : IDL.Int, 'follow' : IDL.Principal })
    ),
    'followUnfollowActions' : IDL.Vec(IDL.Int),
    'pastAllocations' : IDL.Vec(
      IDL.Record({
        'to' : IDL.Int,
        'from' : IDL.Int,
        'allocation' : IDL.Vec(Allocation),
        'allocationMaker' : IDL.Principal,
      })
    ),
    'allocations' : IDL.Vec(Allocation),
    'lastAllocationUpdate' : IDL.Int,
    'neurons' : IDL.Vec(NeuronVP),
  });
  const SwapError = IDL.Variant({
    'InvalidBlock' : IDL.Null,
    'InvalidAmount' : IDL.Null,
    'TransferError' : IDL.Null,
    'InvalidPrice' : IDL.Null,
    'BlockAlreadyProcessed' : IDL.Null,
    'InsufficientBalance' : IDL.Null,
    'SwapAlreadyRunning' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'TokenNotTrusted' : IDL.Null,
  });
  const SwapResult = IDL.Record({
    'returnedSentAmount' : IDL.Nat,
    'blockNumber' : IDL.Nat,
    'wantedTokenAddress' : IDL.Text,
    'error' : IDL.Opt(SwapError),
    'sentTokenAddress' : IDL.Text,
    'usedSentAmount' : IDL.Nat,
    'success' : IDL.Bool,
    'returnedWantedAmount' : IDL.Nat,
    'swappedAmount' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({ 'ok' : SwapResult, 'err' : IDL.Text });
  const UnfollowError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'FollowerNotFound' : IDL.Null,
    'FollowUnfollowLimitReached' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'FolloweeNotFound' : IDL.Null,
    'FolloweeIsSelf' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'AlreadyUnfollowing' : IDL.Null,
    'SystemInactive' : IDL.Null,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : UnfollowError });
  const UpdateError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'InvalidAllocation' : IDL.Null,
    'NoVotingPower' : IDL.Null,
    'SystemInactive' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : UpdateError });
  return IDL.Service({
    'TransferICPtoMintVault' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'TransferICRCAtoMintVault' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'TransferICRCBtoMintVault' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'followAllocation' : IDL.Func([IDL.Principal], [Result_3], []),
    'getUserAllocation' : IDL.Func([], [IDL.Opt(UserState)], []),
    'swapTokenForTaco' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Nat],
        [Result_2],
        [],
      ),
    'unfollowAllocation' : IDL.Func([IDL.Principal], [Result_1], []),
    'updateAllocation' : IDL.Func([IDL.Vec(Allocation)], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
