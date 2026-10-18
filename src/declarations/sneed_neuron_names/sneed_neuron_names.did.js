export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const NeuronKey = IDL.Record({
    'sns_root' : IDL.Principal,
    'neuron_id' : IDL.Vec(IDL.Nat8),
  });
  const ImportItem = IDL.Record({
    'verified' : IDL.Bool,
    'name' : IDL.Text,
    'sns_root' : IDL.Principal,
    'neuron_id' : IDL.Vec(IDL.Nat8),
  });
  const ImportResult = IDL.Record({ 'key' : NeuronKey, 'result' : Result });
  const Config = IDL.Record({
    'moderator' : IDL.Opt(IDL.Principal),
    'sns_wasm' : IDL.Principal,
    'archive_controllers' : IDL.Vec(IDL.Principal),
    'dao_governance' : IDL.Principal,
  });
  const SettingsUpdate = IDL.Record({
    'archive_top_up_threshold' : IDL.Opt(IDL.Nat),
    'archive_max_blocks' : IDL.Opt(IDL.Nat),
    'max_live_blocks' : IDL.Opt(IDL.Nat),
    'archive_initial_cycles' : IDL.Opt(IDL.Nat),
    'spill_batch_size' : IDL.Opt(IDL.Nat),
    'archive_top_up_amount' : IDL.Opt(IDL.Nat),
  });
  const Settings = IDL.Record({
    'archive_top_up_threshold' : IDL.Nat,
    'archive_max_blocks' : IDL.Nat,
    'max_live_blocks' : IDL.Nat,
    'archive_initial_cycles' : IDL.Nat,
    'spill_batch_size' : IDL.Nat,
    'archive_top_up_amount' : IDL.Nat,
  });
  const VerifySource = IDL.Variant({
    'dao' : IDL.Null,
    'import' : IDL.Null,
    'admin' : IDL.Principal,
    'sns_governance' : IDL.Principal,
  });
  const Verification = IDL.Record({
    'at' : IDL.Nat64,
    'source' : VerifySource,
    'name' : IDL.Text,
  });
  const AvatarRef = IDL.Variant({
    'url' : IDL.Text,
    'blob' : IDL.Vec(IDL.Nat8),
  });
  const NeuronNameView = IDL.Record({
    'updated_at' : IDL.Nat64,
    'verified' : IDL.Bool,
    'name' : IDL.Text,
    'set_by' : IDL.Principal,
    'sns_root' : IDL.Principal,
    'verification' : IDL.Opt(Verification),
    'avatar' : IDL.Opt(AvatarRef),
    'neuron_id' : IDL.Vec(IDL.Nat8),
  });
  const Change = IDL.Record({
    'key' : NeuronKey,
    'seq' : IDL.Nat,
    'state' : IDL.Opt(NeuronNameView),
  });
  const LogEntry = IDL.Record({
    'id' : IDL.Nat,
    'ts' : IDL.Int,
    'cid' : IDL.Nat,
    'level' : IDL.Variant({ 'info' : IDL.Null, 'error' : IDL.Null }),
    'message' : IDL.Text,
    'caller' : IDL.Principal,
  });
  const NeuronNameInfo = IDL.Record({
    'verified' : IDL.Bool,
    'name' : IDL.Text,
    'avatar' : IDL.Opt(AvatarRef),
  });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const GetArchivesArgs = IDL.Record({ 'from' : IDL.Opt(IDL.Principal) });
  const ArchiveRange = IDL.Record({
    'end' : IDL.Nat,
    'canister_id' : IDL.Principal,
    'start' : IDL.Nat,
  });
  const GetArchivesResult = IDL.Vec(ArchiveRange);
  const BlockRange = IDL.Record({ 'start' : IDL.Nat, 'length' : IDL.Nat });
  const GetBlocksArgs = IDL.Vec(BlockRange);
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
  const ArchivedBlocks = IDL.Record({
    'args' : GetBlocksArgs,
    'callback' : IDL.Func([GetBlocksArgs], [GetBlocksResult], ['query']),
  });
  GetBlocksResult.fill(
    IDL.Record({
      'log_length' : IDL.Nat,
      'blocks' : IDL.Vec(Block),
      'archived_blocks' : IDL.Vec(ArchivedBlocks),
    })
  );
  const DataCertificate = IDL.Record({
    'certificate' : IDL.Vec(IDL.Nat8),
    'hash_tree' : IDL.Vec(IDL.Nat8),
  });
  const ArchiveInfo = IDL.Record({
    'canister_id' : IDL.Principal,
    'start' : IDL.Nat,
    'length' : IDL.Nat,
    'max_blocks' : IDL.Nat,
  });
  const LogStatus = IDL.Record({
    'live_blocks' : IDL.Nat,
    'live_first_index' : IDL.Nat,
    'history_imported' : IDL.Bool,
    'spilling' : IDL.Bool,
    'settings' : Settings,
    'log_length' : IDL.Nat,
    'last_block_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'archives' : IDL.Vec(ArchiveInfo),
  });
  const BlockType = IDL.Record({ 'url' : IDL.Text, 'block_type' : IDL.Text });
  const Stats = IDL.Record({
    'snses' : IDL.Nat,
    'names' : IDL.Nat,
    'log_length' : IDL.Nat,
    'import_closed' : IDL.Bool,
    'last_seq' : IDL.Nat,
  });
  const ValidationResult = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const SneedNeuronNames = IDL.Service({
    'admin_add_admin' : IDL.Func([IDL.Principal], [Result], []),
    'admin_clear_avatar' : IDL.Func([NeuronKey], [Result], []),
    'admin_finish_import' : IDL.Func([], [Result], []),
    'admin_icrc3_repair_archive_controllers' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Principal,
              IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text }),
            )
          ),
        ],
        [],
      ),
    'admin_icrc3_spill_now' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : IDL.Text })],
        [],
      ),
    'admin_import_names' : IDL.Func(
        [IDL.Vec(ImportItem)],
        [IDL.Vec(ImportResult)],
        [],
      ),
    'admin_remove_admin' : IDL.Func([IDL.Principal], [Result], []),
    'admin_set_config' : IDL.Func([Config], [Result], []),
    'admin_set_icrc3_settings' : IDL.Func(
        [SettingsUpdate],
        [IDL.Variant({ 'Ok' : Settings, 'Err' : IDL.Text })],
        [],
      ),
    'admin_set_name' : IDL.Func([NeuronKey, IDL.Text], [Result], []),
    'changes_since' : IDL.Func(
        [IDL.Record({ 'after' : IDL.Nat, 'limit' : IDL.Nat })],
        [IDL.Record({ 'items' : IDL.Vec(Change), 'last_seq' : IDL.Nat })],
        ['query'],
      ),
    'get_admins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_config' : IDL.Func([], [Config], ['query']),
    'get_log' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'get_name' : IDL.Func([NeuronKey], [IDL.Opt(NeuronNameView)], ['query']),
    'get_names' : IDL.Func(
        [IDL.Vec(NeuronKey)],
        [IDL.Vec(IDL.Opt(NeuronNameInfo))],
        ['query'],
      ),
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
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
    'icrc3_log_status' : IDL.Func([], [LogStatus], ['query']),
    'icrc3_supported_block_types' : IDL.Func(
        [],
        [IDL.Vec(BlockType)],
        ['query'],
      ),
    'list_by_sns' : IDL.Func(
        [
          IDL.Record({
            'start_after' : IDL.Opt(IDL.Text),
            'limit' : IDL.Nat,
            'sns_root' : IDL.Principal,
          }),
        ],
        [
          IDL.Record({
            'next' : IDL.Opt(IDL.Text),
            'items' : IDL.Vec(NeuronNameView),
          }),
        ],
        ['query'],
      ),
    'search' : IDL.Func(
        [
          IDL.Record({
            'limit' : IDL.Nat,
            'sns_root' : IDL.Principal,
            'prefix' : IDL.Text,
          }),
        ],
        [IDL.Vec(NeuronNameView)],
        ['query'],
      ),
    'set_avatar' : IDL.Func([NeuronKey, IDL.Opt(AvatarRef)], [Result], []),
    'set_name' : IDL.Func([NeuronKey, IDL.Text], [Result], []),
    'stats' : IDL.Func([], [Stats], ['query']),
    'unverify' : IDL.Func([NeuronKey], [Result], []),
    'unverify_by_dao' : IDL.Func([NeuronKey], [], []),
    'unverify_by_sns' : IDL.Func([NeuronKey], [Result], []),
    'validate_unverify_by_dao' : IDL.Func(
        [NeuronKey],
        [ValidationResult],
        ['query'],
      ),
    'validate_verify_by_dao' : IDL.Func(
        [NeuronKey, IDL.Text],
        [ValidationResult],
        ['query'],
      ),
    'verify' : IDL.Func([NeuronKey, IDL.Text], [Result], []),
    'verify_by_dao' : IDL.Func([NeuronKey, IDL.Text], [], []),
    'verify_by_sns' : IDL.Func([NeuronKey, IDL.Text], [Result], []),
  });
  return SneedNeuronNames;
};
export const init = ({ IDL }) => { return []; };
