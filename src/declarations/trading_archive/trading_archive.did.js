export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const CircuitBreakerEventType = IDL.Variant({
    'TradingPause' : IDL.Null,
    'PortfolioBreaker' : IDL.Null,
    'PriceAlert' : IDL.Null,
    'SystemEmergency' : IDL.Null,
  });
  const CircuitBreakerBlockData = IDL.Record({
    'tokensAffected' : IDL.Vec(IDL.Principal),
    'systemResponse' : IDL.Text,
    'triggerToken' : IDL.Opt(IDL.Principal),
    'actualValue' : IDL.Float64,
    'timestamp' : IDL.Int,
    'severity' : IDL.Text,
    'thresholdValue' : IDL.Float64,
    'eventType' : CircuitBreakerEventType,
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
  const Result_5 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const ExchangeType = IDL.Variant({
    'KongSwap' : IDL.Null,
    'ICPSwap' : IDL.Null,
  });
  const TradeBlockData = IDL.Record({
    'fee' : IDL.Nat,
    'trader' : IDL.Principal,
    'error' : IDL.Opt(IDL.Text),
    'amountSold' : IDL.Nat,
    'amountBought' : IDL.Nat,
    'timestamp' : IDL.Int,
    'tokenSold' : IDL.Principal,
    'success' : IDL.Bool,
    'exchange' : ExchangeType,
    'tokenBought' : IDL.Principal,
    'slippage' : IDL.Float64,
  });
  const TradingPauseReason = IDL.Variant({
    'PriceVolatility' : IDL.Null,
    'AdminAction' : IDL.Null,
    'LiquidityIssue' : IDL.Null,
    'CircuitBreaker' : IDL.Null,
    'SystemMaintenance' : IDL.Null,
  });
  const TradingPauseBlockData = IDL.Record({
    'token' : IDL.Principal,
    'duration' : IDL.Opt(IDL.Int),
    'tokenSymbol' : IDL.Text,
    'timestamp' : IDL.Int,
    'reason' : TradingPauseReason,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const ArchiveStatus = IDL.Record({
    'supportedBlockTypes' : IDL.Vec(IDL.Text),
    'newestBlock' : IDL.Opt(IDL.Nat),
    'storageUsed' : IDL.Nat,
    'oldestBlock' : IDL.Opt(IDL.Nat),
    'totalBlocks' : IDL.Nat,
    'lastArchiveTime' : IDL.Int,
  });
  const Result_4 = IDL.Variant({ 'ok' : ArchiveStatus, 'err' : ArchiveError });
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
  const TradingMetrics = IDL.Record({
    'exchangeBreakdown' : IDL.Vec(IDL.Tuple(ExchangeType, IDL.Nat)),
    'totalTrades' : IDL.Nat,
    'totalVolume' : IDL.Nat,
    'uniqueTraders' : IDL.Nat,
    'avgSlippage' : IDL.Float64,
    'successfulTrades' : IDL.Nat,
    'avgTradeSize' : IDL.Nat,
    'topTokensByVolume' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
  });
  const Result_3 = IDL.Variant({ 'ok' : TradingMetrics, 'err' : ArchiveError });
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
    'NeuronUpdate' : IDL.Null,
    'VotingPower' : IDL.Null,
    'RewardDistribution' : IDL.Null,
    'AllocationChange' : IDL.Null,
    'Pause' : IDL.Null,
    'Price' : IDL.Null,
    'FollowAction' : IDL.Null,
    'Portfolio' : IDL.Null,
    'Trade' : IDL.Null,
    'RewardWithdrawal' : IDL.Null,
    'Admin' : IDL.Null,
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
  const TradingArchiveV2 = IDL.Service({
    'archiveCircuitBreakerBlock' : IDL.Func(
        [CircuitBreakerBlockData],
        [Result_5],
        [],
      ),
    'archiveTradeBlock' : IDL.Func([TradeBlockData], [Result_5], []),
    'archiveTradingPauseBlock' : IDL.Func(
        [TradingPauseBlockData],
        [Result_5],
        [],
      ),
    'catchUpImport' : IDL.Func([], [Result_1], []),
    'getArchiveStats' : IDL.Func([], [ArchiveStatus], ['query']),
    'getArchiveStatus' : IDL.Func([], [Result_4], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'lastImportedTradeTimestamp' : IDL.Int,
            'intervalSeconds' : IDL.Nat,
            'isRunning' : IDL.Bool,
            'lastImportedPriceAlertId' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getTimerStatus' : IDL.Func([], [TimerStatus], ['query']),
    'getTradingMetrics' : IDL.Func([IDL.Int, IDL.Int], [Result_3], ['query']),
    'get_canister_cycles' : IDL.Func(
        [],
        [IDL.Record({ 'cycles' : IDL.Nat })],
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
  return TradingArchiveV2;
};
export const init = ({ IDL }) => { return []; };
