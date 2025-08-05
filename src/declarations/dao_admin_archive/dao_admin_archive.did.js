export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const TokenType = IDL.Variant({
    'ICP' : IDL.Null,
    'ICRC3' : IDL.Null,
    'ICRC12' : IDL.Null,
  });
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
  const AdminActionVariant = IDL.Variant({
    'StopRebalancing' : IDL.Null,
    'TokenAdd' : IDL.Record({
      'token' : IDL.Principal,
      'viaGovernance' : IDL.Bool,
      'tokenType' : TokenType,
    }),
    'UpdatePortfolioCircuitBreaker' : IDL.Record({
      'newCondition' : IDL.Text,
      'conditionId' : IDL.Nat,
      'oldCondition' : IDL.Text,
    }),
    'AdminAdd' : IDL.Record({ 'newAdmin' : IDL.Principal }),
    'ClearAllTradingPauses' : IDL.Null,
    'UnpauseToken' : IDL.Record({ 'token' : IDL.Principal }),
    'PauseTokenManual' : IDL.Record({
      'token' : IDL.Principal,
      'pauseType' : IDL.Text,
    }),
    'TokenUnpause' : IDL.Record({ 'token' : IDL.Principal }),
    'AdminPermissionGrant' : IDL.Record({
      'durationDays' : IDL.Nat,
      'function' : IDL.Text,
      'targetAdmin' : IDL.Principal,
    }),
    'TokenPause' : IDL.Record({ 'token' : IDL.Principal }),
    'SetPortfolioCircuitBreakerActive' : IDL.Record({
      'conditionId' : IDL.Nat,
      'isActive' : IDL.Bool,
    }),
    'StartRebalancing' : IDL.Null,
    'AdminRemove' : IDL.Record({ 'removedAdmin' : IDL.Principal }),
    'SystemStateChange' : IDL.Record({
      'oldState' : SystemState,
      'newState' : SystemState,
    }),
    'SetTestMode' : IDL.Record({ 'isTestMode' : IDL.Bool }),
    'ClearPortfolioCircuitBreakerLogs' : IDL.Null,
    'AddPortfolioCircuitBreaker' : IDL.Record({
      'conditionId' : IDL.Nat,
      'conditionType' : IDL.Text,
      'details' : IDL.Text,
    }),
    'ParameterUpdate' : IDL.Record({
      'oldValue' : IDL.Text,
      'parameter' : SystemParameter,
      'newValue' : IDL.Text,
    }),
    'UpdateTriggerCondition' : IDL.Record({
      'newCondition' : IDL.Text,
      'conditionId' : IDL.Nat,
      'oldCondition' : IDL.Text,
    }),
    'TokenRemove' : IDL.Record({ 'token' : IDL.Principal }),
    'RemoveTriggerCondition' : IDL.Record({ 'conditionId' : IDL.Nat }),
    'UpdatePausedTokenThreshold' : IDL.Record({
      'newThreshold' : IDL.Nat,
      'oldThreshold' : IDL.Nat,
    }),
    'UpdateRebalanceConfig' : IDL.Record({
      'newConfig' : IDL.Text,
      'oldConfig' : IDL.Text,
    }),
    'AddTriggerCondition' : IDL.Record({
      'conditionId' : IDL.Nat,
      'conditionType' : IDL.Text,
      'details' : IDL.Text,
    }),
    'RemovePortfolioCircuitBreaker' : IDL.Record({ 'conditionId' : IDL.Nat }),
    'SetTriggerConditionActive' : IDL.Record({
      'conditionId' : IDL.Nat,
      'isActive' : IDL.Bool,
    }),
    'UpdateMaxPortfolioSnapshots' : IDL.Record({
      'oldLimit' : IDL.Nat,
      'newLimit' : IDL.Nat,
    }),
    'ResetRebalanceState' : IDL.Null,
    'ClearSystemLogs' : IDL.Null,
    'ClearPriceAlerts' : IDL.Null,
  });
  const AdminCanisterSource = IDL.Variant({
    'DAO_backend' : IDL.Null,
    'Treasury' : IDL.Null,
  });
  const AdminActionBlockData = IDL.Record({
    'id' : IDL.Nat,
    'admin' : IDL.Principal,
    'errorMessage' : IDL.Opt(IDL.Text),
    'actionType' : AdminActionVariant,
    'canister' : AdminCanisterSource,
    'timestamp' : IDL.Int,
    'success' : IDL.Bool,
    'reason' : IDL.Text,
  });
  const ArchiveError = IDL.Variant({
    'StorageFull' : IDL.Null,
    'SystemError' : IDL.Text,
    'NotAuthorized' : IDL.Null,
    'InvalidData' : IDL.Null,
    'BlockNotFound' : IDL.Null,
    'InvalidBlockType' : IDL.Null,
    'InvalidTimeRange' : IDL.Null,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Vec(AdminActionBlockData),
    'err' : ArchiveError,
  });
  const ArchiveStatus = IDL.Record({
    'supportedBlockTypes' : IDL.Vec(IDL.Text),
    'newestBlock' : IDL.Opt(IDL.Nat),
    'storageUsed' : IDL.Nat,
    'oldestBlock' : IDL.Opt(IDL.Nat),
    'totalBlocks' : IDL.Nat,
    'lastArchiveTime' : IDL.Int,
  });
  const Result_1 = IDL.Variant({ 'ok' : ArchiveStatus, 'err' : ArchiveError });
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
  const TimerStatus = IDL.Record({
    'innerLoopRunning' : IDL.Bool,
    'middleLoopCurrentState' : IDL.Text,
    'middleLoopStartTime' : IDL.Int,
    'outerLoopLastRun' : IDL.Int,
    'outerLoopRunning' : IDL.Bool,
    'innerLoopCurrentType' : IDL.Text,
    'innerLoopCurrentBatch' : IDL.Nat,
    'middleLoopTotalRuns' : IDL.Nat,
    'outerLoopIntervalSeconds' : IDL.Nat,
    'innerLoopStartTime' : IDL.Int,
    'middleLoopNextScheduled' : IDL.Int,
    'outerLoopTotalRuns' : IDL.Nat,
    'middleLoopLastRun' : IDL.Int,
    'middleLoopRunning' : IDL.Bool,
    'innerLoopLastRun' : IDL.Int,
    'innerLoopNextScheduled' : IDL.Int,
    'innerLoopTotalBatches' : IDL.Nat,
  });
  const GetArchivesArgs = IDL.Record({ 'from' : IDL.Opt(IDL.Principal) });
  const GetArchivesResult = IDL.Vec(
    IDL.Record({
      'end' : IDL.Nat,
      'canister_id' : IDL.Principal,
      'start' : IDL.Nat,
    })
  );
  const GetBlocksArgs = IDL.Vec(
    IDL.Record({ 'start' : IDL.Nat, 'length' : IDL.Nat })
  );
  Value.fill(
    IDL.Variant({
      'Int' : IDL.Int,
      'Map' : IDL.Vec(IDL.Tuple(IDL.Text, Value)),
      'Nat' : IDL.Nat,
      'Blob' : IDL.Vec(IDL.Nat8),
      'Text' : IDL.Text,
      'Array' : IDL.Vec(Value),
    })
  );
  const Block = IDL.Record({ 'id' : IDL.Nat, 'block' : Value });
  const ArchivedBlock = IDL.Record({
    'args' : GetBlocksArgs,
    'callback' : IDL.Func([GetBlocksArgs], [GetBlocksResult], ['query']),
  });
  GetBlocksResult.fill(
    IDL.Record({
      'log_length' : IDL.Nat,
      'blocks' : IDL.Vec(Block),
      'archived_blocks' : IDL.Vec(ArchivedBlock),
    })
  );
  const DataCertificate = IDL.Record({
    'certificate' : IDL.Vec(IDL.Nat8),
    'hash_tree' : IDL.Vec(IDL.Nat8),
  });
  const BlockType = IDL.Record({ 'url' : IDL.Text, 'block_type' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const DAOAdminArchive = IDL.Service({
    'archiveAdminAction' : IDL.Func([AdminActionBlockData], [Result_3], []),
    'getAdminActionsByAdmin' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_2],
        ['query'],
      ),
    'getAdminActionsByCanister' : IDL.Func(
        [AdminCanisterSource, IDL.Nat],
        [Result_2],
        ['query'],
      ),
    'getArchiveStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'lastImportedDAOActionId' : IDL.Nat,
            'totalSuccessfulActions' : IDL.Nat,
            'totalDAOActions' : IDL.Nat,
            'lastImportedTreasuryActionId' : IDL.Nat,
            'totalBlocks' : IDL.Nat,
            'totalTreasuryActions' : IDL.Nat,
            'totalAdminActions' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getArchiveStatus' : IDL.Func([], [Result_1], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [IDL.Record({ 'intervalSeconds' : IDL.Nat, 'isRunning' : IDL.Bool })],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getTimerStatus' : IDL.Func([], [TimerStatus], ['query']),
    'icrc3_get_archives' : IDL.Func(
        [GetArchivesArgs],
        [GetArchivesResult],
        ['query'],
      ),
    'icrc3_get_blocks' : IDL.Func(
        [GetBlocksArgs],
        [GetBlocksResult],
        ['query'],
      ),
    'icrc3_get_tip_certificate' : IDL.Func(
        [],
        [IDL.Opt(DataCertificate)],
        ['query'],
      ),
    'icrc3_supported_block_types' : IDL.Func(
        [],
        [IDL.Vec(BlockType)],
        ['query'],
      ),
    'importDAOAdminActions' : IDL.Func([], [Result], []),
    'importTreasuryAdminActions' : IDL.Func([], [Result], []),
    'resetImportTimestamps' : IDL.Func([], [Result], []),
    'runManualBatchImport' : IDL.Func([], [Result], []),
    'setMaxInnerLoopIterations' : IDL.Func([IDL.Nat], [Result], []),
    'startBatchImportSystem' : IDL.Func([], [Result], []),
    'stopAllTimers' : IDL.Func([], [Result], []),
    'stopBatchImportSystem' : IDL.Func([], [Result], []),
  });
  return DAOAdminArchive;
};
export const init = ({ IDL }) => { return []; };
