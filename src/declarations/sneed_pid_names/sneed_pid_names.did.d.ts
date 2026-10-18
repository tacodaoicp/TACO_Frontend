import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AccountId = bigint;
export interface AccountView {
  'id' : AccountId,
  'updated_at' : bigint,
  'verified' : boolean,
  'members' : Array<Member>,
  'name' : [] | [string],
  'hotkeys' : Array<Principal>,
  'created_at' : bigint,
  'verification' : [] | [Verification],
  'avatar' : [] | [AvatarRef],
}
export interface ArchiveInfo {
  'canister_id' : Principal,
  'start' : bigint,
  'length' : bigint,
  'max_blocks' : bigint,
}
export interface ArchiveRange {
  'end' : bigint,
  'canister_id' : Principal,
  'start' : bigint,
}
export interface ArchivedBlocks {
  'args' : GetBlocksArgs,
  'callback' : [Principal, string],
}
export type AvatarRef = { 'url' : string } |
  { 'blob' : Uint8Array | number[] };
export interface Block { 'id' : bigint, 'block' : Value }
export interface BlockRange { 'start' : bigint, 'length' : bigint }
export interface BlockType { 'url' : string, 'block_type' : string }
export interface CanisterView {
  'updated_at' : bigint,
  'verified' : boolean,
  'run_by' : [] | [RunBy],
  'name' : string,
  'set_by' : Principal,
  'canister' : Principal,
  'verification' : [] | [Verification],
  'avatar' : [] | [AvatarRef],
}
export interface Change {
  'ref' : ChangeRef,
  'seq' : bigint,
  'state' : [] | [{ 'canister' : CanisterView } | { 'account' : AccountView }],
}
export type ChangeRef = { 'canister' : Principal } |
  { 'account' : AccountId };
export interface Config {
  'moderator' : [] | [Principal],
  'max_hotkeys' : bigint,
  'sns_wasm' : Principal,
  'archive_controllers' : Array<Principal>,
  'dao_governance' : Principal,
  'max_members' : bigint,
}
export type DappId = bigint;
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export interface GetArchivesArgs { 'from' : [] | [Principal] }
export type GetArchivesResult = Array<ArchiveRange>;
export type GetBlocksArgs = Array<BlockRange>;
export interface GetBlocksResult {
  'log_length' : bigint,
  'blocks' : Array<Block>,
  'archived_blocks' : Array<ArchivedBlocks>,
}
export interface ImportItem {
  'principal' : Principal,
  'verified' : boolean,
  'name' : string,
  'avatar' : [] | [AvatarRef],
}
export interface ImportResult { 'result' : Result, 'principal' : Principal }
export type LinkProof = { 'import' : null } |
  {
    'neuron_stake' : {
      'memo' : bigint,
      'sns_root' : Principal,
      'neuron_id' : Uint8Array | number[],
    }
  } |
  { 'admin' : null } |
  { 'self' : null } |
  { 'hotkey' : null };
export interface LogEntry {
  'id' : bigint,
  'ts' : bigint,
  'cid' : bigint,
  'level' : { 'info' : null } |
    { 'error' : null },
  'message' : string,
  'caller' : Principal,
}
export interface LogStatus {
  'live_blocks' : bigint,
  'live_first_index' : bigint,
  'history_imported' : boolean,
  'spilling' : boolean,
  'settings' : Settings,
  'log_length' : bigint,
  'last_block_hash' : [] | [Uint8Array | number[]],
  'archives' : Array<ArchiveInfo>,
}
export interface Member {
  'via' : LinkProof,
  'principal' : Principal,
  'dapp' : [] | [DappId],
  'role' : Role,
  'linked_at' : bigint,
}
export interface NameInfo {
  'verified' : boolean,
  'run_by' : [] | [RunBy],
  'dapp' : [] | [DappId],
  'kind' : { 'canister' : null } |
    { 'account' : AccountId },
  'name' : [] | [string],
  'avatar' : [] | [AvatarRef],
}
export interface Page { 'start_after' : [] | [string], 'limit' : bigint }
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Role = { 'member' : null } |
  { 'owner' : null };
export interface RunBy { 'name' : [] | [string], 'account' : AccountId }
export interface SearchHit {
  'verified' : boolean,
  'name' : string,
  'target' : { 'canister' : Principal } |
    {
      'account' : {
        'id' : AccountId,
        'members' : Array<{ 'principal' : Principal, 'dapp' : [] | [DappId] }>,
      }
    },
  'avatar' : [] | [AvatarRef],
}
export interface Settings {
  'archive_top_up_threshold' : bigint,
  'archive_max_blocks' : bigint,
  'max_live_blocks' : bigint,
  'archive_initial_cycles' : bigint,
  'spill_batch_size' : bigint,
  'archive_top_up_amount' : bigint,
}
export interface SettingsUpdate {
  'archive_top_up_threshold' : [] | [bigint],
  'archive_max_blocks' : [] | [bigint],
  'max_live_blocks' : [] | [bigint],
  'archive_initial_cycles' : [] | [bigint],
  'spill_batch_size' : [] | [bigint],
  'archive_top_up_amount' : [] | [bigint],
}
export interface SneedPidNames {
  /**
   * / Give a principal a hotkey on your account: it may then manage the account (rename it, change
   * / its avatar, its principals' labels) and merge it into its own account, which makes your
   * / principal show that account's name. The hotkey needs to do nothing to accept. It is not shown
   * / as one of the account's principals.
   */
  'add_hotkey' : ActorMethod<[Principal], Result>,
  'admin_add_admin' : ActorMethod<[Principal], Result>,
  /**
   * / Remove an abusive avatar.
   */
  'admin_clear_avatar' : ActorMethod<[Principal], Result>,
  /**
   * / Close the import for good.
   */
  'admin_finish_import' : ActorMethod<[], Result>,
  'admin_icrc3_repair_archive_controllers' : ActorMethod<
    [],
    Array<[Principal, { 'Ok' : null } | { 'Err' : string }]>
  >,
  'admin_icrc3_spill_now' : ActorMethod<
    [],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  /**
   * / Import names: self-authenticating principals become one-owner accounts, canister ids become
   * / canister names. A verified flag becomes an import verification of the name as imported.
   * / An account may be imported with an avatar and an empty name.
   */
  'admin_import_names' : ActorMethod<[Array<ImportItem>], Array<ImportResult>>,
  'admin_remove_admin' : ActorMethod<[Principal], Result>,
  'admin_set_config' : ActorMethod<[Config], Result>,
  'admin_set_icrc3_settings' : ActorMethod<
    [SettingsUpdate],
    { 'Ok' : Settings } |
      { 'Err' : string }
  >,
  /**
   * / Set the name of a principal's account (created if needed) or of a canister. No moderation.
   */
  'admin_set_name' : ActorMethod<[Principal, string], Result>,
  /**
   * / Pending invites for the caller.
   * / What changed after sequence number `after`, oldest first: each entity once, with its current
   * / state (null when deleted). Page through with the last item's seq; empty when caught up.
   */
  'changes_since' : ActorMethod<
    [{ 'after' : bigint, 'limit' : bigint }],
    { 'items' : Array<Change>, 'last_seq' : bigint }
  >,
  'get_account' : ActorMethod<[AccountId], [] | [AccountView]>,
  'get_account_of' : ActorMethod<[Principal], [] | [AccountView]>,
  'get_admins' : ActorMethod<[], Array<Principal>>,
  'get_canister_name' : ActorMethod<[Principal], [] | [CanisterView]>,
  'get_config' : ActorMethod<[], Config>,
  'get_log' : ActorMethod<[bigint, bigint], Array<LogEntry>>,
  'get_name' : ActorMethod<[Principal], [] | [NameInfo]>,
  /**
   * / Names of up to 500 principals, in order (null: no name or avatar).
   */
  'get_names' : ActorMethod<[Array<Principal>], Array<[] | [NameInfo]>>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_log_status' : ActorMethod<[], LogStatus>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  /**
   * / Link a principal that staked an SNS neuron you have a permission on (it gave you a hotkey).
   * / The neuron's id must be the staking subaccount of `principal` with `memo`, which proves that
   * / principal created the neuron; it must still hold ManagePrincipals on it.
   * / For principals you cannot sign in with here (e.g. your NNS dapp principal).
   */
  'link_by_neuron' : ActorMethod<
    [Principal, Uint8Array | number[], bigint, Principal, [] | [DappId]],
    Result
  >,
  /**
   * / All names in alphabetical (lowercase) order, a page at a time.
   */
  'list_names' : ActorMethod<
    [Page],
    { 'next' : [] | [string], 'items' : Array<SearchHit> }
  >,
  /**
   * / Merge an account you have a hotkey on (or own) into your own: its principals join your account
   * / as members and show its name from then on. If your account has no name it takes the merged
   * / account's name (and checkmark); otherwise the merged account's name is freed. The merged
   * / account and its hotkeys are deleted.
   */
  'merge_account' : ActorMethod<[AccountId], Result>,
  /**
   * / The accounts the caller may manage as a hotkey.
   */
  'my_hotkey_accounts' : ActorMethod<[], Array<AccountView>>,
  /**
   * / Owners remove a hotkey from their account; a hotkey may remove itself.
   */
  'remove_hotkey' : ActorMethod<[AccountId, Principal], Result>,
  /**
   * / Remove a principal from an account you manage (hotkeys cannot remove owners), or leave it
   * / (the principal itself). The last owner cannot go while others remain; when the last principal
   * / goes, the account is deleted.
   */
  'remove_member' : ActorMethod<[Principal], Result>,
  /**
   * / Accounts and canisters whose name, or a word in it, starts with `prefix`.
   */
  'search' : ActorMethod<
    [
      {
        'kind' : [] | [{ 'canister' : null } | { 'account' : null }],
        'limit' : bigint,
        'prefix' : string,
      },
    ],
    Array<SearchHit>
  >,
  /**
   * / Set or clear the avatar of an account you own or have a hotkey on.
   */
  'set_account_avatar' : ActorMethod<[AccountId, [] | [AvatarRef]], Result>,
  /**
   * / Rename an account you own or have a hotkey on ("" clears the name).
   */
  'set_account_name' : ActorMethod<[AccountId, string], Result>,
  'set_canister_avatar' : ActorMethod<[Principal, [] | [AvatarRef]], Result>,
  /**
   * / Name a canister you control ("" clears). An SNS's governance canister may name the canisters its root controls.
   */
  'set_canister_name' : ActorMethod<[Principal, string], Result>,
  /**
   * / Say which account runs a canister ("Trading Bot · run by Snassy"). The caller controls the
   * / canister and owns that account; null clears it.
   */
  'set_canister_run_by' : ActorMethod<[Principal, [] | [AccountId]], Result>,
  /**
   * / Owners set a member's role and dapp label; hotkeys and the member itself may set its dapp label.
   */
  'set_member' : ActorMethod<[Principal, Role, [] | [DappId]], Result>,
  /**
   * / Set or clear your account's avatar.
   */
  'set_my_avatar' : ActorMethod<[[] | [AvatarRef]], Result>,
  /**
   * / Set the name of your account ("" clears it). Creates the account on first use.
   */
  'set_my_name' : ActorMethod<[string], Result>,
  'stats' : ActorMethod<[], Stats>,
  'unverify' : ActorMethod<[Principal], Result>,
  'unverify_by_dao' : ActorMethod<[Principal], undefined>,
  'validate_unverify_by_dao' : ActorMethod<[Principal], ValidationResult>,
  'validate_verify_by_dao' : ActorMethod<[Principal, string], ValidationResult>,
  /**
   * / Give the checkmark to the name `expected_name` of `principal`'s account or canister.
   */
  'verify' : ActorMethod<[Principal, string], Result>,
  /**
   * / Generic nervous system function target: Sneed DAO verifies a name.
   */
  'verify_by_dao' : ActorMethod<[Principal, string], undefined>,
}
export interface Stats {
  'accounts' : bigint,
  'named' : bigint,
  'canisters' : bigint,
  'log_length' : bigint,
  'import_closed' : boolean,
  'last_seq' : bigint,
}
export interface SupportedStandard { 'url' : string, 'name' : string }
export type ValidationResult = { 'Ok' : string } |
  { 'Err' : string };
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export interface Verification {
  'at' : bigint,
  'source' : VerifySource,
  'name' : string,
}
export type VerifySource = { 'dao' : null } |
  { 'import' : null } |
  { 'admin' : Principal } |
  { 'sns_governance' : Principal };
/**
 * / Public names of principals: accounts (one name for all of a person's principals) and canister
 * / names. Design: spec/sneed_names.md. The dapp registry the dapp labels refer to is in sneed_profiles.
 */
export interface _SERVICE extends SneedPidNames {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
