export const idlFactory = ({ IDL }) => {
  const SnapshotId = IDL.Nat;
  const CancelNeuronSnapshotError = IDL.Variant({
    'NotTakingSnapshot' : IDL.Null,
  });
  const CancelNeuronSnapshotResult = IDL.Variant({
    'Ok' : SnapshotId,
    'Err' : CancelNeuronSnapshotError,
  });
  const GovernanceError = IDL.Record({
    'error_message' : IDL.Text,
    'error_type' : IDL.Int32,
  });
  const CopyNNSProposalError = IDL.Variant({
    'NetworkError' : IDL.Text,
    'SNSGovernanceError' : GovernanceError,
    'InvalidProposalData' : IDL.Text,
    'UnauthorizedCaller' : IDL.Null,
    'NNSProposalNotFound' : IDL.Null,
  });
  const CopyNNSProposalResult = IDL.Variant({
    'ok' : IDL.Nat64,
    'err' : CopyNNSProposalError,
  });
  const CumulativeVP = IDL.Record({
    'total_staked_vp_by_hotkey_setters' : IDL.Nat,
    'total_staked_vp' : IDL.Nat,
  });
  const DAOVoteDecision = IDL.Variant({
    'Reject' : IDL.Null,
    'Adopt' : IDL.Null,
  });
  const Timestamp = IDL.Nat64;
  const DAOVote = IDL.Record({
    'decision' : DAOVoteDecision,
    'voter_principal' : IDL.Principal,
    'timestamp' : Timestamp,
    'voting_power' : IDL.Nat,
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
  const Result_1 = IDL.Variant({
    'ok' : IDL.Record({
      'should_copy' : IDL.Bool,
      'topic_name' : IDL.Text,
      'topic_id' : IDL.Int32,
      'proposal_id' : IDL.Nat64,
      'reason' : IDL.Text,
    }),
    'err' : CopyNNSProposalError,
  });
  const NeuronVP = IDL.Record({
    'votingPower' : IDL.Nat,
    'neuronId' : IDL.Vec(IDL.Nat8),
  });
  const SNSProposalId = IDL.Record({ 'id' : IDL.Nat64 });
  const Percentage = IDL.Record({ 'basis_points' : IDL.Opt(IDL.Nat64) });
  const Tally = IDL.Record({
    'no' : IDL.Nat64,
    'yes' : IDL.Nat64,
    'total' : IDL.Nat64,
    'timestamp_seconds' : IDL.Nat64,
  });
  const Motion = IDL.Record({ 'motion_text' : IDL.Text });
  const Action = IDL.Variant({ 'Motion' : Motion });
  const Proposal = IDL.Record({
    'url' : IDL.Text,
    'title' : IDL.Text,
    'action' : IDL.Opt(Action),
    'summary' : IDL.Text,
  });
  const WaitForQuietState = IDL.Record({
    'current_deadline_timestamp_seconds' : IDL.Nat64,
  });
  const SNSProposalData = IDL.Record({
    'id' : IDL.Opt(SNSProposalId),
    'payload_text_rendering' : IDL.Opt(IDL.Text),
    'action' : IDL.Nat64,
    'failure_reason' : IDL.Opt(GovernanceError),
    'ballots' : IDL.Vec(
      IDL.Tuple(
        IDL.Text,
        IDL.Record({
          'vote' : IDL.Int32,
          'cast_timestamp_seconds' : IDL.Nat64,
          'voting_power' : IDL.Nat64,
        }),
      )
    ),
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
    'proposer' : IDL.Opt(IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) })),
    'wait_for_quiet_state' : IDL.Opt(WaitForQuietState),
    'minimum_yes_proportion_of_exercised' : IDL.Opt(Percentage),
    'is_eligible_for_rewards' : IDL.Bool,
    'executed_timestamp_seconds' : IDL.Nat64,
  });
  const SNSProposalError = IDL.Variant({
    'NetworkError' : IDL.Text,
    'ProposalNotFound' : IDL.Null,
    'SNSGovernanceError' : GovernanceError,
    'InvalidProposalData' : IDL.Text,
  });
  const GetSNSProposalFullResult = IDL.Variant({
    'ok' : SNSProposalData,
    'err' : SNSProposalError,
  });
  const VotingStatus = IDL.Variant({
    'Tied' : IDL.Null,
    'YesLeading' : IDL.Null,
    'Decided' : IDL.Null,
    'NoLeading' : IDL.Null,
    'NotStarted' : IDL.Null,
  });
  const SNSProposalSummary = IDL.Record({
    'voting_status' : VotingStatus,
    'title' : IDL.Text,
    'voting_deadline' : IDL.Nat64,
    'yes_votes' : IDL.Nat64,
    'time_remaining_seconds' : IDL.Opt(IDL.Nat64),
    'proposal_id' : IDL.Nat64,
    'is_decided' : IDL.Bool,
    'total_votes' : IDL.Nat64,
    'no_votes' : IDL.Nat64,
  });
  const GetSNSProposalSummaryResult = IDL.Variant({
    'ok' : SNSProposalSummary,
    'err' : SNSProposalError,
  });
  const NeuronId = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const NeuronSnapshotError = IDL.Variant({
    'Timeout' : IDL.Null,
    'Cancelled' : IDL.Null,
  });
  const NeuronSnapshotResult = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : NeuronSnapshotError,
  });
  const NeuronSnapshotInfo = IDL.Record({
    'id' : SnapshotId,
    'result' : NeuronSnapshotResult,
    'timestamp' : Timestamp,
  });
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
  const ProcessSequentialProposalsResult = IDL.Variant({
    'ok' : IDL.Record({
      'error_count' : IDL.Nat,
      'skipped_count' : IDL.Nat,
      'already_copied_count' : IDL.Nat,
      'processed_count' : IDL.Nat,
      'highest_processed_id' : IDL.Nat64,
      'new_copied_count' : IDL.Nat,
      'newly_copied_proposals' : IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    }),
    'err' : CopyNNSProposalError,
  });
  const ShouldCopyProposalResult = IDL.Variant({
    'ok' : IDL.Bool,
    'err' : CopyNNSProposalError,
  });
  const Result = IDL.Variant({
    'ok' : IDL.Record({
      'skipped_already_voted' : IDL.Nat,
      'skipped_no_access' : IDL.Nat,
      'total_voting_power' : IDL.Nat,
      'successful_votes' : IDL.Nat,
    }),
    'err' : IDL.Text,
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
    'addCopiedNNSProposal' : IDL.Func([IDL.Nat64, IDL.Nat64], [], []),
    'cancel_neuron_snapshot' : IDL.Func([], [CancelNeuronSnapshotResult], []),
    'clearCopiedNNSProposals' : IDL.Func([], [IDL.Nat], []),
    'clearDAOVotesForProposal' : IDL.Func([IDL.Nat64], [IDL.Nat], []),
    'clearLogs' : IDL.Func([], [], []),
    'copyNNSProposal' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Nat8)],
        [CopyNNSProposalResult],
        [],
      ),
    'getCopiedNNSProposals' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64))],
        ['query'],
      ),
    'getCopiedNNSProposalsCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getCumulativeValuesAtSnapshot' : IDL.Func(
        [IDL.Opt(SnapshotId)],
        [IDL.Opt(CumulativeVP)],
        ['query'],
      ),
    'getDAOVoteTally' : IDL.Func(
        [IDL.Nat64],
        [
          IDL.Opt(
            IDL.Record({
              'reject_votes' : IDL.Nat,
              'adopt_votes' : IDL.Nat,
              'adopt_voting_power' : IDL.Nat,
              'total_voting_power' : IDL.Nat,
              'total_votes' : IDL.Nat,
              'reject_voting_power' : IDL.Nat,
            })
          ),
        ],
        ['query'],
      ),
    'getDAOVotedNNSProposalsCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getDAOVotesForProposal' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), DAOVote))],
        ['query'],
      ),
    'getDAOVotingProposalsCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getHighestProcessedNNSProposalId' : IDL.Func([], [IDL.Nat64], ['query']),
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
    'getMaxNeuronSnapshots' : IDL.Func([], [IDL.Nat], ['query']),
    'getNNSProposalCopyInfo' : IDL.Func([IDL.Nat64], [Result_1], []),
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
    'getSNSProposal' : IDL.Func([IDL.Nat64], [GetSNSProposalFullResult], []),
    'getSNSProposalSummary' : IDL.Func(
        [IDL.Nat64],
        [GetSNSProposalSummaryResult],
        [],
      ),
    'getVotableProposals' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64))],
        ['query'],
      ),
    'get_neuron_snapshot_curr_neuron_id' : IDL.Func(
        [],
        [IDL.Opt(NeuronId)],
        ['query'],
      ),
    'get_neuron_snapshot_head_id' : IDL.Func([], [SnapshotId], ['query']),
    'get_neuron_snapshot_importing_count' : IDL.Func([], [IDL.Nat], ['query']),
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
    'hasDAOVoted' : IDL.Func([IDL.Nat64], [IDL.Bool], ['query']),
    'hasNeuronVoted' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Nat8)],
        [IDL.Opt(DAOVote)],
        ['query'],
      ),
    'isAutoProcessingRunning' : IDL.Func([], [IDL.Bool], ['query']),
    'isNNSProposalCopied' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(IDL.Nat64)],
        ['query'],
      ),
    'markNNSProposalAsVoted' : IDL.Func([IDL.Nat64], [IDL.Bool], []),
    'processNewestNNSProposals' : IDL.Func(
        [IDL.Opt(IDL.Nat32), IDL.Vec(IDL.Nat8)],
        [ProcessSequentialProposalsResult],
        [],
      ),
    'removeCopiedNNSProposal' : IDL.Func([IDL.Nat64], [], []),
    'setHighestProcessedNNSProposalId' : IDL.Func([IDL.Nat64], [], []),
    'setLogAdmin' : IDL.Func([IDL.Principal], [], []),
    'setMaxNeuronSnapshots' : IDL.Func([IDL.Nat], [], []),
    'setSnsGovernanceCanisterId' : IDL.Func([IDL.Principal], [], []),
    'setTest' : IDL.Func([IDL.Bool], [], []),
    'shouldCopyNNSProposal' : IDL.Func(
        [IDL.Nat64],
        [ShouldCopyProposalResult],
        [],
      ),
    'startAutoProcessNNSProposals' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Bool],
        [],
      ),
    'stopAutoProcessNNSProposals' : IDL.Func([], [IDL.Bool], []),
    'submitDAOVotes' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Vec(IDL.Nat8)), DAOVoteDecision],
        [Result],
        [],
      ),
    'take_neuron_snapshot' : IDL.Func([], [TakeNeuronSnapshotResult], []),
    'testProposalTextFormatting' : IDL.Func([], [IDL.Text], ['query']),
    'testVotingStatus' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, VotingStatus))],
        ['query'],
      ),
  });
  return neuronSnapshot;
};
export const init = ({ IDL }) => { return []; };
