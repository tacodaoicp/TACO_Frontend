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
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const Result_1 = IDL.Variant({
    'ok' : IDL.Record({
      'totalBlocks' : IDL.Nat,
      'totalNeuronAllocationChanges' : IDL.Nat,
      'makerCount' : IDL.Nat,
      'neuronCount' : IDL.Nat,
    }),
    'err' : ArchiveError,
  });
  const Result = IDL.Variant({
    'ok' : IDL.Vec(NeuronAllocationChangeBlockData),
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
  const DAONeuronAllocationArchive = IDL.Service({
    'archiveNeuronAllocationChange' : IDL.Func(
        [NeuronAllocationChangeBlockData],
        [Result_2],
        [],
      ),
    'getArchiveStats' : IDL.Func([], [Result_1], []),
    'getNeuronAllocationChangesByMaker' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result],
        ['query'],
      ),
    'getNeuronAllocationChangesByNeuron' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Nat],
        [Result],
        ['query'],
      ),
    'getNeuronAllocationChangesByNeuronInTimeRange' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Int, IDL.Int, IDL.Nat],
        [Result],
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
  });
  return DAONeuronAllocationArchive;
};
export const init = ({ IDL }) => { return []; };
