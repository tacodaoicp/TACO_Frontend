export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const DistributionStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'PartiallyCompleted' : IDL.Record({
      'successfulNeurons' : IDL.Nat,
      'failedNeurons' : IDL.Nat,
    }),
    'InProgress' : IDL.Record({
      'currentNeuron' : IDL.Nat,
      'totalNeurons' : IDL.Nat,
    }),
    'Completed' : IDL.Null,
  });
  const PriceInfo = IDL.Record({
    'usdPrice' : IDL.Float64,
    'timestamp' : IDL.Int,
    'icpPrice' : IDL.Nat,
  });
  const Allocation = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const CheckpointData = IDL.Record({
    'maker' : IDL.Opt(IDL.Principal),
    'totalPortfolioValue' : IDL.Float64,
    'pricesUsed' : IDL.Vec(IDL.Tuple(IDL.Principal, PriceInfo)),
    'timestamp' : IDL.Int,
    'allocations' : IDL.Vec(Allocation),
    'tokenValues' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Float64)),
  });
  const NeuronReward = IDL.Record({
    'rewardAmount' : IDL.Nat,
    'performanceScore' : IDL.Float64,
    'votingPower' : IDL.Nat,
    'rewardScore' : IDL.Float64,
    'checkpoints' : IDL.Vec(CheckpointData),
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const FailedNeuron = IDL.Record({
    'errorMessage' : IDL.Text,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const RewardDistributionBlockData = IDL.Record({
    'id' : IDL.Nat,
    'startTime' : IDL.Int,
    'status' : DistributionStatus,
    'neuronsProcessed' : IDL.Nat,
    'endTime' : IDL.Int,
    'actualDistributed' : IDL.Nat,
    'totalRewardPot' : IDL.Nat,
    'timestamp' : IDL.Int,
    'totalRewardScore' : IDL.Float64,
    'neuronRewards' : IDL.Vec(NeuronReward),
    'failedNeurons' : IDL.Vec(FailedNeuron),
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
  const Result_1 = IDL.Variant({
    'ok' : IDL.Vec(RewardDistributionBlockData),
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
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const RewardDistributionArchive = IDL.Service({
    'archiveRewardDistribution' : IDL.Func(
        [RewardDistributionBlockData],
        [Result_3],
        [],
      ),
    'getArchiveStats' : IDL.Func([], [ArchiveStatus], ['query']),
    'getArchiveStatus' : IDL.Func([], [Result_2], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [IDL.Record({ 'intervalSeconds' : IDL.Nat, 'isRunning' : IDL.Bool })],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getRewardDistributionsByDistributionId' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Nat), IDL.Nat],
        [Result_1],
        ['query'],
      ),
    'getRewardDistributionsByTimeRange' : IDL.Func(
        [IDL.Int, IDL.Int, IDL.Nat],
        [Result_1],
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
    'resetImportTimestamps' : IDL.Func([], [Result], []),
    'runManualBatchImport' : IDL.Func([], [Result], []),
    'setMaxInnerLoopIterations' : IDL.Func([IDL.Nat], [Result], []),
    'startBatchImportSystem' : IDL.Func([], [Result], []),
    'stopAllTimers' : IDL.Func([], [Result], []),
    'stopBatchImportSystem' : IDL.Func([], [Result], []),
  });
  return RewardDistributionArchive;
};
export const init = ({ IDL }) => { return []; };
