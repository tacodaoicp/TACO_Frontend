export const idlFactory = ({ IDL }) => {
  const AuthorizationError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : AuthorizationError });
  const TokenType__1 = IDL.Variant({
    'ICP' : IDL.Null,
    'ICRC3' : IDL.Null,
    'ICRC12' : IDL.Null,
  });
  const Allocation__1 = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const NeuronAllocation = IDL.Record({
    'votingPower' : IDL.Nat,
    'lastUpdate' : IDL.Int,
    'lastAllocationMaker' : IDL.Principal,
    'allocations' : IDL.Vec(Allocation__1),
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
        'allocation' : IDL.Vec(Allocation__1),
        'allocationMaker' : IDL.Principal,
      })
    ),
    'allocations' : IDL.Vec(Allocation__1),
    'lastAllocationUpdate' : IDL.Int,
    'neurons' : IDL.Vec(NeuronVP),
  });
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
  const Result_5 = IDL.Variant({ 'ok' : IDL.Text, 'err' : FollowError });
  const AdminFunction = IDL.Variant({
    'removeToken' : IDL.Null,
    'setTest' : IDL.Null,
    'startRebalancing' : IDL.Null,
    'getLogs' : IDL.Null,
    'removeAdmin' : IDL.Null,
    'stopToken' : IDL.Null,
    'unpauseToken' : IDL.Null,
    'updateSystemParameter' : IDL.Null,
    'updateTreasuryConfig' : IDL.Null,
    'updateSpamParameters' : IDL.Null,
    'addToken' : IDL.Null,
    'addAdmin' : IDL.Null,
    'stopRebalancing' : IDL.Null,
    'recoverPoolBalances' : IDL.Null,
    'setTacoAddress' : IDL.Null,
    'clearLogs' : IDL.Null,
    'createAuction' : IDL.Null,
    'updateMintingVaultConfig' : IDL.Null,
    'pauseToken' : IDL.Null,
    'updateSystemState' : IDL.Null,
    'endAuctionPanic' : IDL.Null,
  });
  const AdminPermission = IDL.Record({
    'function' : AdminFunction,
    'expiresAt' : IDL.Int,
    'grantedBy' : IDL.Principal,
  });
  const HistoricBalanceAllocation = IDL.Record({
    'allocations' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
    'totalWorthInICP' : IDL.Nat,
    'totalWorthInUSD' : IDL.Float64,
    'balances' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
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
  const SystemParameter = IDL.Variant({
    'MaxFollowers' : IDL.Nat,
    'MaxAllocationsPerDay' : IDL.Int,
    'MaxTotalUpdates' : IDL.Nat,
    'MaxPastAllocations' : IDL.Nat,
    'SnapshotInterval' : IDL.Nat,
    'FollowDepth' : IDL.Nat,
    'MaxFollowed' : IDL.Nat,
    'LogAdmin' : IDL.Principal,
    'AllocationWindow' : IDL.Nat,
    'MaxFollowUnfollowActionsPerDay' : IDL.Nat,
  });
  const PricePoint = IDL.Record({
    'usdPrice' : IDL.Float64,
    'time' : IDL.Int,
    'icpPrice' : IDL.Nat,
  });
  const TokenType = IDL.Variant({
    'ICP' : IDL.Null,
    'ICRC3' : IDL.Null,
    'ICRC12' : IDL.Null,
  });
  const TokenDetails = IDL.Record({
    'lastTimeSynced' : IDL.Int,
    'balance' : IDL.Nat,
    'isPaused' : IDL.Bool,
    'Active' : IDL.Bool,
    'epochAdded' : IDL.Int,
    'priceInICP' : IDL.Nat,
    'priceInUSD' : IDL.Float64,
    'tokenTransferFee' : IDL.Nat,
    'tokenDecimals' : IDL.Nat,
    'pastPrices' : IDL.Vec(PricePoint),
    'tokenSymbol' : IDL.Text,
    'tokenName' : IDL.Text,
    'pausedDueToSyncFailure' : IDL.Bool,
    'tokenType' : TokenType,
  });
  const RefreshError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'NoNeuronsFound' : IDL.Null,
    'SnsGovernanceError' : IDL.Text,
    'UnexpectedError' : IDL.Text,
    'SystemInactive' : IDL.Null,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Record({
      'aggregateUpdated' : IDL.Bool,
      'oldVotingPower' : IDL.Nat,
      'neuronsUpdated' : IDL.Nat,
      'newVotingPower' : IDL.Nat,
    }),
    'err' : RefreshError,
  });
  const SyncError = IDL.Variant({
    'NotTreasury' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Text, 'err' : SyncError });
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
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : UnfollowError });
  const Allocation = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const UpdateError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'InvalidAllocation' : IDL.Null,
    'NoVotingPower' : IDL.Null,
    'SystemInactive' : IDL.Null,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : UpdateError });
  const UpdateConfig__1 = IDL.Record({
    'balanceUpdateInterval' : IDL.Opt(IDL.Int),
    'maxSlippageBasisPoints' : IDL.Opt(IDL.Nat),
    'blockCleanupInterval' : IDL.Opt(IDL.Int),
    'minSwapValueUSD' : IDL.Opt(IDL.Float64),
    'PRICE_HISTORY_WINDOW' : IDL.Opt(IDL.Int),
    'maxPremium' : IDL.Opt(IDL.Float64),
    'swappingEnabled' : IDL.Opt(IDL.Bool),
    'minPremium' : IDL.Opt(IDL.Float64),
  });
  const SystemState = IDL.Variant({
    'Paused' : IDL.Null,
    'Active' : IDL.Null,
    'Emergency' : IDL.Null,
  });
  const UpdateConfig = IDL.Record({
    'maxPriceHistoryEntries' : IDL.Opt(IDL.Nat),
    'priceUpdateIntervalNS' : IDL.Opt(IDL.Nat),
    'tokenSyncTimeoutNS' : IDL.Opt(IDL.Nat),
    'maxSlippageBasisPoints' : IDL.Opt(IDL.Nat),
    'shortSyncIntervalNS' : IDL.Opt(IDL.Nat),
    'rebalanceIntervalNS' : IDL.Opt(IDL.Nat),
    'maxTradesStored' : IDL.Opt(IDL.Nat),
    'maxTradeValueICP' : IDL.Opt(IDL.Nat),
    'minTradeValueICP' : IDL.Opt(IDL.Nat),
    'portfolioRebalancePeriodNS' : IDL.Opt(IDL.Nat),
    'longSyncIntervalNS' : IDL.Opt(IDL.Nat),
    'maxTradeAttemptsPerInterval' : IDL.Opt(IDL.Nat),
    'maxKongswapAttempts' : IDL.Opt(IDL.Nat),
  });
  const Result = IDL.Variant({
    'ok' : IDL.Record({
      'principalCount' : IDL.Nat,
      'totalVotingPower' : IDL.Nat,
      'allocatedVotingPower' : IDL.Nat,
      'totalVotingPowerByHotkeySetters' : IDL.Nat,
      'neuronCount' : IDL.Nat,
    }),
    'err' : AuthorizationError,
  });
  const ContinuousDAO = IDL.Service({
    'addAdmin' : IDL.Func([IDL.Principal], [Result_1], []),
    'addToken' : IDL.Func([IDL.Principal, TokenType__1], [Result_1], []),
    'admin_getNeuronAllocations' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), NeuronAllocation))],
        ['query'],
      ),
    'admin_getUserAllocation' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserState)],
        ['query'],
      ),
    'admin_getUserAllocations' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, UserState))],
        ['query'],
      ),
    'admin_recalculateAllVotingPower' : IDL.Func([IDL.Nat], [], []),
    'clearLogs' : IDL.Func([], [], []),
    'followAllocation' : IDL.Func([IDL.Principal], [Result_5], []),
    'getAdminPermissions' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(AdminPermission)))],
        ['query'],
      ),
    'getAggregateAllocation' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
        ['query'],
      ),
    'getFollowersWithNeuronCounts' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
        ['query'],
      ),
    'getHistoricBalanceAndAllocation' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(IDL.Tuple(IDL.Int, HistoricBalanceAllocation))],
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
    'getNeuronAllocation' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Opt(NeuronAllocation)],
        ['query'],
      ),
    'getSnapshotInfo' : IDL.Func(
        [],
        [
          IDL.Opt(
            IDL.Record({
              'totalVotingPower' : IDL.Nat,
              'lastSnapshotTime' : IDL.Int,
              'lastSnapshotId' : IDL.Nat,
            })
          ),
        ],
        ['query'],
      ),
    'getSystemParameters' : IDL.Func([], [IDL.Vec(SystemParameter)], ['query']),
    'getTokenDetails' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        ['query'],
      ),
    'getUserAllocation' : IDL.Func([], [IDL.Opt(UserState)], ['query']),
    'grantAdminPermission' : IDL.Func(
        [IDL.Principal, AdminFunction, IDL.Nat],
        [Result_1],
        [],
      ),
    'hasAdminPermission' : IDL.Func(
        [IDL.Principal, AdminFunction],
        [IDL.Bool],
        ['query'],
      ),
    'pauseToken' : IDL.Func([IDL.Principal], [Result_1], []),
    'refreshUserVotingPower' : IDL.Func([], [Result_6], []),
    'removeAdmin' : IDL.Func([IDL.Principal], [Result_1], []),
    'removeFollower' : IDL.Func([IDL.Principal], [Result_5], []),
    'removeToken' : IDL.Func([IDL.Principal], [Result_1], []),
    'setTacoAddress' : IDL.Func([IDL.Principal], [], []),
    'set_sns_governance_canister_id' : IDL.Func([IDL.Principal], [], []),
    'syncTokenDetailsFromTreasury' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        [Result_4],
        [],
      ),
    'unfollowAllocation' : IDL.Func([IDL.Principal], [Result_3], []),
    'unpauseToken' : IDL.Func([IDL.Principal], [Result_1], []),
    'updateAllocation' : IDL.Func([IDL.Vec(Allocation)], [Result_2], []),
    'updateMintingVaultConfig' : IDL.Func([UpdateConfig__1], [Result_1], []),
    'updateSpamParameters' : IDL.Func(
        [
          IDL.Record({
            'timeWindowSpamCheck' : IDL.Opt(IDL.Int),
            'allowedCalls' : IDL.Opt(IDL.Nat),
            'allowedSilentWarnings' : IDL.Opt(IDL.Nat),
          }),
        ],
        [Result_1],
        [],
      ),
    'updateSystemParameter' : IDL.Func([SystemParameter], [Result_1], []),
    'updateSystemState' : IDL.Func([SystemState], [Result_1], []),
    'updateTreasuryConfig' : IDL.Func(
        [UpdateConfig, IDL.Opt(IDL.Bool)],
        [Result_1],
        [],
      ),
    'votingPowerMetrics' : IDL.Func([], [Result], ['query']),
  });
  return ContinuousDAO;
};
export const init = ({ IDL }) => { return []; };
