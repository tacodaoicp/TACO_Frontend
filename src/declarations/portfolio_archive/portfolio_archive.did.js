export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
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
    'timestamp' : IDL.Int,
    'tokenCount' : IDL.Nat,
    'pausedTokens' : IDL.Vec(IDL.Principal),
    'activeTokens' : IDL.Vec(IDL.Principal),
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
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const ArchiveStatus = IDL.Record({
    'supportedBlockTypes' : IDL.Vec(IDL.Text),
    'newestBlock' : IDL.Opt(IDL.Nat),
    'storageUsed' : IDL.Nat,
    'oldestBlock' : IDL.Opt(IDL.Nat),
    'totalBlocks' : IDL.Nat,
    'lastArchiveTime' : IDL.Int,
  });
  const Result_2 = IDL.Variant({ 'ok' : ArchiveStatus, 'err' : ArchiveError });
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
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const ArchiveConfig = IDL.Record({
    'maxBlocksPerCanister' : IDL.Nat,
    'blockRetentionPeriodNS' : IDL.Int,
    'autoArchiveEnabled' : IDL.Bool,
    'enableCompression' : IDL.Bool,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : ArchiveError });
  const PortfolioArchiveV2 = IDL.Service({
    'archivePortfolioBlock' : IDL.Func([PortfolioBlockData], [Result_3], []),
    'getArchiveStatus' : IDL.Func([], [Result_2], ['query']),
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
  return PortfolioArchiveV2;
};
export const init = ({ IDL }) => { return []; };
