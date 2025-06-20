export const idlFactory = ({ IDL }) => {
  const SnapshotId = IDL.Nat;
  const CancelNeuronSnapshotError = IDL.Variant({
    'NotTakingSnapshot' : IDL.Null,
  });
  const CancelNeuronSnapshotResult = IDL.Variant({
    'Ok' : SnapshotId,
    'Err' : CancelNeuronSnapshotError,
  });
  const CumulativeVP = IDL.Record({
    'total_staked_vp_by_hotkey_setters' : IDL.Nat,
    'total_staked_vp' : IDL.Nat,
  });
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
  const NeuronVP = IDL.Record({
    'votingPower' : IDL.Nat,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const NeuronSnapshotError = IDL.Variant({
    'Timeout' : IDL.Null,
    'Cancelled' : IDL.Null,
  });
  const NeuronSnapshotResult = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : NeuronSnapshotError,
  });
  const Timestamp = IDL.Nat64;
  const NeuronSnapshotInfo = IDL.Record({
    'id' : SnapshotId,
    'result' : NeuronSnapshotResult,
    'timestamp' : Timestamp,
  });
  const NeuronId = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const NeuronPermission = IDL.Record({
    'principal' : IDL.Opt(IDL.Principal),
    'permission_type' : IDL.Vec(IDL.Int32),
  });
  const DissolveState = IDL.Variant({
    'DissolveDelaySeconds' : IDL.Nat64,
    'WhenDissolvedTimestampSeconds' : IDL.Nat64,
  });
  const Subaccount = IDL.Vec(IDL.Nat8);
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(Subaccount),
  });
  const DisburseMaturityInProgress = IDL.Record({
    'timestamp_of_disbursement_seconds' : IDL.Nat64,
    'amount_e8s' : IDL.Nat64,
    'account_to_disburse_to' : IDL.Opt(Account),
    'finalize_disbursement_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const Followees = IDL.Record({ 'followees' : IDL.Vec(NeuronId) });
  const Neuron = IDL.Record({
    'id' : IDL.Opt(NeuronId),
    'staked_maturity_e8s_equivalent' : IDL.Opt(IDL.Nat64),
    'permissions' : IDL.Vec(NeuronPermission),
    'maturity_e8s_equivalent' : IDL.Nat64,
    'cached_neuron_stake_e8s' : IDL.Nat64,
    'created_timestamp_seconds' : IDL.Nat64,
    'source_nns_neuron_id' : IDL.Opt(IDL.Nat64),
    'auto_stake_maturity' : IDL.Opt(IDL.Bool),
    'aging_since_timestamp_seconds' : IDL.Nat64,
    'dissolve_state' : IDL.Opt(DissolveState),
    'voting_power_percentage_multiplier' : IDL.Nat64,
    'vesting_period_seconds' : IDL.Opt(IDL.Nat64),
    'disburse_maturity_in_progress' : IDL.Vec(DisburseMaturityInProgress),
    'followees' : IDL.Vec(IDL.Tuple(IDL.Nat64, Followees)),
    'neuron_fees_e8s' : IDL.Nat64,
  });
  const NeuronSnapshotStatus = IDL.Variant({
    'TakingSnapshot' : IDL.Null,
    'StoringSnapshot' : IDL.Null,
    'Ready' : IDL.Null,
  });
  const TakeNeuronSnapshotError = IDL.Variant({
    'AlreadyTakingSnapshot' : IDL.Null,
    'SnsGovernanceCanisterIdNotSet' : IDL.Null,
  });
  const TakeNeuronSnapshotResult = IDL.Variant({
    'Ok' : SnapshotId,
    'Err' : TakeNeuronSnapshotError,
  });
  const neuronSnapshot = IDL.Service({
    'cancel_neuron_snapshot' : IDL.Func([], [CancelNeuronSnapshotResult], []),
    'clearLogs' : IDL.Func([], [], []),
    'getCumulativeValuesAtSnapshot' : IDL.Func(
        [IDL.Opt(SnapshotId)],
        [IDL.Opt(CumulativeVP)],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getLogsByContext' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Vec(LogEntry)],
        ['query'],
      ),
    'getLogsByLevel' : IDL.Func(
        [LogLevel, IDL.Nat],
        [IDL.Vec(LogEntry)],
        ['query'],
      ),
    'getNeuronDataForDAO' : IDL.Func(
        [SnapshotId, IDL.Nat, IDL.Nat],
        [
          IDL.Opt(
            IDL.Record({
              'total_entries' : IDL.Nat,
              'stopped_at' : IDL.Opt(IDL.Nat),
              'entries' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(NeuronVP))),
            })
          ),
        ],
        ['query'],
      ),
    'get_neuron_snapshot_head_id' : IDL.Func([], [SnapshotId], ['query']),
    'get_neuron_snapshot_info' : IDL.Func(
        [SnapshotId],
        [IDL.Opt(NeuronSnapshotInfo)],
        ['query'],
      ),
    'get_neuron_snapshot_neurons' : IDL.Func(
        [SnapshotId, IDL.Nat, IDL.Nat],
        [IDL.Vec(Neuron)],
        ['query'],
      ),
    'get_neuron_snapshot_status' : IDL.Func(
        [],
        [NeuronSnapshotStatus],
        ['query'],
      ),
    'get_neuron_snapshots_info' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(NeuronSnapshotInfo)],
        ['query'],
      ),
    'setLogAdmin' : IDL.Func([IDL.Principal], [], []),
    'setSnsGovernanceCanisterId' : IDL.Func([IDL.Principal], [], []),
    'setTest' : IDL.Func([IDL.Bool], [], []),
    'take_neuron_snapshot' : IDL.Func([], [TakeNeuronSnapshotResult], []),
  });
  return neuronSnapshot;
};
export const init = ({ IDL }) => { return []; };
