export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const DetailedTokenSnapshot = IDL.Record({
    'decimals' : IDL.Nat,
    'token' : IDL.Principal,
    'balance' : IDL.Nat,
    'priceInICP' : IDL.Nat,
    'priceInUSD' : IDL.Float64,
    'valueInICP' : IDL.Nat,
    'valueInUSD' : IDL.Float64,
  });
  const SnapshotReason = IDL.Variant({
    'ManualTrigger' : IDL.Null,
    'SystemEvent' : IDL.Null,
    'PostTrade' : IDL.Null,
    'Scheduled' : IDL.Null,
    'CircuitBreaker' : IDL.Null,
  });
  const PortfolioBlockData = IDL.Record({
    'totalValueICP' : IDL.Nat,
    'totalValueUSD' : IDL.Float64,
    'tokens' : IDL.Vec(DetailedTokenSnapshot),
    'timestamp' : IDL.Int,
    'tokenCount' : IDL.Nat,
    'pausedTokens' : IDL.Vec(IDL.Principal),
    'reason' : SnapshotReason,
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
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Record({
      'processed' : IDL.Nat32,
      'newCandlesCreated' : IDL.Nat32,
    }),
    'err' : ArchiveError,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Record({ 'flushedCandles' : IDL.Nat }),
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
  const Result_5 = IDL.Variant({ 'ok' : ArchiveStatus, 'err' : ArchiveError });
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
  const OHLCCandle = IDL.Record({
    'icpOHLC' : IDL.Record({
      'low' : IDL.Nat,
      'high' : IDL.Nat,
      'close' : IDL.Nat,
      'open' : IDL.Nat,
    }),
    'timestamp' : IDL.Int,
    'usdOHLC' : IDL.Record({
      'low' : IDL.Float64,
      'high' : IDL.Float64,
      'close' : IDL.Float64,
      'open' : IDL.Float64,
    }),
  });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Vec(OHLCCandle),
    'err' : ArchiveError,
  });
  const Resolution = IDL.Variant({
    'day' : IDL.Null,
    'month' : IDL.Null,
    'hour' : IDL.Null,
    'week' : IDL.Null,
    'year' : IDL.Null,
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
  const Candle = IDL.Record({
    'c' : IDL.Nat64,
    'h' : IDL.Nat64,
    'l' : IDL.Nat64,
    'n' : IDL.Nat32,
    'o' : IDL.Nat64,
    't_start' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(Candle),
    'err' : ArchiveError,
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
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : ArchiveError });
  const ArchiveConfig = IDL.Record({
    'maxBlocksPerCanister' : IDL.Nat,
    'blockRetentionPeriodNS' : IDL.Int,
    'autoArchiveEnabled' : IDL.Bool,
    'enableCompression' : IDL.Bool,
  });
  const PortfolioArchiveV2 = IDL.Service({
    'archivePortfolioBlock' : IDL.Func([PortfolioBlockData], [Result_2], []),
    'backfillOHLC' : IDL.Func([IDL.Nat32], [Result_7], []),
    'flushOHLCCarryState' : IDL.Func([], [Result_6], []),
    'getArchiveStats' : IDL.Func([], [ArchiveStatus], ['query']),
    'getArchiveStatus' : IDL.Func([], [Result_5], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'lastPortfolioImportTime' : IDL.Int,
            'intervalSeconds' : IDL.Nat,
            'isRunning' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getOHLCBackfillStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalSnapshots' : IDL.Nat64,
            'progressPercent' : IDL.Float64,
            'lastSnapshotIdx' : IDL.Nat64,
            'indexedUntilIdx' : IDL.Nat64,
            'hasCarryState' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getOHLCCandles' : IDL.Func(
        [IDL.Int, IDL.Int, IDL.Int],
        [Result_4],
        ['query'],
      ),
    'getOHLCStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'shardBreakdown' : IDL.Vec(IDL.Tuple(Resolution, IDL.Nat)),
            'totalCandles' : IDL.Nat,
            'totalShards' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getTimerStatus' : IDL.Func([], [TimerStatus], ['query']),
    'get_canister_cycles' : IDL.Func(
        [],
        [IDL.Record({ 'cycles' : IDL.Nat })],
        ['query'],
      ),
    'get_ohlc' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, Resolution, IDL.Nat32],
        [Result_3],
        ['query'],
      ),
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
    'lower_bound_ts' : IDL.Func([IDL.Int], [Result_2], ['query']),
    'resetImportTimestamps' : IDL.Func([], [Result_1], []),
    'resetOHLCSystem' : IDL.Func([], [Result], []),
    'runLegacyManualBatchImport' : IDL.Func([], [Result_1], []),
    'runManualBatchImport' : IDL.Func([], [Result_1], []),
    'setMaxInnerLoopIterations' : IDL.Func([IDL.Nat], [Result_1], []),
    'startBatchImportSystem' : IDL.Func([], [Result_1], []),
    'startLegacyBatchImportSystem' : IDL.Func([], [Result_1], []),
    'startOHLCBackfill' : IDL.Func([IDL.Nat32], [Result], []),
    'stopAllTimers' : IDL.Func([], [Result_1], []),
    'stopBatchImportSystem' : IDL.Func([], [Result_1], []),
    'updateConfig' : IDL.Func([ArchiveConfig], [Result], []),
  });
  return PortfolioArchiveV2;
};
export const init = ({ IDL }) => { return []; };
