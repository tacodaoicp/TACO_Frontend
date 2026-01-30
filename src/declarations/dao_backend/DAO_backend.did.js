export const idlFactory = ({ IDL }) => {
  const AuthorizationError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : AuthorizationError });
  const TokenType = IDL.Variant({
    'ICP' : IDL.Null,
    'ICRC3' : IDL.Null,
    'ICRC12' : IDL.Null,
  });
  const Result_20 = IDL.Variant({
    'ok' : IDL.Null,
    'err' : AuthorizationError,
  });
  const Result_19 = IDL.Variant({
    'ok' : IDL.Record({
      'skipped' : IDL.Nat,
      'errors' : IDL.Nat,
      'archived' : IDL.Nat,
    }),
    'err' : AuthorizationError,
  });
  const BackfillResult = IDL.Record({
    'startTime' : IDL.Int,
    'neuronsProcessed' : IDL.Nat,
    'periodsCreated' : IDL.Nat,
    'totalNeuronRewards' : IDL.Nat,
    'endTime' : IDL.Int,
    'errors' : IDL.Vec(IDL.Text),
  });
  const Result_18 = IDL.Variant({
    'ok' : BackfillResult,
    'err' : AuthorizationError,
  });
  const TestDataConfig = IDL.Record({
    'allocationFrequencyDays' : IDL.Nat,
    'priceFrequencyDays' : IDL.Nat,
    'daysBack' : IDL.Nat,
  });
  const TestDataResult = IDL.Record({
    'neuronsProcessed' : IDL.Nat,
    'tokensProcessed' : IDL.Nat,
    'errors' : IDL.Vec(IDL.Text),
    'allocationsCreated' : IDL.Nat,
    'pricesCreated' : IDL.Nat,
  });
  const Result_17 = IDL.Variant({ 'ok' : TestDataResult, 'err' : IDL.Text });
  const Allocation = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const NeuronAllocation = IDL.Record({
    'votingPower' : IDL.Nat,
    'lastUpdate' : IDL.Int,
    'lastAllocationMaker' : IDL.Principal,
    'allocations' : IDL.Vec(Allocation),
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
        'note' : IDL.Opt(IDL.Text),
        'allocation' : IDL.Vec(Allocation),
        'allocationMaker' : IDL.Principal,
      })
    ),
    'allocations' : IDL.Vec(Allocation),
    'lastAllocationUpdate' : IDL.Int,
    'neurons' : IDL.Vec(NeuronVP),
  });
  const Result_16 = IDL.Variant({
    'ok' : IDL.Bool,
    'err' : AuthorizationError,
  });
  const Result_15 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : AuthorizationError });
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
  const Result_6 = IDL.Variant({ 'ok' : IDL.Text, 'err' : FollowError });
  const SystemState = IDL.Variant({
    'Paused' : IDL.Null,
    'Active' : IDL.Null,
    'Emergency' : IDL.Null,
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
  const AdminActionType = IDL.Variant({
    'TokenAdd' : IDL.Record({
      'token' : IDL.Principal,
      'viaGovernance' : IDL.Bool,
      'tokenType' : TokenType,
    }),
    'AdminAdd' : IDL.Record({ 'newAdmin' : IDL.Principal }),
    'TokenUnpause' : IDL.Record({ 'token' : IDL.Principal }),
    'AdminPermissionGrant' : IDL.Record({
      'durationDays' : IDL.Nat,
      'function' : IDL.Text,
      'targetAdmin' : IDL.Principal,
    }),
    'CanisterStart' : IDL.Null,
    'TokenPause' : IDL.Record({ 'token' : IDL.Principal }),
    'AdminRemove' : IDL.Record({ 'removedAdmin' : IDL.Principal }),
    'SystemStateChange' : IDL.Record({
      'oldState' : SystemState,
      'newState' : SystemState,
    }),
    'ParameterUpdate' : IDL.Record({
      'oldValue' : IDL.Text,
      'parameter' : SystemParameter,
      'newValue' : IDL.Text,
    }),
    'TokenRemove' : IDL.Record({ 'token' : IDL.Principal }),
    'TokenDelete' : IDL.Record({ 'token' : IDL.Principal }),
    'CanisterStop' : IDL.Null,
  });
  const AdminActionRecord = IDL.Record({
    'id' : IDL.Nat,
    'admin' : IDL.Principal,
    'errorMessage' : IDL.Opt(IDL.Text),
    'actionType' : AdminActionType,
    'timestamp' : IDL.Int,
    'success' : IDL.Bool,
    'reason' : IDL.Text,
  });
  const AdminActionsSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'actions' : IDL.Vec(AdminActionRecord),
  });
  const Result_14 = IDL.Variant({
    'ok' : AdminActionsSinceResponse,
    'err' : AuthorizationError,
  });
  const AdminFunction = IDL.Variant({
    'removeToken' : IDL.Null,
    'setTest' : IDL.Null,
    'manageBannedWords' : IDL.Null,
    'startRebalancing' : IDL.Null,
    'getLogs' : IDL.Null,
    'removeAdmin' : IDL.Null,
    'stopToken' : IDL.Null,
    'backfillPerformanceData' : IDL.Null,
    'getNeuronUpdates' : IDL.Null,
    'unpauseToken' : IDL.Null,
    'updateSystemParameter' : IDL.Null,
    'updateTreasuryConfig' : IDL.Null,
    'getFollowActions' : IDL.Null,
    'updateSpamParameters' : IDL.Null,
    'addToken' : IDL.Null,
    'getAdminActions' : IDL.Null,
    'addAdmin' : IDL.Null,
    'stopRebalancing' : IDL.Null,
    'deleteToken' : IDL.Null,
    'recoverPoolBalances' : IDL.Null,
    'setTacoAddress' : IDL.Null,
    'clearLogs' : IDL.Null,
    'createAuction' : IDL.Null,
    'getVotingPowerChanges' : IDL.Null,
    'updateMintingVaultConfig' : IDL.Null,
    'getAllocationChanges' : IDL.Null,
    'pauseToken' : IDL.Null,
    'updateSystemState' : IDL.Null,
    'endAuctionPanic' : IDL.Null,
  });
  const AdminPermission = IDL.Record({
    'function' : AdminFunction,
    'expiresAt' : IDL.Int,
    'grantedBy' : IDL.Principal,
  });
  const PastAllocationRecord = IDL.Record({
    'to' : IDL.Int,
    'from' : IDL.Int,
    'user' : IDL.Principal,
    'allocation' : IDL.Vec(Allocation),
    'allocationMaker' : IDL.Principal,
  });
  const AllocationChangesSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'changes' : IDL.Vec(PastAllocationRecord),
  });
  const Result_13 = IDL.Variant({
    'ok' : AllocationChangesSinceResponse,
    'err' : AuthorizationError,
  });
  const AllocationStats = IDL.Record({
    'neuronsWithAllocations' : IDL.Nat,
    'recentUpdatesCount' : IDL.Nat,
    'totalUserVotingPower' : IDL.Nat,
    'mostRecentUpdateTime' : IDL.Int,
    'totalNeuronVotingPower' : IDL.Nat,
    'usersWithAllocations' : IDL.Nat,
  });
  const Result_12 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Text),
    'err' : AuthorizationError,
  });
  const UnfollowRecord = IDL.Record({
    'followed' : IDL.Principal,
    'follower' : IDL.Principal,
    'until' : IDL.Int,
  });
  const FollowRecord = IDL.Record({
    'followed' : IDL.Principal,
    'follower' : IDL.Principal,
    'since' : IDL.Int,
  });
  const FollowActionsSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'unfollows' : IDL.Vec(UnfollowRecord),
    'follows' : IDL.Vec(FollowRecord),
  });
  const Result_11 = IDL.Variant({
    'ok' : FollowActionsSinceResponse,
    'err' : AuthorizationError,
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
  const AllocationChangeType = IDL.Variant({
    'FollowAction' : IDL.Record({ 'followedUser' : IDL.Principal }),
    'UserUpdate' : IDL.Record({ 'userInitiated' : IDL.Bool }),
    'SystemRebalance' : IDL.Null,
    'VotingPowerChange' : IDL.Null,
  });
  const NeuronAllocationChangeRecord = IDL.Record({
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
  const NeuronAllocationChangesSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'changes' : IDL.Vec(NeuronAllocationChangeRecord),
  });
  const Result_10 = IDL.Variant({
    'ok' : NeuronAllocationChangesSinceResponse,
    'err' : AuthorizationError,
  });
  const NeuronRecord = IDL.Record({
    'votingPower' : IDL.Nat,
    'users' : IDL.Vec(IDL.Principal),
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const NeuronUpdatesSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'neurons' : IDL.Vec(NeuronRecord),
  });
  const Result_9 = IDL.Variant({
    'ok' : NeuronUpdatesSinceResponse,
    'err' : AuthorizationError,
  });
  const PricePoint = IDL.Record({
    'usdPrice' : IDL.Float64,
    'time' : IDL.Int,
    'icpPrice' : IDL.Nat,
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
  const PublicTokenDetails = IDL.Record({
    'lastTimeSynced' : IDL.Int,
    'balance' : IDL.Nat,
    'isPaused' : IDL.Bool,
    'Active' : IDL.Bool,
    'epochAdded' : IDL.Int,
    'priceInICP' : IDL.Nat,
    'priceInUSD' : IDL.Float64,
    'tokenTransferFee' : IDL.Nat,
    'tokenDecimals' : IDL.Nat,
    'tokenSymbol' : IDL.Text,
    'tokenName' : IDL.Text,
    'pausedDueToSyncFailure' : IDL.Bool,
    'tokenType' : TokenType,
  });
  const PublicTokenDetailsEntry = IDL.Tuple(IDL.Principal, PublicTokenDetails);
  const FollowerInfo = IDL.Record({
    'canBeFollowed' : IDL.Bool,
    'followerCount' : IDL.Nat,
  });
  const UserVotingPowerRecord = IDL.Record({
    'lastVotingPowerUpdate' : IDL.Int,
    'votingPower' : IDL.Nat,
    'user' : IDL.Principal,
    'neurons' : IDL.Vec(NeuronVP),
  });
  const VotingPowerChangesSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'users' : IDL.Vec(UserVotingPowerRecord),
  });
  const Result_8 = IDL.Variant({
    'ok' : VotingPowerChangesSinceResponse,
    'err' : AuthorizationError,
  });
  const RefreshError = IDL.Variant({
    'NotAllowed' : IDL.Null,
    'NoNeuronsFound' : IDL.Null,
    'SnsGovernanceError' : IDL.Text,
    'UnexpectedError' : IDL.Text,
    'SystemInactive' : IDL.Null,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Record({
      'aggregateUpdated' : IDL.Bool,
      'oldVotingPower' : IDL.Nat,
      'neuronsUpdated' : IDL.Nat,
      'newVotingPower' : IDL.Nat,
    }),
    'err' : RefreshError,
  });
  const TokenRegistrationError = IDL.Variant({
    'TokenAlreadyRegistered' : IDL.Null,
    'NotAllowed' : IDL.Null,
    'TokenNotFound' : IDL.Null,
    'TokenNotRegistered' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'MaxTokensReached' : IDL.Null,
    'SystemInactive' : IDL.Null,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Text,
    'err' : TokenRegistrationError,
  });
  const SyncError = IDL.Variant({
    'NotTreasury' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Text, 'err' : SyncError });
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
  const Result_4 = IDL.Variant({ 'ok' : IDL.Text, 'err' : UnfollowError });
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
    'minAllocationDiffBasisPoints' : IDL.Opt(IDL.Nat),
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
    'addAdmin' : IDL.Func([IDL.Principal, IDL.Opt(IDL.Text)], [Result_1], []),
    'addBannedWords' : IDL.Func([IDL.Vec(IDL.Text)], [Result_1], []),
    'addToken' : IDL.Func([IDL.Principal, TokenType], [Result_1], []),
    'addTokenWithReason' : IDL.Func(
        [IDL.Principal, TokenType, IDL.Text],
        [Result_1],
        [],
      ),
    'admin_addPenalizedNeuron' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Nat],
        [Result_20],
        [],
      ),
    'admin_backfillNeuronAllocationRecords' : IDL.Func([], [Result_19], []),
    'admin_backfillPerformanceData' : IDL.Func(
        [
          IDL.Opt(IDL.Int),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Bool),
        ],
        [Result_18],
        [],
      ),
    'admin_clearAllPastPrices' : IDL.Func([], [Result_1], []),
    'admin_generateTestData' : IDL.Func(
        [IDL.Opt(TestDataConfig)],
        [Result_17],
        [],
      ),
    'admin_getAllActiveNeuronIds' : IDL.Func(
        [],
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        ['query'],
      ),
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
    'admin_removePenalizedNeuron' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [Result_16],
        [],
      ),
    'admin_setPenalizedNeurons' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat))],
        [Result_15],
        [],
      ),
    'clearLogs' : IDL.Func([], [], []),
    'deleteToken' : IDL.Func([IDL.Principal, IDL.Text], [Result_1], []),
    'followAllocation' : IDL.Func([IDL.Principal], [Result_6], []),
    'getActiveDecisionMakers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Principal)))],
        ['query'],
      ),
    'getAdminActionsSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_14],
        ['query'],
      ),
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
    'getAllNeuronOwners' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Principal)))],
        ['query'],
      ),
    'getAllocationChangesSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_13],
        ['query'],
      ),
    'getAllocationStats' : IDL.Func([], [AllocationStats], ['query']),
    'getBackfillStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'neuronsChecked' : IDL.Nat,
            'totalNeuronsWithAllocations' : IDL.Nat,
            'neuronsToBackfill' : IDL.Nat,
            'lastRunTime' : IDL.Int,
            'lastResult' : IDL.Opt(
              IDL.Record({
                'skipped' : IDL.Nat,
                'errors' : IDL.Nat,
                'archived' : IDL.Nat,
              })
            ),
            'isRunning' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getBannedWords' : IDL.Func([], [Result_12], []),
    'getFollowActionsSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_11],
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
    'getNeuronAllocationChangesSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_10],
        ['query'],
      ),
    'getNeuronAllocations' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'hasMore' : IDL.Bool,
            'neurons' : IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), NeuronAllocation)),
          }),
        ],
        ['query'],
      ),
    'getNeuronUpdatesSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_9],
        ['query'],
      ),
    'getPenalizedNeurons' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Nat))],
        ['query'],
      ),
    'getPenalizedNeuronsCount' : IDL.Func([], [IDL.Nat], ['query']),
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
    'getTokenDetailsWithoutPastPrices' : IDL.Func(
        [],
        [IDL.Vec(PublicTokenDetailsEntry)],
        ['query'],
      ),
    'getUserAllocation' : IDL.Func([], [IDL.Opt(UserState)], ['query']),
    'getUserNeurons' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(NeuronVP)],
        ['query'],
      ),
    'getUserRegisteredTokens' : IDL.Func(
        [],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'getUsersFollowerInfo' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [IDL.Vec(FollowerInfo)],
        ['query'],
      ),
    'getVotingPowerChangesSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_8],
        ['query'],
      ),
    'get_canister_cycles' : IDL.Func(
        [],
        [IDL.Record({ 'cycles' : IDL.Nat })],
        ['query'],
      ),
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
    'pauseToken' : IDL.Func([IDL.Principal, IDL.Text], [Result_1], []),
    'refreshUserVotingPower' : IDL.Func([], [Result_7], []),
    'registerUserToken' : IDL.Func([IDL.Principal], [Result_3], []),
    'removeAdmin' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Text)],
        [Result_1],
        [],
      ),
    'removeBannedWords' : IDL.Func([IDL.Vec(IDL.Text)], [Result_1], []),
    'removeFollower' : IDL.Func([IDL.Principal], [Result_6], []),
    'removeToken' : IDL.Func([IDL.Principal, IDL.Text], [Result_1], []),
    'setTacoAddress' : IDL.Func([IDL.Principal], [], []),
    'set_sns_governance_canister_id' : IDL.Func([IDL.Principal], [], []),
    'syncTokenDetailsFromTreasury' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        [Result_5],
        [],
      ),
    'unfollowAllocation' : IDL.Func([IDL.Principal], [Result_4], []),
    'unpauseToken' : IDL.Func([IDL.Principal, IDL.Text], [Result_1], []),
    'unregisterUserToken' : IDL.Func([IDL.Principal], [Result_3], []),
    'updateAllocation' : IDL.Func(
        [IDL.Vec(Allocation), IDL.Opt(IDL.Text)],
        [Result_2],
        [],
      ),
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
    'updateSystemParameter' : IDL.Func(
        [SystemParameter, IDL.Opt(IDL.Text)],
        [Result_1],
        [],
      ),
    'updateSystemState' : IDL.Func([SystemState, IDL.Text], [Result_1], []),
    'updateTreasuryConfig' : IDL.Func(
        [UpdateConfig, IDL.Opt(IDL.Bool), IDL.Opt(IDL.Text)],
        [Result_1],
        [],
      ),
    'votingPowerMetrics' : IDL.Func([], [Result], ['query']),
  });
  return ContinuousDAO;
};
export const init = ({ IDL }) => { return []; };
