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
  const AllocationChangeBlockData = IDL.Record({
    'id' : IDL.Nat,
    'maker' : IDL.Principal,
    'oldAllocations' : IDL.Vec(Allocation),
    'changeType' : AllocationChangeType,
    'votingPower' : IDL.Nat,
    'newAllocations' : IDL.Vec(Allocation),
    'user' : IDL.Principal,
    'timestamp' : IDL.Int,
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
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ArchiveError });
  const FollowActionType = IDL.Variant({
    'Follow' : IDL.Null,
    'Unfollow' : IDL.Null,
  });
  const FollowActionBlockData = IDL.Record({
    'id' : IDL.Nat,
    'previousFollowCount' : IDL.Nat,
    'action' : FollowActionType,
    'followed' : IDL.Principal,
    'follower' : IDL.Principal,
    'timestamp' : IDL.Int,
    'newFollowCount' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Vec(AllocationChangeBlockData),
    'err' : ArchiveError,
  });
  const Result_1 = IDL.Variant({
    'ok' : IDL.Vec(FollowActionBlockData),
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
  const DAOAllocationArchive = IDL.Service({
    'archiveAllocationChange' : IDL.Func(
        [AllocationChangeBlockData],
        [Result_3],
        [],
      ),
    'archiveFollowAction' : IDL.Func([FollowActionBlockData], [Result_3], []),
    'getAllocationChangesByToken' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_2],
        ['query'],
      ),
    'getAllocationChangesByUser' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_2],
        ['query'],
      ),
    'getArchiveStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalFollowActions' : IDL.Nat,
            'totalBlocks' : IDL.Nat,
            'totalFollowCount' : IDL.Nat,
            'totalUnfollowCount' : IDL.Nat,
            'totalAllocationChanges' : IDL.Nat,
            'lastImportedAllocationTimestamp' : IDL.Int,
            'lastImportedFollowTimestamp' : IDL.Int,
          }),
        ],
        ['query'],
      ),
    'getFollowActionsByUser' : IDL.Func(
        [IDL.Principal, IDL.Nat],
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
    'importAllocationChanges' : IDL.Func([], [Result], []),
    'importFollowActions' : IDL.Func([], [Result], []),
  });
  return DAOAllocationArchive;
};
export const init = ({ IDL }) => { return []; };
