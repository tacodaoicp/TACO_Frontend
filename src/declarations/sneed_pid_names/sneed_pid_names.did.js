export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const AvatarRef = IDL.Variant({
    'url' : IDL.Text,
    'blob' : IDL.Vec(IDL.Nat8),
  });
  const ImportItem = IDL.Record({
    'principal' : IDL.Principal,
    'verified' : IDL.Bool,
    'name' : IDL.Text,
    'avatar' : IDL.Opt(AvatarRef),
  });
  const ImportResult = IDL.Record({
    'result' : Result,
    'principal' : IDL.Principal,
  });
  const Config = IDL.Record({
    'moderator' : IDL.Opt(IDL.Principal),
    'max_hotkeys' : IDL.Nat,
    'sns_wasm' : IDL.Principal,
    'archive_controllers' : IDL.Vec(IDL.Principal),
    'dao_governance' : IDL.Principal,
    'max_members' : IDL.Nat,
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
  const AccountId = IDL.Nat;
  const ChangeRef = IDL.Variant({
    'canister' : IDL.Principal,
    'account' : AccountId,
  });
  const RunBy = IDL.Record({
    'name' : IDL.Opt(IDL.Text),
    'account' : AccountId,
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
  const CanisterView = IDL.Record({
    'updated_at' : IDL.Nat64,
    'verified' : IDL.Bool,
    'run_by' : IDL.Opt(RunBy),
    'name' : IDL.Text,
    'set_by' : IDL.Principal,
    'canister' : IDL.Principal,
    'verification' : IDL.Opt(Verification),
    'avatar' : IDL.Opt(AvatarRef),
  });
  const LinkProof = IDL.Variant({
    'import' : IDL.Null,
    'neuron_stake' : IDL.Record({
      'memo' : IDL.Nat64,
      'sns_root' : IDL.Principal,
      'neuron_id' : IDL.Vec(IDL.Nat8),
    }),
    'admin' : IDL.Null,
    'self' : IDL.Null,
    'hotkey' : IDL.Null,
  });
  const DappId = IDL.Nat;
  const Role = IDL.Variant({ 'member' : IDL.Null, 'owner' : IDL.Null });
  const Member = IDL.Record({
    'via' : LinkProof,
    'principal' : IDL.Principal,
    'dapp' : IDL.Opt(DappId),
    'role' : Role,
    'linked_at' : IDL.Nat64,
  });
  const AccountView = IDL.Record({
    'id' : AccountId,
    'updated_at' : IDL.Nat64,
    'verified' : IDL.Bool,
    'members' : IDL.Vec(Member),
    'name' : IDL.Opt(IDL.Text),
    'hotkeys' : IDL.Vec(IDL.Principal),
    'created_at' : IDL.Nat64,
    'verification' : IDL.Opt(Verification),
    'avatar' : IDL.Opt(AvatarRef),
  });
  const Change = IDL.Record({
    'ref' : ChangeRef,
    'seq' : IDL.Nat,
    'state' : IDL.Opt(
      IDL.Variant({ 'canister' : CanisterView, 'account' : AccountView })
    ),
  });
  const LogEntry = IDL.Record({
    'id' : IDL.Nat,
    'ts' : IDL.Int,
    'cid' : IDL.Nat,
    'level' : IDL.Variant({ 'info' : IDL.Null, 'error' : IDL.Null }),
    'message' : IDL.Text,
    'caller' : IDL.Principal,
  });
  const NameInfo = IDL.Record({
    'verified' : IDL.Bool,
    'run_by' : IDL.Opt(RunBy),
    'dapp' : IDL.Opt(DappId),
    'kind' : IDL.Variant({ 'canister' : IDL.Null, 'account' : AccountId }),
    'name' : IDL.Opt(IDL.Text),
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
  const Page = IDL.Record({
    'start_after' : IDL.Opt(IDL.Text),
    'limit' : IDL.Nat,
  });
  const SearchHit = IDL.Record({
    'verified' : IDL.Bool,
    'name' : IDL.Text,
    'target' : IDL.Variant({
      'canister' : IDL.Principal,
      'account' : IDL.Record({
        'id' : AccountId,
        'members' : IDL.Vec(
          IDL.Record({ 'principal' : IDL.Principal, 'dapp' : IDL.Opt(DappId) })
        ),
      }),
    }),
    'avatar' : IDL.Opt(AvatarRef),
  });
  const Stats = IDL.Record({
    'accounts' : IDL.Nat,
    'named' : IDL.Nat,
    'canisters' : IDL.Nat,
    'log_length' : IDL.Nat,
    'import_closed' : IDL.Bool,
    'last_seq' : IDL.Nat,
  });
  const ValidationResult = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const SneedPidNames = IDL.Service({
    'add_hotkey' : IDL.Func([IDL.Principal], [Result], []),
    'admin_add_admin' : IDL.Func([IDL.Principal], [Result], []),
    'admin_clear_avatar' : IDL.Func([IDL.Principal], [Result], []),
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
    'admin_set_name' : IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    'changes_since' : IDL.Func(
        [IDL.Record({ 'after' : IDL.Nat, 'limit' : IDL.Nat })],
        [IDL.Record({ 'items' : IDL.Vec(Change), 'last_seq' : IDL.Nat })],
        ['query'],
      ),
    'get_account' : IDL.Func([AccountId], [IDL.Opt(AccountView)], ['query']),
    'get_account_of' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(AccountView)],
        ['query'],
      ),
    'get_admins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_canister_name' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(CanisterView)],
        ['query'],
      ),
    'get_config' : IDL.Func([], [Config], ['query']),
    'get_log' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'get_name' : IDL.Func([IDL.Principal], [IDL.Opt(NameInfo)], ['query']),
    'get_names' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [IDL.Vec(IDL.Opt(NameInfo))],
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
    'link_by_neuron' : IDL.Func(
        [
          IDL.Principal,
          IDL.Vec(IDL.Nat8),
          IDL.Nat64,
          IDL.Principal,
          IDL.Opt(DappId),
        ],
        [Result],
        [],
      ),
    'list_names' : IDL.Func(
        [Page],
        [
          IDL.Record({
            'next' : IDL.Opt(IDL.Text),
            'items' : IDL.Vec(SearchHit),
          }),
        ],
        ['query'],
      ),
    'merge_account' : IDL.Func([AccountId], [Result], []),
    'my_hotkey_accounts' : IDL.Func([], [IDL.Vec(AccountView)], ['query']),
    'remove_hotkey' : IDL.Func([AccountId, IDL.Principal], [Result], []),
    'remove_member' : IDL.Func([IDL.Principal], [Result], []),
    'search' : IDL.Func(
        [
          IDL.Record({
            'kind' : IDL.Opt(
              IDL.Variant({ 'canister' : IDL.Null, 'account' : IDL.Null })
            ),
            'limit' : IDL.Nat,
            'prefix' : IDL.Text,
          }),
        ],
        [IDL.Vec(SearchHit)],
        ['query'],
      ),
    'set_account_avatar' : IDL.Func(
        [AccountId, IDL.Opt(AvatarRef)],
        [Result],
        [],
      ),
    'set_account_name' : IDL.Func([AccountId, IDL.Text], [Result], []),
    'set_canister_avatar' : IDL.Func(
        [IDL.Principal, IDL.Opt(AvatarRef)],
        [Result],
        [],
      ),
    'set_canister_name' : IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    'set_canister_run_by' : IDL.Func(
        [IDL.Principal, IDL.Opt(AccountId)],
        [Result],
        [],
      ),
    'set_member' : IDL.Func(
        [IDL.Principal, Role, IDL.Opt(DappId)],
        [Result],
        [],
      ),
    'set_my_avatar' : IDL.Func([IDL.Opt(AvatarRef)], [Result], []),
    'set_my_name' : IDL.Func([IDL.Text], [Result], []),
    'stats' : IDL.Func([], [Stats], ['query']),
    'unverify' : IDL.Func([IDL.Principal], [Result], []),
    'unverify_by_dao' : IDL.Func([IDL.Principal], [], []),
    'validate_unverify_by_dao' : IDL.Func(
        [IDL.Principal],
        [ValidationResult],
        ['query'],
      ),
    'validate_verify_by_dao' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [ValidationResult],
        ['query'],
      ),
    'verify' : IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    'verify_by_dao' : IDL.Func([IDL.Principal, IDL.Text], [], []),
  });
  return SneedPidNames;
};
export const init = ({ IDL }) => { return []; };
