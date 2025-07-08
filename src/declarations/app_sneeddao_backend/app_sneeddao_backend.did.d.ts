import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AppSneedDaoBackend {
  'add_admin' : ActorMethod<[Principal], undefined>,
  'add_blacklisted_word' : ActorMethod<[string], Result_1>,
  'add_partner' : ActorMethod<
    [string, string, string, Array<PartnerLink>, [] | [bigint]],
    Result_5
  >,
  'add_project' : ActorMethod<
    [
      string,
      [] | [string],
      string,
      ProjectType,
      Array<ProjectLink>,
      [] | [bigint],
    ],
    Result_5
  >,
  'add_whitelisted_token' : ActorMethod<[WhitelistedToken], undefined>,
  'ban_user' : ActorMethod<[Principal, bigint, string], Result_1>,
  'caller_is_admin' : ActorMethod<[], boolean>,
  'check_ban_status' : ActorMethod<[Principal], Result_1>,
  'get_admins' : ActorMethod<[], Array<Principal>>,
  'get_all_neuron_names' : ActorMethod<
    [],
    Array<[NeuronNameKey, [string, boolean]]>
  >,
  'get_all_neuron_nicknames' : ActorMethod<[], Array<[NeuronNameKey, string]>>,
  'get_all_principal_names' : ActorMethod<
    [],
    Array<[Principal, [string, boolean]]>
  >,
  'get_all_principal_nicknames' : ActorMethod<[], Array<[Principal, string]>>,
  'get_ban_log' : ActorMethod<[], Result_3>,
  'get_banned_users' : ActorMethod<[], Result_4>,
  'get_blacklisted_words' : ActorMethod<[], Array<string>>,
  'get_cached_token_meta' : ActorMethod<[Principal], [] | [TokenMeta]>,
  'get_ledger_canister_ids' : ActorMethod<[], Array<Principal>>,
  'get_neuron_name' : ActorMethod<
    [Principal, NeuronId],
    [] | [[string, boolean]]
  >,
  'get_neuron_nickname' : ActorMethod<[Principal, NeuronId], [] | [string]>,
  'get_partner' : ActorMethod<[bigint], [] | [Partner]>,
  'get_partners' : ActorMethod<[], Array<Partner>>,
  'get_principal_name' : ActorMethod<[Principal], [] | [[string, boolean]]>,
  'get_principal_nickname' : ActorMethod<[Principal], [] | [string]>,
  'get_project' : ActorMethod<[bigint], [] | [Project]>,
  'get_projects' : ActorMethod<[], Array<Project>>,
  'get_swap_canister_ids' : ActorMethod<[], Array<Principal>>,
  'get_user_ban_history' : ActorMethod<[Principal], Result_3>,
  'get_user_neurons' : ActorMethod<[], Result_2>,
  'get_whitelisted_tokens' : ActorMethod<[], Array<WhitelistedToken>>,
  'import_whitelist_from_swaprunner' : ActorMethod<[], undefined>,
  'is_token_whitelisted' : ActorMethod<[Principal], boolean>,
  'register_ledger_canister_id' : ActorMethod<[Principal], undefined>,
  'register_swap_canister_id' : ActorMethod<[Principal], undefined>,
  'remove_admin' : ActorMethod<[Principal], undefined>,
  'remove_blacklisted_word' : ActorMethod<[string], Result_1>,
  'remove_partner' : ActorMethod<[bigint], Result_1>,
  'remove_project' : ActorMethod<[bigint], Result_1>,
  'remove_whitelisted_token' : ActorMethod<[Principal], undefined>,
  'send_tokens' : ActorMethod<[Principal, bigint, Principal], TransferResult>,
  'set_cached_token_meta' : ActorMethod<[Principal, TokenMeta], undefined>,
  'set_neuron_name' : ActorMethod<[Principal, NeuronId, string], Result>,
  'set_neuron_nickname' : ActorMethod<[Principal, NeuronId, string], Result>,
  'set_principal_name' : ActorMethod<[string], Result>,
  'set_principal_name_for' : ActorMethod<
    [Principal, string, [] | [Principal]],
    Result
  >,
  'set_principal_nickname' : ActorMethod<[Principal, string], Result>,
  'test_calculate_ban_duration' : ActorMethod<[Principal], bigint>,
  'transfer_position' : ActorMethod<
    [Principal, Principal, bigint],
    TransferPositionResult
  >,
  'unban_user' : ActorMethod<[Principal], Result_1>,
  'unregister_ledger_canister_id' : ActorMethod<[Principal], undefined>,
  'unregister_swap_canister_id' : ActorMethod<[Principal], undefined>,
  'unverify_neuron_name' : ActorMethod<[Principal, NeuronId], Result>,
  'unverify_principal_name' : ActorMethod<[Principal], Result>,
  'update_partner' : ActorMethod<
    [bigint, string, string, string, Array<PartnerLink>, [] | [bigint]],
    Result_1
  >,
  'update_project' : ActorMethod<
    [
      bigint,
      string,
      [] | [string],
      string,
      ProjectType,
      Array<ProjectLink>,
      [] | [bigint],
    ],
    Result_1
  >,
  'verify_neuron_name' : ActorMethod<[Principal, NeuronId], Result>,
  'verify_principal_name' : ActorMethod<[Principal], Result>,
}
export type Balance = bigint;
export interface BanLogEntry {
  'admin' : Principal,
  'user' : Principal,
  'expiry_timestamp' : bigint,
  'reason' : string,
  'ban_timestamp' : bigint,
}
export interface Neuron {
  'id' : [] | [NeuronId__1],
  'permissions' : Array<[Principal, Int32Array | number[]]>,
}
export interface NeuronId { 'id' : Uint8Array | number[] }
export interface NeuronId__1 { 'id' : Uint8Array | number[] }
export interface NeuronNameKey {
  'sns_root_canister_id' : Principal,
  'neuron_id' : NeuronId__1,
}
export interface Partner {
  'id' : bigint,
  'updated_at' : bigint,
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'links' : Array<PartnerLink__1>,
  'logo_url' : string,
  'index' : [] | [bigint],
}
export interface PartnerLink { 'url' : string, 'title' : string }
export interface PartnerLink__1 { 'url' : string, 'title' : string }
export interface Project {
  'id' : bigint,
  'updated_at' : bigint,
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'links' : Array<ProjectLink__1>,
  'logo_url' : [] | [string],
  'index' : [] | [bigint],
  'project_type' : ProjectType__1,
}
export interface ProjectLink { 'url' : string, 'title' : string }
export interface ProjectLink__1 { 'url' : string, 'title' : string }
export type ProjectType = { 'fork' : null } |
  { 'product' : null } |
  { 'project' : null };
export type ProjectType__1 = { 'fork' : null } |
  { 'product' : null } |
  { 'project' : null };
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<Neuron> } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<BanLogEntry> } |
  { 'err' : string };
export type Result_4 = { 'ok' : Array<[Principal, bigint]> } |
  { 'err' : string };
export type Result_5 = { 'ok' : bigint } |
  { 'err' : string };
export type Timestamp = bigint;
export interface TokenMeta {
  'token0' : Array<[string, TokenMetaValue]>,
  'token1' : Array<[string, TokenMetaValue]>,
}
export type TokenMetaValue = { 'Int' : bigint } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string };
export type TransferError = {
    'GenericError' : { 'message' : string, 'error_code' : bigint }
  } |
  { 'TemporarilyUnavailable' : null } |
  { 'BadBurn' : { 'min_burn_amount' : Balance } } |
  { 'Duplicate' : { 'duplicate_of' : TxIndex } } |
  { 'BadFee' : { 'expected_fee' : Balance } } |
  { 'CreatedInFuture' : { 'ledger_time' : Timestamp } } |
  { 'TooOld' : null } |
  { 'InsufficientFunds' : { 'balance' : Balance } };
export type TransferPositionError = { 'CommonError' : null } |
  { 'InternalError' : string } |
  { 'UnsupportedToken' : string } |
  { 'InsufficientFunds' : null };
export type TransferPositionResult = { 'ok' : boolean } |
  { 'err' : TransferPositionError };
export type TransferResult = { 'Ok' : TxIndex } |
  { 'Err' : TransferError };
export type TxIndex = bigint;
export interface WhitelistedToken {
  'fee' : bigint,
  'decimals' : number,
  'name' : string,
  'ledger_id' : Principal,
  'standard' : string,
  'symbol' : string,
}
export interface _SERVICE extends AppSneedDaoBackend {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
