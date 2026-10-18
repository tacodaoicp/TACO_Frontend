import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

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
export interface Change {
  'key' : NeuronKey,
  'seq' : bigint,
  'state' : [] | [NeuronNameView],
}
export interface Config {
  'moderator' : [] | [Principal],
  'sns_wasm' : Principal,
  'archive_controllers' : Array<Principal>,
  'dao_governance' : Principal,
}
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
  'verified' : boolean,
  'name' : string,
  'sns_root' : Principal,
  'neuron_id' : Uint8Array | number[],
}
export interface ImportResult { 'key' : NeuronKey, 'result' : Result }
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
export interface NeuronKey {
  'sns_root' : Principal,
  'neuron_id' : Uint8Array | number[],
}
export interface NeuronNameInfo {
  'verified' : boolean,
  'name' : string,
  'avatar' : [] | [AvatarRef],
}
export interface NeuronNameView {
  'updated_at' : bigint,
  'verified' : boolean,
  'name' : string,
  'set_by' : Principal,
  'sns_root' : Principal,
  'verification' : [] | [Verification],
  'avatar' : [] | [AvatarRef],
  'neuron_id' : Uint8Array | number[],
}
export type Result = { 'ok' : string } |
  { 'err' : string };
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
export interface SneedNeuronNames {
  'admin_add_admin' : ActorMethod<[Principal], Result>,
  'admin_clear_avatar' : ActorMethod<[NeuronKey], Result>,
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
   * / One-time import from the backend (spec §10).
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
   * / Set or remove a neuron's name (no moderation, no SNS check).
   */
  'admin_set_name' : ActorMethod<[NeuronKey, string], Result>,
  /**
   * / What changed after sequence number `after`, oldest first, each neuron once (null: name removed).
   */
  'changes_since' : ActorMethod<
    [{ 'after' : bigint, 'limit' : bigint }],
    { 'items' : Array<Change>, 'last_seq' : bigint }
  >,
  'get_admins' : ActorMethod<[], Array<Principal>>,
  'get_config' : ActorMethod<[], Config>,
  'get_log' : ActorMethod<[bigint, bigint], Array<LogEntry>>,
  'get_name' : ActorMethod<[NeuronKey], [] | [NeuronNameView]>,
  /**
   * / Names of up to 500 neurons, in order.
   */
  'get_names' : ActorMethod<[Array<NeuronKey>], Array<[] | [NeuronNameInfo]>>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_log_status' : ActorMethod<[], LogStatus>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  /**
   * / One SNS's neuron names in alphabetical (lowercase) order, a page at a time.
   */
  'list_by_sns' : ActorMethod<
    [
      {
        'start_after' : [] | [string],
        'limit' : bigint,
        'sns_root' : Principal,
      },
    ],
    { 'next' : [] | [string], 'items' : Array<NeuronNameView> }
  >,
  /**
   * / Neurons of one SNS whose name, or a word in it, starts with `prefix`.
   */
  'search' : ActorMethod<
    [{ 'limit' : bigint, 'sns_root' : Principal, 'prefix' : string }],
    Array<NeuronNameView>
  >,
  /**
   * / Set or clear a named neuron's avatar.
   */
  'set_avatar' : ActorMethod<[NeuronKey, [] | [AvatarRef]], Result>,
  /**
   * / Name a neuron you have a permission on ("" removes the name). Unique per SNS, any capitals.
   */
  'set_name' : ActorMethod<[NeuronKey, string], Result>,
  'stats' : ActorMethod<[], Stats>,
  'unverify' : ActorMethod<[NeuronKey], Result>,
  'unverify_by_dao' : ActorMethod<[NeuronKey], undefined>,
  'unverify_by_sns' : ActorMethod<[NeuronKey], Result>,
  'validate_unverify_by_dao' : ActorMethod<[NeuronKey], ValidationResult>,
  'validate_verify_by_dao' : ActorMethod<[NeuronKey, string], ValidationResult>,
  'verify' : ActorMethod<[NeuronKey, string], Result>,
  'verify_by_dao' : ActorMethod<[NeuronKey, string], undefined>,
  /**
   * / Called by an SNS's governance canister (a proposal of that SNS) for its own neurons.
   */
  'verify_by_sns' : ActorMethod<[NeuronKey, string], Result>,
}
export interface Stats {
  'snses' : bigint,
  'names' : bigint,
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
 * / Public names of SNS neurons, unique per SNS (spec/sneed_names.md §5).
 */
export interface _SERVICE extends SneedNeuronNames {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
