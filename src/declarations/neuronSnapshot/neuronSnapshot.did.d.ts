import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Subaccount],
}
export type CancelNeuronSnapshotError = { 'NotTakingSnapshot' : null };
export type CancelNeuronSnapshotResult = { 'Ok' : SnapshotId } |
  { 'Err' : CancelNeuronSnapshotError };
export interface CumulativeVP {
  'total_staked_vp_by_hotkey_setters' : bigint,
  'total_staked_vp' : bigint,
}
export interface DisburseMaturityInProgress {
  'timestamp_of_disbursement_seconds' : bigint,
  'amount_e8s' : bigint,
  'account_to_disburse_to' : [] | [Account],
  'finalize_disbursement_timestamp_seconds' : [] | [bigint],
}
export type DissolveState = { 'DissolveDelaySeconds' : bigint } |
  { 'WhenDissolvedTimestampSeconds' : bigint };
export interface Followees { 'followees' : Array<NeuronId> }
export interface LogEntry {
  'component' : string,
  'context' : string,
  'level' : LogLevel,
  'message' : string,
  'timestamp' : bigint,
}
export type LogLevel = { 'INFO' : null } |
  { 'WARN' : null } |
  { 'ERROR' : null };
export interface Neuron {
  'id' : [] | [NeuronId],
  'staked_maturity_e8s_equivalent' : [] | [bigint],
  'permissions' : Array<NeuronPermission>,
  'maturity_e8s_equivalent' : bigint,
  'cached_neuron_stake_e8s' : bigint,
  'created_timestamp_seconds' : bigint,
  'source_nns_neuron_id' : [] | [bigint],
  'auto_stake_maturity' : [] | [boolean],
  'aging_since_timestamp_seconds' : bigint,
  'dissolve_state' : [] | [DissolveState],
  'voting_power_percentage_multiplier' : bigint,
  'vesting_period_seconds' : [] | [bigint],
  'disburse_maturity_in_progress' : Array<DisburseMaturityInProgress>,
  'followees' : Array<[bigint, Followees]>,
  'neuron_fees_e8s' : bigint,
}
export interface NeuronId { 'id' : Uint8Array | number[] }
export interface NeuronPermission {
  'principal' : [] | [Principal],
  'permission_type' : Int32Array | number[],
}
export type NeuronSnapshotError = { 'Timeout' : null } |
  { 'Cancelled' : null };
export interface NeuronSnapshotInfo {
  'id' : SnapshotId,
  'result' : NeuronSnapshotResult,
  'timestamp' : Timestamp,
}
export type NeuronSnapshotResult = { 'Ok' : null } |
  { 'Err' : NeuronSnapshotError };
export type NeuronSnapshotStatus = { 'TakingSnapshot' : null } |
  { 'StoringSnapshot' : null } |
  { 'Ready' : null };
export interface NeuronVP {
  'votingPower' : bigint,
  'neuronId' : Uint8Array | number[],
}
export type SnapshotId = bigint;
export type Subaccount = Uint8Array | number[];
export type TakeNeuronSnapshotError = { 'AlreadyTakingSnapshot' : null } |
  { 'SnsGovernanceCanisterIdNotSet' : null };
export type TakeNeuronSnapshotResult = { 'Ok' : SnapshotId } |
  { 'Err' : TakeNeuronSnapshotError };
export type Timestamp = bigint;
export interface neuronSnapshot {
  'cancel_neuron_snapshot' : ActorMethod<[], CancelNeuronSnapshotResult>,
  'clearLogs' : ActorMethod<[], undefined>,
  'getCumulativeValuesAtSnapshot' : ActorMethod<
    [[] | [SnapshotId]],
    [] | [CumulativeVP]
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  'getNeuronDataForDAO' : ActorMethod<
    [SnapshotId, bigint, bigint],
    [] | [
      {
        'total_entries' : bigint,
        'stopped_at' : [] | [bigint],
        'entries' : Array<[Principal, Array<NeuronVP>]>,
      }
    ]
  >,
  'get_neuron_snapshot_head_id' : ActorMethod<[], SnapshotId>,
  'get_neuron_snapshot_info' : ActorMethod<
    [SnapshotId],
    [] | [NeuronSnapshotInfo]
  >,
  'get_neuron_snapshot_neurons' : ActorMethod<
    [SnapshotId, bigint, bigint],
    Array<Neuron>
  >,
  'get_neuron_snapshot_status' : ActorMethod<[], NeuronSnapshotStatus>,
  'get_neuron_snapshots_info' : ActorMethod<
    [bigint, bigint],
    Array<NeuronSnapshotInfo>
  >,
  'setLogAdmin' : ActorMethod<[Principal], undefined>,
  'setSnsGovernanceCanisterId' : ActorMethod<[Principal], undefined>,
  'setTest' : ActorMethod<[boolean], undefined>,
  'take_neuron_snapshot' : ActorMethod<[], TakeNeuronSnapshotResult>,
}
export interface _SERVICE extends neuronSnapshot {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
