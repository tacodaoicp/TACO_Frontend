export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const Allocation = IDL.Record({
    'token' : IDL.Principal,
    'basisPoints' : IDL.Nat,
  });
  const AllocationChangeType = IDL.Variant({
    'FollowAction' : IDL.Record({ 'followedUser' : IDL.Principal }),
    'UserUpdate' : IDL.Record({ 'userInitiated' : IDL.Bool }),
    'SystemRebalance' : IDL.Null,
    'VotingPowerChange' : IDL.Null,
  });
  const NeuronAllocationChangeBlockData = IDL.Record({
    'id' : IDL.Nat,
    'maker' : IDL.Principal,
    'oldAllocations' : IDL.Vec(Allocation),
    'changeType' : AllocationChangeType,
    'votingPower' : IDL.Nat,
    'newAllocations' : IDL.Vec(Allocation),
    'timestamp' : IDL.Int,
    'neuronId' : IDL.Vec(IDL.Nat8),
    'reason' : IDL.Opt(IDL.Text),
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
  const Result_4 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Record({
      'totalBlocks' : IDL.Nat,
      'totalNeuronAllocationChanges' : IDL.Nat,
      'makerCount' : IDL.Nat,
      'neuronCount' : IDL.Nat,
    }),
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
    'ok' : IDL.Vec(NeuronAllocationChangeBlockData),
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
  const DAONeuronAllocationArchive = IDL.Service({
    'archiveNeuronAllocationChange' : IDL.Func(
        [NeuronAllocationChangeBlockData],
        [Result_4],
        [],
      ),
    'getArchiveStats' : IDL.Func([], [Result_3], []),
    'getArchiveStatus' : IDL.Func([], [Result_2], ['query']),
    'getBatchImportStatus' : IDL.Func(
        [],
        [IDL.Record({ 'intervalSeconds' : IDL.Nat, 'isRunning' : IDL.Bool })],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getNeuronAllocationChangesByMaker' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_1],
        ['query'],
      ),
    'getNeuronAllocationChangesByNeuron' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Nat],
        [Result_1],
        ['query'],
      ),
    'getNeuronAllocationChangesByNeuronInTimeRange' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, IDL.Nat],
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
    'importNeuronAllocationChanges' : IDL.Func([], [Result], []),
    'resetImportTimestamps' : IDL.Func([], [Result], []),
    'runManualBatchImport' : IDL.Func([], [Result], []),
    'setMaxInnerLoopIterations' : IDL.Func([IDL.Nat], [Result], []),
    'startBatchImportSystem' : IDL.Func([], [Result], []),
    'stopAllTimers' : IDL.Func([], [Result], []),
    'stopBatchImportSystem' : IDL.Func([], [Result], []),
  });
  return DAONeuronAllocationArchive;
};
export const init = ({ IDL }) => { return []; };
