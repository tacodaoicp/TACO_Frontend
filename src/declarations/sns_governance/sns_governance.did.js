export const idlFactory = ({ IDL }) => {
  const Timers = IDL.Record({
    'last_spawned_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'last_reset_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'requires_periodic_tasks' : IDL.Opt(IDL.Bool),
  });
  const Version = IDL.Record({
    'archive_wasm_hash' : IDL.Vec(IDL.Nat8),
    'root_wasm_hash' : IDL.Vec(IDL.Nat8),
    'swap_wasm_hash' : IDL.Vec(IDL.Nat8),
    'ledger_wasm_hash' : IDL.Vec(IDL.Nat8),
    'governance_wasm_hash' : IDL.Vec(IDL.Nat8),
    'index_wasm_hash' : IDL.Vec(IDL.Nat8),
  });
  const Versions = IDL.Record({ 'versions' : IDL.Vec(Version) });
  const CachedUpgradeSteps = IDL.Record({
    'upgrade_steps' : IDL.Opt(Versions),
    'response_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'requested_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const Topic = IDL.Variant({
    'DappCanisterManagement' : IDL.Null,
    'DaoCommunitySettings' : IDL.Null,
    'ApplicationBusinessLogic' : IDL.Null,
    'CriticalDappOperations' : IDL.Null,
    'TreasuryAssetManagement' : IDL.Null,
    'Governance' : IDL.Null,
    'SnsFrameworkManagement' : IDL.Null,
  });
  const GenericNervousSystemFunction = IDL.Record({
    'topic' : IDL.Opt(Topic),
    'validator_canister_id' : IDL.Opt(IDL.Principal),
    'target_canister_id' : IDL.Opt(IDL.Principal),
    'validator_method_name' : IDL.Opt(IDL.Text),
    'target_method_name' : IDL.Opt(IDL.Text),
  });
  const FunctionType = IDL.Variant({
    'NativeNervousSystemFunction' : IDL.Record({}),
    'GenericNervousSystemFunction' : GenericNervousSystemFunction,
  });
  const NervousSystemFunction = IDL.Record({
    'id' : IDL.Nat64,
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'function_type' : IDL.Opt(FunctionType),
  });
  const GovernanceCachedMetrics = IDL.Record({
    'not_dissolving_neurons_e8s_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64)
    ),
    'garbage_collectable_neurons_count' : IDL.Nat64,
    'neurons_with_invalid_stake_count' : IDL.Nat64,
    'not_dissolving_neurons_count_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Nat64)
    ),
    'neurons_with_less_than_6_months_dissolve_delay_count' : IDL.Nat64,
    'dissolved_neurons_count' : IDL.Nat64,
    'total_staked_e8s' : IDL.Nat64,
    'total_supply_governance_tokens' : IDL.Nat64,
    'not_dissolving_neurons_count' : IDL.Nat64,
    'dissolved_neurons_e8s' : IDL.Nat64,
    'neurons_with_less_than_6_months_dissolve_delay_e8s' : IDL.Nat64,
    'dissolving_neurons_count_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Nat64)
    ),
    'dissolving_neurons_count' : IDL.Nat64,
    'dissolving_neurons_e8s_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64)
    ),
    'timestamp_seconds' : IDL.Nat64,
  });
  const MaturityModulation = IDL.Record({
    'current_basis_points' : IDL.Opt(IDL.Int32),
    'updated_at_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const TargetVersionSet = IDL.Record({
    'old_target_version' : IDL.Opt(Version),
    'new_target_version' : IDL.Opt(Version),
    'is_advanced_automatically' : IDL.Opt(IDL.Bool),
  });
  const UpgradeStepsReset = IDL.Record({
    'human_readable' : IDL.Opt(IDL.Text),
    'upgrade_steps' : IDL.Opt(Versions),
  });
  const UpgradeOutcome = IDL.Record({
    'status' : IDL.Opt(
      IDL.Variant({
        'Success' : IDL.Record({}),
        'Timeout' : IDL.Record({}),
        'ExternalFailure' : IDL.Record({}),
        'InvalidState' : IDL.Record({ 'version' : IDL.Opt(Version) }),
      })
    ),
    'human_readable' : IDL.Opt(IDL.Text),
  });
  const ProposalId = IDL.Record({ 'id' : IDL.Nat64 });
  const UpgradeStarted = IDL.Record({
    'current_version' : IDL.Opt(Version),
    'expected_version' : IDL.Opt(Version),
    'reason' : IDL.Opt(
      IDL.Variant({
        'UpgradeSnsToNextVersionProposal' : ProposalId,
        'BehindTargetVersion' : IDL.Record({}),
      })
    ),
  });
  const UpgradeStepsRefreshed = IDL.Record({
    'upgrade_steps' : IDL.Opt(Versions),
  });
  const TargetVersionReset = IDL.Record({
    'human_readable' : IDL.Opt(IDL.Text),
    'old_target_version' : IDL.Opt(Version),
    'new_target_version' : IDL.Opt(Version),
  });
  const UpgradeJournalEntry = IDL.Record({
    'event' : IDL.Opt(
      IDL.Variant({
        'TargetVersionSet' : TargetVersionSet,
        'UpgradeStepsReset' : UpgradeStepsReset,
        'UpgradeOutcome' : UpgradeOutcome,
        'UpgradeStarted' : UpgradeStarted,
        'UpgradeStepsRefreshed' : UpgradeStepsRefreshed,
        'TargetVersionReset' : TargetVersionReset,
      })
    ),
    'timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const UpgradeJournal = IDL.Record({
    'entries' : IDL.Vec(UpgradeJournalEntry),
  });
  const NeuronId = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const Followees = IDL.Record({ 'followees' : IDL.Vec(NeuronId) });
  const DefaultFollowees = IDL.Record({
    'followees' : IDL.Vec(IDL.Tuple(IDL.Nat64, Followees)),
  });
  const NeuronPermissionList = IDL.Record({
    'permissions' : IDL.Vec(IDL.Int32),
  });
  const VotingRewardsParameters = IDL.Record({
    'final_reward_rate_basis_points' : IDL.Opt(IDL.Nat64),
    'initial_reward_rate_basis_points' : IDL.Opt(IDL.Nat64),
    'reward_rate_transition_duration_seconds' : IDL.Opt(IDL.Nat64),
    'round_duration_seconds' : IDL.Opt(IDL.Nat64),
  });
  const NervousSystemParameters = IDL.Record({
    'default_followees' : IDL.Opt(DefaultFollowees),
    'max_dissolve_delay_seconds' : IDL.Opt(IDL.Nat64),
    'max_dissolve_delay_bonus_percentage' : IDL.Opt(IDL.Nat64),
    'max_followees_per_function' : IDL.Opt(IDL.Nat64),
    'automatically_advance_target_version' : IDL.Opt(IDL.Bool),
    'neuron_claimer_permissions' : IDL.Opt(NeuronPermissionList),
    'neuron_minimum_stake_e8s' : IDL.Opt(IDL.Nat64),
    'max_neuron_age_for_age_bonus' : IDL.Opt(IDL.Nat64),
    'initial_voting_period_seconds' : IDL.Opt(IDL.Nat64),
    'neuron_minimum_dissolve_delay_to_vote_seconds' : IDL.Opt(IDL.Nat64),
    'reject_cost_e8s' : IDL.Opt(IDL.Nat64),
    'max_proposals_to_keep_per_action' : IDL.Opt(IDL.Nat32),
    'wait_for_quiet_deadline_increase_seconds' : IDL.Opt(IDL.Nat64),
    'max_number_of_neurons' : IDL.Opt(IDL.Nat64),
    'transaction_fee_e8s' : IDL.Opt(IDL.Nat64),
    'max_number_of_proposals_with_ballots' : IDL.Opt(IDL.Nat64),
    'max_age_bonus_percentage' : IDL.Opt(IDL.Nat64),
    'neuron_grantable_permissions' : IDL.Opt(NeuronPermissionList),
    'voting_rewards_parameters' : IDL.Opt(VotingRewardsParameters),
    'maturity_modulation_disabled' : IDL.Opt(IDL.Bool),
    'max_number_of_principals_per_neuron' : IDL.Opt(IDL.Nat64),
  });
  const RewardEvent = IDL.Record({
    'rounds_since_last_distribution' : IDL.Opt(IDL.Nat64),
    'actual_timestamp_seconds' : IDL.Nat64,
    'end_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'total_available_e8s_equivalent' : IDL.Opt(IDL.Nat64),
    'distributed_e8s_equivalent' : IDL.Nat64,
    'round' : IDL.Nat64,
    'settled_proposals' : IDL.Vec(ProposalId),
  });
  const PendingVersion = IDL.Record({
    'mark_failed_at_seconds' : IDL.Nat64,
    'checking_upgrade_lock' : IDL.Nat64,
    'proposal_id' : IDL.Opt(IDL.Nat64),
    'target_version' : IDL.Opt(Version),
  });
  const GovernanceError = IDL.Record({
    'error_message' : IDL.Text,
    'error_type' : IDL.Int32,
  });
  const Subaccount = IDL.Record({ 'subaccount' : IDL.Vec(IDL.Nat8) });
  const Account = IDL.Record({
    'owner' : IDL.Opt(IDL.Principal),
    'subaccount' : IDL.Opt(Subaccount),
  });
  const Decimal = IDL.Record({ 'human_readable' : IDL.Opt(IDL.Text) });
  const Tokens = IDL.Record({ 'e8s' : IDL.Opt(IDL.Nat64) });
  const ValuationFactors = IDL.Record({
    'xdrs_per_icp' : IDL.Opt(Decimal),
    'icps_per_token' : IDL.Opt(Decimal),
    'tokens' : IDL.Opt(Tokens),
  });
  const Valuation = IDL.Record({
    'token' : IDL.Opt(IDL.Int32),
    'account' : IDL.Opt(Account),
    'valuation_factors' : IDL.Opt(ValuationFactors),
    'timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const MintSnsTokensActionAuxiliary = IDL.Record({
    'valuation' : IDL.Opt(Valuation),
  });
  const SnsVersion = IDL.Record({
    'archive_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'root_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'swap_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'ledger_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'governance_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'index_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const AdvanceSnsTargetVersionActionAuxiliary = IDL.Record({
    'target_version' : IDL.Opt(SnsVersion),
  });
  const ActionAuxiliary = IDL.Variant({
    'TransferSnsTreasuryFunds' : MintSnsTokensActionAuxiliary,
    'MintSnsTokens' : MintSnsTokensActionAuxiliary,
    'AdvanceSnsTargetVersion' : AdvanceSnsTargetVersionActionAuxiliary,
  });
  const Ballot = IDL.Record({
    'vote' : IDL.Int32,
    'cast_timestamp_seconds' : IDL.Nat64,
    'voting_power' : IDL.Nat64,
  });
  const Percentage = IDL.Record({ 'basis_points' : IDL.Opt(IDL.Nat64) });
  const Tally = IDL.Record({
    'no' : IDL.Nat64,
    'yes' : IDL.Nat64,
    'total' : IDL.Nat64,
    'timestamp_seconds' : IDL.Nat64,
  });
  const ManageDappCanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Opt(IDL.Nat64),
    'wasm_memory_threshold' : IDL.Opt(IDL.Nat64),
    'canister_ids' : IDL.Vec(IDL.Principal),
    'reserved_cycles_limit' : IDL.Opt(IDL.Nat64),
    'log_visibility' : IDL.Opt(IDL.Int32),
    'wasm_memory_limit' : IDL.Opt(IDL.Nat64),
    'memory_allocation' : IDL.Opt(IDL.Nat64),
    'compute_allocation' : IDL.Opt(IDL.Nat64),
  });
  const SetTopicsForCustomProposals = IDL.Record({
    'custom_function_id_to_topic' : IDL.Vec(IDL.Tuple(IDL.Nat64, Topic)),
  });
  const RegisterDappCanisters = IDL.Record({
    'canister_ids' : IDL.Vec(IDL.Principal),
  });
  const TransferSnsTreasuryFunds = IDL.Record({
    'from_treasury' : IDL.Int32,
    'to_principal' : IDL.Opt(IDL.Principal),
    'to_subaccount' : IDL.Opt(Subaccount),
    'memo' : IDL.Opt(IDL.Nat64),
    'amount_e8s' : IDL.Nat64,
  });
  const ChunkedCanisterWasm = IDL.Record({
    'wasm_module_hash' : IDL.Vec(IDL.Nat8),
    'chunk_hashes_list' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'store_canister_id' : IDL.Opt(IDL.Principal),
  });
  const UpgradeSnsControlledCanister = IDL.Record({
    'new_canister_wasm' : IDL.Vec(IDL.Nat8),
    'mode' : IDL.Opt(IDL.Int32),
    'canister_id' : IDL.Opt(IDL.Principal),
    'chunked_canister_wasm' : IDL.Opt(ChunkedCanisterWasm),
    'canister_upgrade_arg' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const DeregisterDappCanisters = IDL.Record({
    'canister_ids' : IDL.Vec(IDL.Principal),
    'new_controllers' : IDL.Vec(IDL.Principal),
  });
  const MintSnsTokens = IDL.Record({
    'to_principal' : IDL.Opt(IDL.Principal),
    'to_subaccount' : IDL.Opt(Subaccount),
    'memo' : IDL.Opt(IDL.Nat64),
    'amount_e8s' : IDL.Opt(IDL.Nat64),
  });
  const AdvanceSnsTargetVersion = IDL.Record({
    'new_target' : IDL.Opt(SnsVersion),
  });
  const ManageSnsMetadata = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'logo' : IDL.Opt(IDL.Text),
    'name' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
  });
  const ExecuteGenericNervousSystemFunction = IDL.Record({
    'function_id' : IDL.Nat64,
    'payload' : IDL.Vec(IDL.Nat8),
  });
  const ManageLedgerParameters = IDL.Record({
    'token_symbol' : IDL.Opt(IDL.Text),
    'transfer_fee' : IDL.Opt(IDL.Nat64),
    'token_logo' : IDL.Opt(IDL.Text),
    'token_name' : IDL.Opt(IDL.Text),
  });
  const Motion = IDL.Record({ 'motion_text' : IDL.Text });
  const Action = IDL.Variant({
    'ManageNervousSystemParameters' : NervousSystemParameters,
    'AddGenericNervousSystemFunction' : NervousSystemFunction,
    'ManageDappCanisterSettings' : ManageDappCanisterSettings,
    'RemoveGenericNervousSystemFunction' : IDL.Nat64,
    'SetTopicsForCustomProposals' : SetTopicsForCustomProposals,
    'UpgradeSnsToNextVersion' : IDL.Record({}),
    'RegisterDappCanisters' : RegisterDappCanisters,
    'TransferSnsTreasuryFunds' : TransferSnsTreasuryFunds,
    'UpgradeSnsControlledCanister' : UpgradeSnsControlledCanister,
    'DeregisterDappCanisters' : DeregisterDappCanisters,
    'MintSnsTokens' : MintSnsTokens,
    'AdvanceSnsTargetVersion' : AdvanceSnsTargetVersion,
    'Unspecified' : IDL.Record({}),
    'ManageSnsMetadata' : ManageSnsMetadata,
    'ExecuteGenericNervousSystemFunction' : ExecuteGenericNervousSystemFunction,
    'ManageLedgerParameters' : ManageLedgerParameters,
    'Motion' : Motion,
  });
  const Proposal = IDL.Record({
    'url' : IDL.Text,
    'title' : IDL.Text,
    'action' : IDL.Opt(Action),
    'summary' : IDL.Text,
  });
  const WaitForQuietState = IDL.Record({
    'current_deadline_timestamp_seconds' : IDL.Nat64,
  });
  const ProposalData = IDL.Record({
    'id' : IDL.Opt(ProposalId),
    'payload_text_rendering' : IDL.Opt(IDL.Text),
    'topic' : IDL.Opt(Topic),
    'action' : IDL.Nat64,
    'failure_reason' : IDL.Opt(GovernanceError),
    'action_auxiliary' : IDL.Opt(ActionAuxiliary),
    'ballots' : IDL.Vec(IDL.Tuple(IDL.Text, Ballot)),
    'minimum_yes_proportion_of_total' : IDL.Opt(Percentage),
    'reward_event_round' : IDL.Nat64,
    'failed_timestamp_seconds' : IDL.Nat64,
    'reward_event_end_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'proposal_creation_timestamp_seconds' : IDL.Nat64,
    'initial_voting_period_seconds' : IDL.Nat64,
    'reject_cost_e8s' : IDL.Nat64,
    'latest_tally' : IDL.Opt(Tally),
    'wait_for_quiet_deadline_increase_seconds' : IDL.Nat64,
    'decided_timestamp_seconds' : IDL.Nat64,
    'proposal' : IDL.Opt(Proposal),
    'proposer' : IDL.Opt(NeuronId),
    'wait_for_quiet_state' : IDL.Opt(WaitForQuietState),
    'minimum_yes_proportion_of_exercised' : IDL.Opt(Percentage),
    'is_eligible_for_rewards' : IDL.Bool,
    'executed_timestamp_seconds' : IDL.Nat64,
  });
  const Split = IDL.Record({ 'memo' : IDL.Nat64, 'amount_e8s' : IDL.Nat64 });
  const Follow = IDL.Record({
    'function_id' : IDL.Nat64,
    'followees' : IDL.Vec(NeuronId),
  });
  const DisburseMaturity = IDL.Record({
    'to_account' : IDL.Opt(Account),
    'percentage_to_disburse' : IDL.Nat32,
  });
  const ChangeAutoStakeMaturity = IDL.Record({
    'requested_setting_for_auto_stake_maturity' : IDL.Bool,
  });
  const IncreaseDissolveDelay = IDL.Record({
    'additional_dissolve_delay_seconds' : IDL.Nat32,
  });
  const SetDissolveTimestamp = IDL.Record({
    'dissolve_timestamp_seconds' : IDL.Nat64,
  });
  const Operation = IDL.Variant({
    'ChangeAutoStakeMaturity' : ChangeAutoStakeMaturity,
    'StopDissolving' : IDL.Record({}),
    'StartDissolving' : IDL.Record({}),
    'IncreaseDissolveDelay' : IncreaseDissolveDelay,
    'SetDissolveTimestamp' : SetDissolveTimestamp,
  });
  const Configure = IDL.Record({ 'operation' : IDL.Opt(Operation) });
  const RegisterVote = IDL.Record({
    'vote' : IDL.Int32,
    'proposal' : IDL.Opt(ProposalId),
  });
  const Followee = IDL.Record({
    'alias' : IDL.Opt(IDL.Text),
    'neuron_id' : IDL.Opt(NeuronId),
  });
  const FolloweesForTopic = IDL.Record({
    'topic' : IDL.Opt(Topic),
    'followees' : IDL.Vec(Followee),
  });
  const SetFollowing = IDL.Record({
    'topic_following' : IDL.Vec(FolloweesForTopic),
  });
  const FinalizeDisburseMaturity = IDL.Record({
    'amount_to_be_disbursed_e8s' : IDL.Nat64,
    'to_account' : IDL.Opt(Account),
  });
  const MemoAndController = IDL.Record({
    'controller' : IDL.Opt(IDL.Principal),
    'memo' : IDL.Nat64,
  });
  const By = IDL.Variant({
    'MemoAndController' : MemoAndController,
    'NeuronId' : IDL.Record({}),
  });
  const ClaimOrRefresh = IDL.Record({ 'by' : IDL.Opt(By) });
  const RemoveNeuronPermissions = IDL.Record({
    'permissions_to_remove' : IDL.Opt(NeuronPermissionList),
    'principal_id' : IDL.Opt(IDL.Principal),
  });
  const AddNeuronPermissions = IDL.Record({
    'permissions_to_add' : IDL.Opt(NeuronPermissionList),
    'principal_id' : IDL.Opt(IDL.Principal),
  });
  const MergeMaturity = IDL.Record({ 'percentage_to_merge' : IDL.Nat32 });
  const Amount = IDL.Record({ 'e8s' : IDL.Nat64 });
  const Disburse = IDL.Record({
    'to_account' : IDL.Opt(Account),
    'amount' : IDL.Opt(Amount),
  });
  const Command_2 = IDL.Variant({
    'Split' : Split,
    'Follow' : Follow,
    'DisburseMaturity' : DisburseMaturity,
    'Configure' : Configure,
    'RegisterVote' : RegisterVote,
    'SetFollowing' : SetFollowing,
    'SyncCommand' : IDL.Record({}),
    'MakeProposal' : Proposal,
    'FinalizeDisburseMaturity' : FinalizeDisburseMaturity,
    'ClaimOrRefreshNeuron' : ClaimOrRefresh,
    'RemoveNeuronPermissions' : RemoveNeuronPermissions,
    'AddNeuronPermissions' : AddNeuronPermissions,
    'MergeMaturity' : MergeMaturity,
    'Disburse' : Disburse,
  });
  const NeuronInFlightCommand = IDL.Record({
    'command' : IDL.Opt(Command_2),
    'timestamp' : IDL.Nat64,
  });
  const NeuronPermission = IDL.Record({
    'principal' : IDL.Opt(IDL.Principal),
    'permission_type' : IDL.Vec(IDL.Int32),
  });
  const DissolveState = IDL.Variant({
    'DissolveDelaySeconds' : IDL.Nat64,
    'WhenDissolvedTimestampSeconds' : IDL.Nat64,
  });
  const DisburseMaturityInProgress = IDL.Record({
    'timestamp_of_disbursement_seconds' : IDL.Nat64,
    'amount_e8s' : IDL.Nat64,
    'account_to_disburse_to' : IDL.Opt(Account),
    'finalize_disbursement_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const Neuron = IDL.Record({
    'id' : IDL.Opt(NeuronId),
    'staked_maturity_e8s_equivalent' : IDL.Opt(IDL.Nat64),
    'permissions' : IDL.Vec(NeuronPermission),
    'maturity_e8s_equivalent' : IDL.Nat64,
    'cached_neuron_stake_e8s' : IDL.Nat64,
    'created_timestamp_seconds' : IDL.Nat64,
    'topic_followees' : IDL.Opt(
      IDL.Record({
        'topic_id_to_followees' : IDL.Vec(
          IDL.Tuple(IDL.Int32, FolloweesForTopic)
        ),
      })
    ),
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
  const Governance = IDL.Record({
    'root_canister_id' : IDL.Opt(IDL.Principal),
    'timers' : IDL.Opt(Timers),
    'cached_upgrade_steps' : IDL.Opt(CachedUpgradeSteps),
    'id_to_nervous_system_functions' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, NervousSystemFunction)
    ),
    'metrics' : IDL.Opt(GovernanceCachedMetrics),
    'maturity_modulation' : IDL.Opt(MaturityModulation),
    'upgrade_journal' : IDL.Opt(UpgradeJournal),
    'mode' : IDL.Int32,
    'parameters' : IDL.Opt(NervousSystemParameters),
    'is_finalizing_disburse_maturity' : IDL.Opt(IDL.Bool),
    'deployed_version' : IDL.Opt(Version),
    'sns_initialization_parameters' : IDL.Text,
    'latest_reward_event' : IDL.Opt(RewardEvent),
    'pending_version' : IDL.Opt(PendingVersion),
    'swap_canister_id' : IDL.Opt(IDL.Principal),
    'ledger_canister_id' : IDL.Opt(IDL.Principal),
    'proposals' : IDL.Vec(IDL.Tuple(IDL.Nat64, ProposalData)),
    'in_flight_commands' : IDL.Vec(IDL.Tuple(IDL.Text, NeuronInFlightCommand)),
    'sns_metadata' : IDL.Opt(ManageSnsMetadata),
    'neurons' : IDL.Vec(IDL.Tuple(IDL.Text, Neuron)),
    'target_version' : IDL.Opt(Version),
    'genesis_timestamp_seconds' : IDL.Nat64,
  });
  const Principals = IDL.Record({ 'principals' : IDL.Vec(IDL.Principal) });
  const NeuronsFund = IDL.Record({
    'nns_neuron_hotkeys' : IDL.Opt(Principals),
    'nns_neuron_controller' : IDL.Opt(IDL.Principal),
    'nns_neuron_id' : IDL.Opt(IDL.Nat64),
  });
  const Participant = IDL.Variant({
    'NeuronsFund' : NeuronsFund,
    'Direct' : IDL.Record({}),
  });
  const NeuronIds = IDL.Record({ 'neuron_ids' : IDL.Vec(NeuronId) });
  const NeuronRecipe = IDL.Record({
    'controller' : IDL.Opt(IDL.Principal),
    'dissolve_delay_seconds' : IDL.Opt(IDL.Nat64),
    'participant' : IDL.Opt(Participant),
    'stake_e8s' : IDL.Opt(IDL.Nat64),
    'followees' : IDL.Opt(NeuronIds),
    'neuron_id' : IDL.Opt(NeuronId),
  });
  const NeuronRecipes = IDL.Record({
    'neuron_recipes' : IDL.Vec(NeuronRecipe),
  });
  const ClaimSwapNeuronsRequest = IDL.Record({
    'neuron_recipes' : IDL.Opt(NeuronRecipes),
  });
  const SwapNeuron = IDL.Record({
    'id' : IDL.Opt(NeuronId),
    'status' : IDL.Int32,
  });
  const ClaimedSwapNeurons = IDL.Record({
    'swap_neurons' : IDL.Vec(SwapNeuron),
  });
  const ClaimSwapNeuronsResult = IDL.Variant({
    'Ok' : ClaimedSwapNeurons,
    'Err' : IDL.Int32,
  });
  const ClaimSwapNeuronsResponse = IDL.Record({
    'claim_swap_neurons_result' : IDL.Opt(ClaimSwapNeuronsResult),
  });
  const GetMaturityModulationResponse = IDL.Record({
    'maturity_modulation' : IDL.Opt(MaturityModulation),
  });
  const GetMetadataResponse = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'logo' : IDL.Opt(IDL.Text),
    'name' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
  });
  const GetModeResponse = IDL.Record({ 'mode' : IDL.Opt(IDL.Int32) });
  const GetNeuron = IDL.Record({ 'neuron_id' : IDL.Opt(NeuronId) });
  const Result = IDL.Variant({ 'Error' : GovernanceError, 'Neuron' : Neuron });
  const GetNeuronResponse = IDL.Record({ 'result' : IDL.Opt(Result) });
  const GetProposal = IDL.Record({ 'proposal_id' : IDL.Opt(ProposalId) });
  const Result_1 = IDL.Variant({
    'Error' : GovernanceError,
    'Proposal' : ProposalData,
  });
  const GetProposalResponse = IDL.Record({ 'result' : IDL.Opt(Result_1) });
  const CanisterStatusType = IDL.Variant({
    'stopped' : IDL.Null,
    'stopping' : IDL.Null,
    'running' : IDL.Null,
  });
  const DefiniteCanisterSettingsArgs = IDL.Record({
    'freezing_threshold' : IDL.Nat,
    'wasm_memory_threshold' : IDL.Opt(IDL.Nat),
    'controllers' : IDL.Vec(IDL.Principal),
    'wasm_memory_limit' : IDL.Opt(IDL.Nat),
    'memory_allocation' : IDL.Nat,
    'compute_allocation' : IDL.Nat,
  });
  const QueryStats = IDL.Record({
    'response_payload_bytes_total' : IDL.Opt(IDL.Nat),
    'num_instructions_total' : IDL.Opt(IDL.Nat),
    'num_calls_total' : IDL.Opt(IDL.Nat),
    'request_payload_bytes_total' : IDL.Opt(IDL.Nat),
  });
  const CanisterStatusResultV2 = IDL.Record({
    'status' : CanisterStatusType,
    'memory_size' : IDL.Nat,
    'cycles' : IDL.Nat,
    'settings' : DefiniteCanisterSettingsArgs,
    'query_stats' : IDL.Opt(QueryStats),
    'idle_cycles_burned_per_day' : IDL.Nat,
    'module_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const GetRunningSnsVersionResponse = IDL.Record({
    'deployed_version' : IDL.Opt(Version),
    'pending_version' : IDL.Opt(
      IDL.Record({
        'mark_failed_at_seconds' : IDL.Nat64,
        'checking_upgrade_lock' : IDL.Nat64,
        'proposal_id' : IDL.Nat64,
        'target_version' : IDL.Opt(Version),
      })
    ),
  });
  const GetSnsInitializationParametersResponse = IDL.Record({
    'sns_initialization_parameters' : IDL.Text,
  });
  const GetTimersResponse = IDL.Record({ 'timers' : IDL.Opt(Timers) });
  const GetUpgradeJournalRequest = IDL.Record({
    'offset' : IDL.Opt(IDL.Nat64),
    'limit' : IDL.Opt(IDL.Nat64),
  });
  const GetUpgradeJournalResponse = IDL.Record({
    'upgrade_journal' : IDL.Opt(UpgradeJournal),
    'upgrade_steps' : IDL.Opt(Versions),
    'response_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'deployed_version' : IDL.Opt(Version),
    'target_version' : IDL.Opt(Version),
    'upgrade_journal_entry_count' : IDL.Opt(IDL.Nat64),
  });
  const ListNervousSystemFunctionsResponse = IDL.Record({
    'reserved_ids' : IDL.Vec(IDL.Nat64),
    'functions' : IDL.Vec(NervousSystemFunction),
  });
  const ListNeurons = IDL.Record({
    'of_principal' : IDL.Opt(IDL.Principal),
    'limit' : IDL.Nat32,
    'start_page_at' : IDL.Opt(NeuronId),
  });
  const ListNeuronsResponse = IDL.Record({ 'neurons' : IDL.Vec(Neuron) });
  const TopicSelector = IDL.Record({ 'topic' : IDL.Opt(Topic) });
  const ListProposals = IDL.Record({
    'include_reward_status' : IDL.Vec(IDL.Int32),
    'before_proposal' : IDL.Opt(ProposalId),
    'limit' : IDL.Nat32,
    'exclude_type' : IDL.Vec(IDL.Nat64),
    'include_topics' : IDL.Opt(IDL.Vec(TopicSelector)),
    'include_status' : IDL.Vec(IDL.Int32),
  });
  const ListProposalsResponse = IDL.Record({
    'include_ballots_by_caller' : IDL.Opt(IDL.Bool),
    'proposals' : IDL.Vec(ProposalData),
    'include_topic_filtering' : IDL.Opt(IDL.Bool),
  });
  const ListTopicsRequest = IDL.Record({});
  const TopicInfo = IDL.Record({
    'native_functions' : IDL.Opt(IDL.Vec(NervousSystemFunction)),
    'topic' : IDL.Opt(Topic),
    'is_critical' : IDL.Opt(IDL.Bool),
    'name' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'custom_functions' : IDL.Opt(IDL.Vec(NervousSystemFunction)),
  });
  const ListTopicsResponse = IDL.Record({
    'uncategorized_functions' : IDL.Opt(IDL.Vec(NervousSystemFunction)),
    'topics' : IDL.Opt(IDL.Vec(TopicInfo)),
  });
  const StakeMaturity = IDL.Record({
    'percentage_to_stake' : IDL.Opt(IDL.Nat32),
  });
  const Command = IDL.Variant({
    'Split' : Split,
    'Follow' : Follow,
    'DisburseMaturity' : DisburseMaturity,
    'ClaimOrRefresh' : ClaimOrRefresh,
    'Configure' : Configure,
    'RegisterVote' : RegisterVote,
    'SetFollowing' : SetFollowing,
    'MakeProposal' : Proposal,
    'StakeMaturity' : StakeMaturity,
    'RemoveNeuronPermissions' : RemoveNeuronPermissions,
    'AddNeuronPermissions' : AddNeuronPermissions,
    'MergeMaturity' : MergeMaturity,
    'Disburse' : Disburse,
  });
  const ManageNeuron = IDL.Record({
    'subaccount' : IDL.Vec(IDL.Nat8),
    'command' : IDL.Opt(Command),
  });
  const SplitResponse = IDL.Record({ 'created_neuron_id' : IDL.Opt(NeuronId) });
  const DisburseMaturityResponse = IDL.Record({
    'amount_disbursed_e8s' : IDL.Nat64,
    'amount_deducted_e8s' : IDL.Opt(IDL.Nat64),
  });
  const ClaimOrRefreshResponse = IDL.Record({
    'refreshed_neuron_id' : IDL.Opt(NeuronId),
  });
  const StakeMaturityResponse = IDL.Record({
    'maturity_e8s' : IDL.Nat64,
    'staked_maturity_e8s' : IDL.Nat64,
  });
  const MergeMaturityResponse = IDL.Record({
    'merged_maturity_e8s' : IDL.Nat64,
    'new_stake_e8s' : IDL.Nat64,
  });
  const DisburseResponse = IDL.Record({ 'transfer_block_height' : IDL.Nat64 });
  const Command_1 = IDL.Variant({
    'Error' : GovernanceError,
    'Split' : SplitResponse,
    'Follow' : IDL.Record({}),
    'DisburseMaturity' : DisburseMaturityResponse,
    'ClaimOrRefresh' : ClaimOrRefreshResponse,
    'Configure' : IDL.Record({}),
    'RegisterVote' : IDL.Record({}),
    'SetFollowing' : IDL.Record({}),
    'MakeProposal' : GetProposal,
    'RemoveNeuronPermission' : IDL.Record({}),
    'StakeMaturity' : StakeMaturityResponse,
    'MergeMaturity' : MergeMaturityResponse,
    'Disburse' : DisburseResponse,
    'AddNeuronPermission' : IDL.Record({}),
  });
  const ManageNeuronResponse = IDL.Record({ 'command' : IDL.Opt(Command_1) });
  const SetMode = IDL.Record({ 'mode' : IDL.Int32 });
  return IDL.Service({
    'claim_swap_neurons' : IDL.Func(
        [ClaimSwapNeuronsRequest],
        [ClaimSwapNeuronsResponse],
        [],
      ),
    'fail_stuck_upgrade_in_progress' : IDL.Func(
        [IDL.Record({})],
        [IDL.Record({})],
        [],
      ),
    'get_build_metadata' : IDL.Func([], [IDL.Text], ['query']),
    'get_latest_reward_event' : IDL.Func([], [RewardEvent], ['query']),
    'get_maturity_modulation' : IDL.Func(
        [IDL.Record({})],
        [GetMaturityModulationResponse],
        [],
      ),
    'get_metadata' : IDL.Func(
        [IDL.Record({})],
        [GetMetadataResponse],
        ['query'],
      ),
    'get_mode' : IDL.Func([IDL.Record({})], [GetModeResponse], ['query']),
    'get_nervous_system_parameters' : IDL.Func(
        [IDL.Null],
        [NervousSystemParameters],
        ['query'],
      ),
    'get_neuron' : IDL.Func([GetNeuron], [GetNeuronResponse], ['query']),
    'get_proposal' : IDL.Func([GetProposal], [GetProposalResponse], ['query']),
    'get_root_canister_status' : IDL.Func(
        [IDL.Null],
        [CanisterStatusResultV2],
        [],
      ),
    'get_running_sns_version' : IDL.Func(
        [IDL.Record({})],
        [GetRunningSnsVersionResponse],
        ['query'],
      ),
    'get_sns_initialization_parameters' : IDL.Func(
        [IDL.Record({})],
        [GetSnsInitializationParametersResponse],
        ['query'],
      ),
    'get_timers' : IDL.Func([IDL.Record({})], [GetTimersResponse], ['query']),
    'get_upgrade_journal' : IDL.Func(
        [GetUpgradeJournalRequest],
        [GetUpgradeJournalResponse],
        ['query'],
      ),
    'list_nervous_system_functions' : IDL.Func(
        [],
        [ListNervousSystemFunctionsResponse],
        ['query'],
      ),
    'list_neurons' : IDL.Func([ListNeurons], [ListNeuronsResponse], ['query']),
    'list_proposals' : IDL.Func(
        [ListProposals],
        [ListProposalsResponse],
        ['query'],
      ),
    'list_topics' : IDL.Func(
        [ListTopicsRequest],
        [ListTopicsResponse],
        ['query'],
      ),
    'manage_neuron' : IDL.Func([ManageNeuron], [ManageNeuronResponse], []),
    'reset_timers' : IDL.Func([IDL.Record({})], [IDL.Record({})], []),
    'set_mode' : IDL.Func([SetMode], [IDL.Record({})], []),
  });
};
export const init = ({ IDL }) => {
  const Timers = IDL.Record({
    'last_spawned_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'last_reset_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'requires_periodic_tasks' : IDL.Opt(IDL.Bool),
  });
  const Version = IDL.Record({
    'archive_wasm_hash' : IDL.Vec(IDL.Nat8),
    'root_wasm_hash' : IDL.Vec(IDL.Nat8),
    'swap_wasm_hash' : IDL.Vec(IDL.Nat8),
    'ledger_wasm_hash' : IDL.Vec(IDL.Nat8),
    'governance_wasm_hash' : IDL.Vec(IDL.Nat8),
    'index_wasm_hash' : IDL.Vec(IDL.Nat8),
  });
  const Versions = IDL.Record({ 'versions' : IDL.Vec(Version) });
  const CachedUpgradeSteps = IDL.Record({
    'upgrade_steps' : IDL.Opt(Versions),
    'response_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'requested_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const Topic = IDL.Variant({
    'DappCanisterManagement' : IDL.Null,
    'DaoCommunitySettings' : IDL.Null,
    'ApplicationBusinessLogic' : IDL.Null,
    'CriticalDappOperations' : IDL.Null,
    'TreasuryAssetManagement' : IDL.Null,
    'Governance' : IDL.Null,
    'SnsFrameworkManagement' : IDL.Null,
  });
  const GenericNervousSystemFunction = IDL.Record({
    'topic' : IDL.Opt(Topic),
    'validator_canister_id' : IDL.Opt(IDL.Principal),
    'target_canister_id' : IDL.Opt(IDL.Principal),
    'validator_method_name' : IDL.Opt(IDL.Text),
    'target_method_name' : IDL.Opt(IDL.Text),
  });
  const FunctionType = IDL.Variant({
    'NativeNervousSystemFunction' : IDL.Record({}),
    'GenericNervousSystemFunction' : GenericNervousSystemFunction,
  });
  const NervousSystemFunction = IDL.Record({
    'id' : IDL.Nat64,
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'function_type' : IDL.Opt(FunctionType),
  });
  const GovernanceCachedMetrics = IDL.Record({
    'not_dissolving_neurons_e8s_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64)
    ),
    'garbage_collectable_neurons_count' : IDL.Nat64,
    'neurons_with_invalid_stake_count' : IDL.Nat64,
    'not_dissolving_neurons_count_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Nat64)
    ),
    'neurons_with_less_than_6_months_dissolve_delay_count' : IDL.Nat64,
    'dissolved_neurons_count' : IDL.Nat64,
    'total_staked_e8s' : IDL.Nat64,
    'total_supply_governance_tokens' : IDL.Nat64,
    'not_dissolving_neurons_count' : IDL.Nat64,
    'dissolved_neurons_e8s' : IDL.Nat64,
    'neurons_with_less_than_6_months_dissolve_delay_e8s' : IDL.Nat64,
    'dissolving_neurons_count_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Nat64)
    ),
    'dissolving_neurons_count' : IDL.Nat64,
    'dissolving_neurons_e8s_buckets' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64)
    ),
    'timestamp_seconds' : IDL.Nat64,
  });
  const MaturityModulation = IDL.Record({
    'current_basis_points' : IDL.Opt(IDL.Int32),
    'updated_at_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const TargetVersionSet = IDL.Record({
    'old_target_version' : IDL.Opt(Version),
    'new_target_version' : IDL.Opt(Version),
    'is_advanced_automatically' : IDL.Opt(IDL.Bool),
  });
  const UpgradeStepsReset = IDL.Record({
    'human_readable' : IDL.Opt(IDL.Text),
    'upgrade_steps' : IDL.Opt(Versions),
  });
  const UpgradeOutcome = IDL.Record({
    'status' : IDL.Opt(
      IDL.Variant({
        'Success' : IDL.Record({}),
        'Timeout' : IDL.Record({}),
        'ExternalFailure' : IDL.Record({}),
        'InvalidState' : IDL.Record({ 'version' : IDL.Opt(Version) }),
      })
    ),
    'human_readable' : IDL.Opt(IDL.Text),
  });
  const ProposalId = IDL.Record({ 'id' : IDL.Nat64 });
  const UpgradeStarted = IDL.Record({
    'current_version' : IDL.Opt(Version),
    'expected_version' : IDL.Opt(Version),
    'reason' : IDL.Opt(
      IDL.Variant({
        'UpgradeSnsToNextVersionProposal' : ProposalId,
        'BehindTargetVersion' : IDL.Record({}),
      })
    ),
  });
  const UpgradeStepsRefreshed = IDL.Record({
    'upgrade_steps' : IDL.Opt(Versions),
  });
  const TargetVersionReset = IDL.Record({
    'human_readable' : IDL.Opt(IDL.Text),
    'old_target_version' : IDL.Opt(Version),
    'new_target_version' : IDL.Opt(Version),
  });
  const UpgradeJournalEntry = IDL.Record({
    'event' : IDL.Opt(
      IDL.Variant({
        'TargetVersionSet' : TargetVersionSet,
        'UpgradeStepsReset' : UpgradeStepsReset,
        'UpgradeOutcome' : UpgradeOutcome,
        'UpgradeStarted' : UpgradeStarted,
        'UpgradeStepsRefreshed' : UpgradeStepsRefreshed,
        'TargetVersionReset' : TargetVersionReset,
      })
    ),
    'timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const UpgradeJournal = IDL.Record({
    'entries' : IDL.Vec(UpgradeJournalEntry),
  });
  const NeuronId = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const Followees = IDL.Record({ 'followees' : IDL.Vec(NeuronId) });
  const DefaultFollowees = IDL.Record({
    'followees' : IDL.Vec(IDL.Tuple(IDL.Nat64, Followees)),
  });
  const NeuronPermissionList = IDL.Record({
    'permissions' : IDL.Vec(IDL.Int32),
  });
  const VotingRewardsParameters = IDL.Record({
    'final_reward_rate_basis_points' : IDL.Opt(IDL.Nat64),
    'initial_reward_rate_basis_points' : IDL.Opt(IDL.Nat64),
    'reward_rate_transition_duration_seconds' : IDL.Opt(IDL.Nat64),
    'round_duration_seconds' : IDL.Opt(IDL.Nat64),
  });
  const NervousSystemParameters = IDL.Record({
    'default_followees' : IDL.Opt(DefaultFollowees),
    'max_dissolve_delay_seconds' : IDL.Opt(IDL.Nat64),
    'max_dissolve_delay_bonus_percentage' : IDL.Opt(IDL.Nat64),
    'max_followees_per_function' : IDL.Opt(IDL.Nat64),
    'automatically_advance_target_version' : IDL.Opt(IDL.Bool),
    'neuron_claimer_permissions' : IDL.Opt(NeuronPermissionList),
    'neuron_minimum_stake_e8s' : IDL.Opt(IDL.Nat64),
    'max_neuron_age_for_age_bonus' : IDL.Opt(IDL.Nat64),
    'initial_voting_period_seconds' : IDL.Opt(IDL.Nat64),
    'neuron_minimum_dissolve_delay_to_vote_seconds' : IDL.Opt(IDL.Nat64),
    'reject_cost_e8s' : IDL.Opt(IDL.Nat64),
    'max_proposals_to_keep_per_action' : IDL.Opt(IDL.Nat32),
    'wait_for_quiet_deadline_increase_seconds' : IDL.Opt(IDL.Nat64),
    'max_number_of_neurons' : IDL.Opt(IDL.Nat64),
    'transaction_fee_e8s' : IDL.Opt(IDL.Nat64),
    'max_number_of_proposals_with_ballots' : IDL.Opt(IDL.Nat64),
    'max_age_bonus_percentage' : IDL.Opt(IDL.Nat64),
    'neuron_grantable_permissions' : IDL.Opt(NeuronPermissionList),
    'voting_rewards_parameters' : IDL.Opt(VotingRewardsParameters),
    'maturity_modulation_disabled' : IDL.Opt(IDL.Bool),
    'max_number_of_principals_per_neuron' : IDL.Opt(IDL.Nat64),
  });
  const RewardEvent = IDL.Record({
    'rounds_since_last_distribution' : IDL.Opt(IDL.Nat64),
    'actual_timestamp_seconds' : IDL.Nat64,
    'end_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'total_available_e8s_equivalent' : IDL.Opt(IDL.Nat64),
    'distributed_e8s_equivalent' : IDL.Nat64,
    'round' : IDL.Nat64,
    'settled_proposals' : IDL.Vec(ProposalId),
  });
  const PendingVersion = IDL.Record({
    'mark_failed_at_seconds' : IDL.Nat64,
    'checking_upgrade_lock' : IDL.Nat64,
    'proposal_id' : IDL.Opt(IDL.Nat64),
    'target_version' : IDL.Opt(Version),
  });
  const GovernanceError = IDL.Record({
    'error_message' : IDL.Text,
    'error_type' : IDL.Int32,
  });
  const Subaccount = IDL.Record({ 'subaccount' : IDL.Vec(IDL.Nat8) });
  const Account = IDL.Record({
    'owner' : IDL.Opt(IDL.Principal),
    'subaccount' : IDL.Opt(Subaccount),
  });
  const Decimal = IDL.Record({ 'human_readable' : IDL.Opt(IDL.Text) });
  const Tokens = IDL.Record({ 'e8s' : IDL.Opt(IDL.Nat64) });
  const ValuationFactors = IDL.Record({
    'xdrs_per_icp' : IDL.Opt(Decimal),
    'icps_per_token' : IDL.Opt(Decimal),
    'tokens' : IDL.Opt(Tokens),
  });
  const Valuation = IDL.Record({
    'token' : IDL.Opt(IDL.Int32),
    'account' : IDL.Opt(Account),
    'valuation_factors' : IDL.Opt(ValuationFactors),
    'timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const MintSnsTokensActionAuxiliary = IDL.Record({
    'valuation' : IDL.Opt(Valuation),
  });
  const SnsVersion = IDL.Record({
    'archive_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'root_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'swap_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'ledger_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'governance_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'index_wasm_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const AdvanceSnsTargetVersionActionAuxiliary = IDL.Record({
    'target_version' : IDL.Opt(SnsVersion),
  });
  const ActionAuxiliary = IDL.Variant({
    'TransferSnsTreasuryFunds' : MintSnsTokensActionAuxiliary,
    'MintSnsTokens' : MintSnsTokensActionAuxiliary,
    'AdvanceSnsTargetVersion' : AdvanceSnsTargetVersionActionAuxiliary,
  });
  const Ballot = IDL.Record({
    'vote' : IDL.Int32,
    'cast_timestamp_seconds' : IDL.Nat64,
    'voting_power' : IDL.Nat64,
  });
  const Percentage = IDL.Record({ 'basis_points' : IDL.Opt(IDL.Nat64) });
  const Tally = IDL.Record({
    'no' : IDL.Nat64,
    'yes' : IDL.Nat64,
    'total' : IDL.Nat64,
    'timestamp_seconds' : IDL.Nat64,
  });
  const ManageDappCanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Opt(IDL.Nat64),
    'wasm_memory_threshold' : IDL.Opt(IDL.Nat64),
    'canister_ids' : IDL.Vec(IDL.Principal),
    'reserved_cycles_limit' : IDL.Opt(IDL.Nat64),
    'log_visibility' : IDL.Opt(IDL.Int32),
    'wasm_memory_limit' : IDL.Opt(IDL.Nat64),
    'memory_allocation' : IDL.Opt(IDL.Nat64),
    'compute_allocation' : IDL.Opt(IDL.Nat64),
  });
  const SetTopicsForCustomProposals = IDL.Record({
    'custom_function_id_to_topic' : IDL.Vec(IDL.Tuple(IDL.Nat64, Topic)),
  });
  const RegisterDappCanisters = IDL.Record({
    'canister_ids' : IDL.Vec(IDL.Principal),
  });
  const TransferSnsTreasuryFunds = IDL.Record({
    'from_treasury' : IDL.Int32,
    'to_principal' : IDL.Opt(IDL.Principal),
    'to_subaccount' : IDL.Opt(Subaccount),
    'memo' : IDL.Opt(IDL.Nat64),
    'amount_e8s' : IDL.Nat64,
  });
  const ChunkedCanisterWasm = IDL.Record({
    'wasm_module_hash' : IDL.Vec(IDL.Nat8),
    'chunk_hashes_list' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'store_canister_id' : IDL.Opt(IDL.Principal),
  });
  const UpgradeSnsControlledCanister = IDL.Record({
    'new_canister_wasm' : IDL.Vec(IDL.Nat8),
    'mode' : IDL.Opt(IDL.Int32),
    'canister_id' : IDL.Opt(IDL.Principal),
    'chunked_canister_wasm' : IDL.Opt(ChunkedCanisterWasm),
    'canister_upgrade_arg' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const DeregisterDappCanisters = IDL.Record({
    'canister_ids' : IDL.Vec(IDL.Principal),
    'new_controllers' : IDL.Vec(IDL.Principal),
  });
  const MintSnsTokens = IDL.Record({
    'to_principal' : IDL.Opt(IDL.Principal),
    'to_subaccount' : IDL.Opt(Subaccount),
    'memo' : IDL.Opt(IDL.Nat64),
    'amount_e8s' : IDL.Opt(IDL.Nat64),
  });
  const AdvanceSnsTargetVersion = IDL.Record({
    'new_target' : IDL.Opt(SnsVersion),
  });
  const ManageSnsMetadata = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'logo' : IDL.Opt(IDL.Text),
    'name' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
  });
  const ExecuteGenericNervousSystemFunction = IDL.Record({
    'function_id' : IDL.Nat64,
    'payload' : IDL.Vec(IDL.Nat8),
  });
  const ManageLedgerParameters = IDL.Record({
    'token_symbol' : IDL.Opt(IDL.Text),
    'transfer_fee' : IDL.Opt(IDL.Nat64),
    'token_logo' : IDL.Opt(IDL.Text),
    'token_name' : IDL.Opt(IDL.Text),
  });
  const Motion = IDL.Record({ 'motion_text' : IDL.Text });
  const Action = IDL.Variant({
    'ManageNervousSystemParameters' : NervousSystemParameters,
    'AddGenericNervousSystemFunction' : NervousSystemFunction,
    'ManageDappCanisterSettings' : ManageDappCanisterSettings,
    'RemoveGenericNervousSystemFunction' : IDL.Nat64,
    'SetTopicsForCustomProposals' : SetTopicsForCustomProposals,
    'UpgradeSnsToNextVersion' : IDL.Record({}),
    'RegisterDappCanisters' : RegisterDappCanisters,
    'TransferSnsTreasuryFunds' : TransferSnsTreasuryFunds,
    'UpgradeSnsControlledCanister' : UpgradeSnsControlledCanister,
    'DeregisterDappCanisters' : DeregisterDappCanisters,
    'MintSnsTokens' : MintSnsTokens,
    'AdvanceSnsTargetVersion' : AdvanceSnsTargetVersion,
    'Unspecified' : IDL.Record({}),
    'ManageSnsMetadata' : ManageSnsMetadata,
    'ExecuteGenericNervousSystemFunction' : ExecuteGenericNervousSystemFunction,
    'ManageLedgerParameters' : ManageLedgerParameters,
    'Motion' : Motion,
  });
  const Proposal = IDL.Record({
    'url' : IDL.Text,
    'title' : IDL.Text,
    'action' : IDL.Opt(Action),
    'summary' : IDL.Text,
  });
  const WaitForQuietState = IDL.Record({
    'current_deadline_timestamp_seconds' : IDL.Nat64,
  });
  const ProposalData = IDL.Record({
    'id' : IDL.Opt(ProposalId),
    'payload_text_rendering' : IDL.Opt(IDL.Text),
    'topic' : IDL.Opt(Topic),
    'action' : IDL.Nat64,
    'failure_reason' : IDL.Opt(GovernanceError),
    'action_auxiliary' : IDL.Opt(ActionAuxiliary),
    'ballots' : IDL.Vec(IDL.Tuple(IDL.Text, Ballot)),
    'minimum_yes_proportion_of_total' : IDL.Opt(Percentage),
    'reward_event_round' : IDL.Nat64,
    'failed_timestamp_seconds' : IDL.Nat64,
    'reward_event_end_timestamp_seconds' : IDL.Opt(IDL.Nat64),
    'proposal_creation_timestamp_seconds' : IDL.Nat64,
    'initial_voting_period_seconds' : IDL.Nat64,
    'reject_cost_e8s' : IDL.Nat64,
    'latest_tally' : IDL.Opt(Tally),
    'wait_for_quiet_deadline_increase_seconds' : IDL.Nat64,
    'decided_timestamp_seconds' : IDL.Nat64,
    'proposal' : IDL.Opt(Proposal),
    'proposer' : IDL.Opt(NeuronId),
    'wait_for_quiet_state' : IDL.Opt(WaitForQuietState),
    'minimum_yes_proportion_of_exercised' : IDL.Opt(Percentage),
    'is_eligible_for_rewards' : IDL.Bool,
    'executed_timestamp_seconds' : IDL.Nat64,
  });
  const Split = IDL.Record({ 'memo' : IDL.Nat64, 'amount_e8s' : IDL.Nat64 });
  const Follow = IDL.Record({
    'function_id' : IDL.Nat64,
    'followees' : IDL.Vec(NeuronId),
  });
  const DisburseMaturity = IDL.Record({
    'to_account' : IDL.Opt(Account),
    'percentage_to_disburse' : IDL.Nat32,
  });
  const ChangeAutoStakeMaturity = IDL.Record({
    'requested_setting_for_auto_stake_maturity' : IDL.Bool,
  });
  const IncreaseDissolveDelay = IDL.Record({
    'additional_dissolve_delay_seconds' : IDL.Nat32,
  });
  const SetDissolveTimestamp = IDL.Record({
    'dissolve_timestamp_seconds' : IDL.Nat64,
  });
  const Operation = IDL.Variant({
    'ChangeAutoStakeMaturity' : ChangeAutoStakeMaturity,
    'StopDissolving' : IDL.Record({}),
    'StartDissolving' : IDL.Record({}),
    'IncreaseDissolveDelay' : IncreaseDissolveDelay,
    'SetDissolveTimestamp' : SetDissolveTimestamp,
  });
  const Configure = IDL.Record({ 'operation' : IDL.Opt(Operation) });
  const RegisterVote = IDL.Record({
    'vote' : IDL.Int32,
    'proposal' : IDL.Opt(ProposalId),
  });
  const Followee = IDL.Record({
    'alias' : IDL.Opt(IDL.Text),
    'neuron_id' : IDL.Opt(NeuronId),
  });
  const FolloweesForTopic = IDL.Record({
    'topic' : IDL.Opt(Topic),
    'followees' : IDL.Vec(Followee),
  });
  const SetFollowing = IDL.Record({
    'topic_following' : IDL.Vec(FolloweesForTopic),
  });
  const FinalizeDisburseMaturity = IDL.Record({
    'amount_to_be_disbursed_e8s' : IDL.Nat64,
    'to_account' : IDL.Opt(Account),
  });
  const MemoAndController = IDL.Record({
    'controller' : IDL.Opt(IDL.Principal),
    'memo' : IDL.Nat64,
  });
  const By = IDL.Variant({
    'MemoAndController' : MemoAndController,
    'NeuronId' : IDL.Record({}),
  });
  const ClaimOrRefresh = IDL.Record({ 'by' : IDL.Opt(By) });
  const RemoveNeuronPermissions = IDL.Record({
    'permissions_to_remove' : IDL.Opt(NeuronPermissionList),
    'principal_id' : IDL.Opt(IDL.Principal),
  });
  const AddNeuronPermissions = IDL.Record({
    'permissions_to_add' : IDL.Opt(NeuronPermissionList),
    'principal_id' : IDL.Opt(IDL.Principal),
  });
  const MergeMaturity = IDL.Record({ 'percentage_to_merge' : IDL.Nat32 });
  const Amount = IDL.Record({ 'e8s' : IDL.Nat64 });
  const Disburse = IDL.Record({
    'to_account' : IDL.Opt(Account),
    'amount' : IDL.Opt(Amount),
  });
  const Command_2 = IDL.Variant({
    'Split' : Split,
    'Follow' : Follow,
    'DisburseMaturity' : DisburseMaturity,
    'Configure' : Configure,
    'RegisterVote' : RegisterVote,
    'SetFollowing' : SetFollowing,
    'SyncCommand' : IDL.Record({}),
    'MakeProposal' : Proposal,
    'FinalizeDisburseMaturity' : FinalizeDisburseMaturity,
    'ClaimOrRefreshNeuron' : ClaimOrRefresh,
    'RemoveNeuronPermissions' : RemoveNeuronPermissions,
    'AddNeuronPermissions' : AddNeuronPermissions,
    'MergeMaturity' : MergeMaturity,
    'Disburse' : Disburse,
  });
  const NeuronInFlightCommand = IDL.Record({
    'command' : IDL.Opt(Command_2),
    'timestamp' : IDL.Nat64,
  });
  const NeuronPermission = IDL.Record({
    'principal' : IDL.Opt(IDL.Principal),
    'permission_type' : IDL.Vec(IDL.Int32),
  });
  const DissolveState = IDL.Variant({
    'DissolveDelaySeconds' : IDL.Nat64,
    'WhenDissolvedTimestampSeconds' : IDL.Nat64,
  });
  const DisburseMaturityInProgress = IDL.Record({
    'timestamp_of_disbursement_seconds' : IDL.Nat64,
    'amount_e8s' : IDL.Nat64,
    'account_to_disburse_to' : IDL.Opt(Account),
    'finalize_disbursement_timestamp_seconds' : IDL.Opt(IDL.Nat64),
  });
  const Neuron = IDL.Record({
    'id' : IDL.Opt(NeuronId),
    'staked_maturity_e8s_equivalent' : IDL.Opt(IDL.Nat64),
    'permissions' : IDL.Vec(NeuronPermission),
    'maturity_e8s_equivalent' : IDL.Nat64,
    'cached_neuron_stake_e8s' : IDL.Nat64,
    'created_timestamp_seconds' : IDL.Nat64,
    'topic_followees' : IDL.Opt(
      IDL.Record({
        'topic_id_to_followees' : IDL.Vec(
          IDL.Tuple(IDL.Int32, FolloweesForTopic)
        ),
      })
    ),
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
  const Governance = IDL.Record({
    'root_canister_id' : IDL.Opt(IDL.Principal),
    'timers' : IDL.Opt(Timers),
    'cached_upgrade_steps' : IDL.Opt(CachedUpgradeSteps),
    'id_to_nervous_system_functions' : IDL.Vec(
      IDL.Tuple(IDL.Nat64, NervousSystemFunction)
    ),
    'metrics' : IDL.Opt(GovernanceCachedMetrics),
    'maturity_modulation' : IDL.Opt(MaturityModulation),
    'upgrade_journal' : IDL.Opt(UpgradeJournal),
    'mode' : IDL.Int32,
    'parameters' : IDL.Opt(NervousSystemParameters),
    'is_finalizing_disburse_maturity' : IDL.Opt(IDL.Bool),
    'deployed_version' : IDL.Opt(Version),
    'sns_initialization_parameters' : IDL.Text,
    'latest_reward_event' : IDL.Opt(RewardEvent),
    'pending_version' : IDL.Opt(PendingVersion),
    'swap_canister_id' : IDL.Opt(IDL.Principal),
    'ledger_canister_id' : IDL.Opt(IDL.Principal),
    'proposals' : IDL.Vec(IDL.Tuple(IDL.Nat64, ProposalData)),
    'in_flight_commands' : IDL.Vec(IDL.Tuple(IDL.Text, NeuronInFlightCommand)),
    'sns_metadata' : IDL.Opt(ManageSnsMetadata),
    'neurons' : IDL.Vec(IDL.Tuple(IDL.Text, Neuron)),
    'target_version' : IDL.Opt(Version),
    'genesis_timestamp_seconds' : IDL.Nat64,
  });
  return [Governance];
};