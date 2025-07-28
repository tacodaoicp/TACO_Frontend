export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const ExchangeType = IDL.Variant({
    'KongSwap' : IDL.Null,
    'ICPSwap' : IDL.Null,
  });
  const PriceSource = IDL.Variant({
    'NTN' : IDL.Null,
    'Aggregated' : IDL.Null,
    'Oracle' : IDL.Null,
    'Exchange' : ExchangeType,
  });
  const PriceBlockData = IDL.Record({
    'token' : IDL.Principal,
    'change24h' : IDL.Opt(IDL.Float64),
    'source' : PriceSource,
    'volume24h' : IDL.Opt(IDL.Nat),
    'priceICP' : IDL.Nat,
    'priceUSD' : IDL.Float64,
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
  const Result_6 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const ArchiveStatus = IDL.Record({
    'supportedBlockTypes' : IDL.Vec(IDL.Text),
    'newestBlock' : IDL.Opt(IDL.Nat),
    'storageUsed' : IDL.Nat,
    'oldestBlock' : IDL.Opt(IDL.Nat),
    'totalBlocks' : IDL.Nat,
    'lastArchiveTime' : IDL.Int,
  });
  const Result_5 = IDL.Variant({ 'ok' : ArchiveStatus, 'err' : ArchiveError });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Opt(
      IDL.Record({
        'usdPrice' : IDL.Float64,
        'timestamp' : IDL.Int,
        'icpPrice' : IDL.Nat,
      })
    ),
    'err' : ArchiveError,
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
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(PriceBlockData),
    'err' : ArchiveError,
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
  const TacoBlockType = IDL.Variant({
    'Pause' : IDL.Null,
    'Price' : IDL.Null,
    'Portfolio' : IDL.Null,
    'Trade' : IDL.Null,
    'Allocation' : IDL.Null,
    'Circuit' : IDL.Null,
  });
  const BlockFilter = IDL.Record({
    'maxAmount' : IDL.Opt(IDL.Nat),
    'startTime' : IDL.Opt(IDL.Int),
    'minAmount' : IDL.Opt(IDL.Nat),
    'endTime' : IDL.Opt(IDL.Int),
    'traders' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'tokens' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'blockTypes' : IDL.Opt(IDL.Vec(TacoBlockType)),
  });
  const ArchiveQueryResult = IDL.Record({
    'hasMore' : IDL.Bool,
    'totalCount' : IDL.Nat,
    'nextIndex' : IDL.Opt(IDL.Nat),
    'blocks' : IDL.Vec(Block),
  });
  const Result_2 = IDL.Variant({
    'ok' : ArchiveQueryResult,
    'err' : ArchiveError,
  });
  const ArchiveConfig = IDL.Record({
    'maxBlocksPerCanister' : IDL.Nat,
    'blockRetentionPeriodNS' : IDL.Int,
    'autoArchiveEnabled' : IDL.Bool,
    'enableCompression' : IDL.Bool,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : ArchiveError });
  const PriceArchiveV2 = IDL.Service({
    'archivePriceBlock' : IDL.Func([PriceBlockData], [Result_6], []),
    'catchUpImport' : IDL.Func([], [Result_1], []),
    'getArchiveStatus' : IDL.Func([], [Result_5], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'lastImportedPriceTime' : IDL.Int,
            'intervalSeconds' : IDL.Nat,
            'isRunning' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getLatestPrice' : IDL.Func([IDL.Principal], [Result_4], ['query']),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getPriceHistory' : IDL.Func(
        [IDL.Principal, IDL.Int, IDL.Int],
        [Result_3],
        ['query'],
      ),
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
    'queryBlocks' : IDL.Func([BlockFilter], [Result_2], ['query']),
    'resetImportTimestamps' : IDL.Func([], [Result_1], []),
    'runLegacyManualBatchImport' : IDL.Func([], [Result_1], []),
    'runManualBatchImport' : IDL.Func([], [Result_1], []),
    'setMaxInnerLoopIterations' : IDL.Func([IDL.Nat], [Result_1], []),
    'startBatchImportSystem' : IDL.Func([], [Result_1], []),
    'startLegacyBatchImportSystem' : IDL.Func([], [Result_1], []),
    'stopAllTimers' : IDL.Func([], [Result_1], []),
    'stopBatchImportSystem' : IDL.Func([], [Result_1], []),
    'updateConfig' : IDL.Func([ArchiveConfig], [Result], []),
  });
  return PriceArchiveV2;
};
export const init = ({ IDL }) => { return []; };
