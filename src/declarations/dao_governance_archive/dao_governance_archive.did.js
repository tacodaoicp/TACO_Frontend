export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const NeuronUpdateType = IDL.Variant({
    'VotingPowerChanged' : IDL.Null,
    'StateChanged' : IDL.Null,
    'Added' : IDL.Null,
    'Removed' : IDL.Null,
  });
  const NeuronUpdateBlockData = IDL.Record({
    'id' : IDL.Nat,
    'updateType' : NeuronUpdateType,
    'oldVotingPower' : IDL.Opt(IDL.Nat),
    'timestamp' : IDL.Int,
    'neuronId' : IDL.Vec(IDL.Nat8),
    'newVotingPower' : IDL.Opt(IDL.Nat),
    'affectedUsers' : IDL.Vec(IDL.Principal),
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
  const VotingPowerChangeType = IDL.Variant({
    'SystemUpdate' : IDL.Null,
    'NeuronSnapshot' : IDL.Null,
    'ManualRefresh' : IDL.Null,
  });
  const NeuronVP = IDL.Record({
    'votingPower' : IDL.Nat,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const VotingPowerBlockData = IDL.Record({
    'id' : IDL.Nat,
    'changeType' : VotingPowerChangeType,
    'user' : IDL.Principal,
    'oldVotingPower' : IDL.Nat,
    'timestamp' : IDL.Int,
    'newVotingPower' : IDL.Nat,
    'neurons' : IDL.Vec(NeuronVP),
  });
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
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(NeuronUpdateBlockData),
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
  const Result_1 = IDL.Variant({
    'ok' : IDL.Vec(VotingPowerBlockData),
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
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const DAOGovernanceArchive = IDL.Service({
    'archiveNeuronUpdate' : IDL.Func([NeuronUpdateBlockData], [Result_2], []),
    'archiveVotingPowerChange' : IDL.Func(
        [VotingPowerBlockData],
        [Result_2],
        [],
      ),
    'getArchiveStats' : IDL.Func([], [ArchiveStatus], ['query']),
    'getArchiveStatus' : IDL.Func([], [Result_4], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [IDL.Record({ 'intervalSeconds' : IDL.Nat, 'isRunning' : IDL.Bool })],
        ['query'],
      ),
    'getGovernanceMetrics' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalActiveUsers' : IDL.Nat,
            'averageVotingPowerPerUser' : IDL.Nat,
            'activeNeuronCount' : IDL.Nat,
            'totalVotingPowerInSystem' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getNeuronUpdatesByNeuron' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Nat],
        [Result_3],
        ['query'],
      ),
    'getTimerStatus' : IDL.Func([], [TimerStatus], ['query']),
    'getUserVotingPowerAtTime' : IDL.Func(
        [IDL.Principal, IDL.Int],
        [Result_2],
        ['query'],
      ),
    'getVotingPowerChangesByUser' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_1],
        ['query'],
      ),
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
    'importNeuronUpdates' : IDL.Func([], [Result], []),
    'importVotingPowerChanges' : IDL.Func([], [Result], []),
    'resetImportTimestamps' : IDL.Func([], [Result], []),
    'runManualBatchImport' : IDL.Func([], [Result], []),
    'setMaxInnerLoopIterations' : IDL.Func([IDL.Nat], [Result], []),
    'startBatchImportSystem' : IDL.Func([], [Result], []),
    'stopAllTimers' : IDL.Func([], [Result], []),
    'stopBatchImportSystem' : IDL.Func([], [Result], []),
  });
  return DAOGovernanceArchive;
};
export const init = ({ IDL }) => { return []; };
