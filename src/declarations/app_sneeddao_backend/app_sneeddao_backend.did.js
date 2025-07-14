export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const PartnerLink = IDL.Record({ 'url' : IDL.Text, 'title' : IDL.Text });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const ProjectType = IDL.Variant({
    'fork' : IDL.Null,
    'product' : IDL.Null,
    'project' : IDL.Null,
  });
  const ProjectLink = IDL.Record({ 'url' : IDL.Text, 'title' : IDL.Text });
  const WhitelistedToken = IDL.Record({
    'fee' : IDL.Nat,
    'decimals' : IDL.Nat8,
    'name' : IDL.Text,
    'ledger_id' : IDL.Principal,
    'standard' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const NeuronId__1 = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const NeuronNameKey = IDL.Record({
    'sns_root_canister_id' : IDL.Principal,
    'neuron_id' : NeuronId__1,
  });
  const BanLogEntry = IDL.Record({
    'admin' : IDL.Principal,
    'user' : IDL.Principal,
    'expiry_timestamp' : IDL.Int,
    'reason' : IDL.Text,
    'ban_timestamp' : IDL.Int,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(BanLogEntry),
    'err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Int)),
    'err' : IDL.Text,
  });
  const TokenMetaValue = IDL.Variant({
    'Int' : IDL.Int,
    'Nat' : IDL.Nat,
    'Blob' : IDL.Vec(IDL.Nat8),
    'Text' : IDL.Text,
  });
  const TokenMeta = IDL.Record({
    'token0' : IDL.Vec(IDL.Tuple(IDL.Text, TokenMetaValue)),
    'token1' : IDL.Vec(IDL.Tuple(IDL.Text, TokenMetaValue)),
  });
  const NeuronId = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const PartnerLink__1 = IDL.Record({ 'url' : IDL.Text, 'title' : IDL.Text });
  const Partner = IDL.Record({
    'id' : IDL.Nat,
    'updated_at' : IDL.Int,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Int,
    'links' : IDL.Vec(PartnerLink__1),
    'logo_url' : IDL.Text,
    'index' : IDL.Opt(IDL.Nat),
  });
  const ProjectLink__1 = IDL.Record({ 'url' : IDL.Text, 'title' : IDL.Text });
  const ProjectType__1 = IDL.Variant({
    'fork' : IDL.Null,
    'product' : IDL.Null,
    'project' : IDL.Null,
  });
  const Project = IDL.Record({
    'id' : IDL.Nat,
    'updated_at' : IDL.Int,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Int,
    'links' : IDL.Vec(ProjectLink__1),
    'logo_url' : IDL.Opt(IDL.Text),
    'index' : IDL.Opt(IDL.Nat),
    'project_type' : ProjectType__1,
  });
  const Neuron = IDL.Record({
    'id' : IDL.Opt(NeuronId__1),
    'permissions' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(IDL.Int32))),
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(Neuron), 'err' : IDL.Text });
  const TxIndex = IDL.Nat;
  const Balance = IDL.Nat;
  const Timestamp = IDL.Nat64;
  const TransferError = IDL.Variant({
    'GenericError' : IDL.Record({
      'message' : IDL.Text,
      'error_code' : IDL.Nat,
    }),
    'TemporarilyUnavailable' : IDL.Null,
    'BadBurn' : IDL.Record({ 'min_burn_amount' : Balance }),
    'Duplicate' : IDL.Record({ 'duplicate_of' : TxIndex }),
    'BadFee' : IDL.Record({ 'expected_fee' : Balance }),
    'CreatedInFuture' : IDL.Record({ 'ledger_time' : Timestamp }),
    'TooOld' : IDL.Null,
    'InsufficientFunds' : IDL.Record({ 'balance' : Balance }),
  });
  const TransferResult = IDL.Variant({ 'Ok' : TxIndex, 'Err' : TransferError });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const TransferPositionError = IDL.Variant({
    'CommonError' : IDL.Null,
    'InternalError' : IDL.Text,
    'UnsupportedToken' : IDL.Text,
    'InsufficientFunds' : IDL.Null,
  });
  const TransferPositionResult = IDL.Variant({
    'ok' : IDL.Bool,
    'err' : TransferPositionError,
  });
  const AppSneedDaoBackend = IDL.Service({
    'add_admin' : IDL.Func([IDL.Principal], [], []),
    'add_blacklisted_word' : IDL.Func([IDL.Text], [Result_1], []),
    'add_partner' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(PartnerLink), IDL.Opt(IDL.Nat)],
        [Result_5],
        [],
      ),
    'add_project' : IDL.Func(
        [
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Text,
          ProjectType,
          IDL.Vec(ProjectLink),
          IDL.Opt(IDL.Nat),
        ],
        [Result_5],
        [],
      ),
    'add_whitelisted_token' : IDL.Func([WhitelistedToken], [], []),
    'ban_user' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Text], [Result_1], []),
    'caller_is_admin' : IDL.Func([], [IDL.Bool], ['query']),
    'check_ban_status' : IDL.Func([IDL.Principal], [Result_1], ['query']),
    'get_admins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_all_neuron_names' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(NeuronNameKey, IDL.Tuple(IDL.Text, IDL.Bool)))],
        ['query'],
      ),
    'get_all_neuron_nicknames' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(NeuronNameKey, IDL.Text))],
        ['query'],
      ),
    'get_all_principal_names' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Tuple(IDL.Text, IDL.Bool)))],
        ['query'],
      ),
    'get_all_principal_nicknames' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))],
        ['query'],
      ),
    'get_ban_log' : IDL.Func([], [Result_3], ['query']),
    'get_banned_users' : IDL.Func([], [Result_4], ['query']),
    'get_blacklisted_words' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'get_cached_token_meta' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(TokenMeta)],
        ['query'],
      ),
    'get_ledger_canister_ids' : IDL.Func(
        [],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'get_neuron_name' : IDL.Func(
        [IDL.Principal, NeuronId],
        [IDL.Opt(IDL.Tuple(IDL.Text, IDL.Bool))],
        ['query'],
      ),
    'get_neuron_nickname' : IDL.Func(
        [IDL.Principal, NeuronId],
        [IDL.Opt(IDL.Text)],
        ['query'],
      ),
    'get_partner' : IDL.Func([IDL.Nat], [IDL.Opt(Partner)], ['query']),
    'get_partners' : IDL.Func([], [IDL.Vec(Partner)], ['query']),
    'get_principal_name' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Tuple(IDL.Text, IDL.Bool))],
        ['query'],
      ),
    'get_principal_nickname' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Text)],
        ['query'],
      ),
    'get_project' : IDL.Func([IDL.Nat], [IDL.Opt(Project)], ['query']),
    'get_projects' : IDL.Func([], [IDL.Vec(Project)], ['query']),
    'get_swap_canister_ids' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_user_ban_history' : IDL.Func([IDL.Principal], [Result_3], ['query']),
    'get_user_neurons' : IDL.Func([], [Result_2], []),
    'get_whitelisted_tokens' : IDL.Func(
        [],
        [IDL.Vec(WhitelistedToken)],
        ['query'],
      ),
    'import_whitelist_from_swaprunner' : IDL.Func([], [], []),
    'is_token_whitelisted' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'register_ledger_canister_id' : IDL.Func([IDL.Principal], [], []),
    'register_swap_canister_id' : IDL.Func([IDL.Principal], [], []),
    'remove_admin' : IDL.Func([IDL.Principal], [], []),
    'remove_blacklisted_word' : IDL.Func([IDL.Text], [Result_1], []),
    'remove_partner' : IDL.Func([IDL.Nat], [Result_1], []),
    'remove_project' : IDL.Func([IDL.Nat], [Result_1], []),
    'remove_whitelisted_token' : IDL.Func([IDL.Principal], [], []),
    'send_tokens' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Principal],
        [TransferResult],
        [],
      ),
    'set_cached_token_meta' : IDL.Func([IDL.Principal, TokenMeta], [], []),
    'set_neuron_name' : IDL.Func(
        [IDL.Principal, NeuronId, IDL.Text],
        [Result],
        [],
      ),
    'set_neuron_nickname' : IDL.Func(
        [IDL.Principal, NeuronId, IDL.Text],
        [Result],
        [],
      ),
    'set_principal_name' : IDL.Func([IDL.Text], [Result], []),
    'set_principal_name_for' : IDL.Func(
        [IDL.Principal, IDL.Text, IDL.Opt(IDL.Principal)],
        [Result],
        [],
      ),
    'set_principal_nickname' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [Result],
        [],
      ),
    'test_calculate_ban_duration' : IDL.Func([IDL.Principal], [IDL.Nat], []),
    'transfer_position' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Nat],
        [TransferPositionResult],
        [],
      ),
    'unban_user' : IDL.Func([IDL.Principal], [Result_1], []),
    'unregister_ledger_canister_id' : IDL.Func([IDL.Principal], [], []),
    'unregister_swap_canister_id' : IDL.Func([IDL.Principal], [], []),
    'unverify_neuron_name' : IDL.Func([IDL.Principal, NeuronId], [Result], []),
    'unverify_principal_name' : IDL.Func([IDL.Principal], [Result], []),
    'update_partner' : IDL.Func(
        [
          IDL.Nat,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Vec(PartnerLink),
          IDL.Opt(IDL.Nat),
        ],
        [Result_1],
        [],
      ),
    'update_project' : IDL.Func(
        [
          IDL.Nat,
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Text,
          ProjectType,
          IDL.Vec(ProjectLink),
          IDL.Opt(IDL.Nat),
        ],
        [Result_1],
        [],
      ),
    'verify_neuron_name' : IDL.Func([IDL.Principal, NeuronId], [Result], []),
    'verify_principal_name' : IDL.Func([IDL.Principal], [Result], []),
  });
  return AppSneedDaoBackend;
};
export const init = ({ IDL }) => { return []; };
