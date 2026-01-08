import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Subaccount],
}
export type Action = { 'Motion' : Motion };
export interface ArchiveConfig {
  'maxBlocksPerCanister' : bigint,
  'blockRetentionPeriodNS' : bigint,
  'autoArchiveEnabled' : boolean,
  'enableCompression' : boolean,
}
export type CancelNeuronSnapshotError = { 'NotTakingSnapshot' : null };
export type CancelNeuronSnapshotResult = { 'Ok' : SnapshotId } |
  { 'Err' : CancelNeuronSnapshotError };
export type CopyNNSProposalError = { 'NetworkError' : string } |
  { 'SNSGovernanceError' : GovernanceError } |
  { 'InvalidProposalData' : string } |
  { 'UnauthorizedCaller' : null } |
  { 'NNSProposalNotFound' : null };
export type CopyNNSProposalResult = { 'ok' : bigint } |
  { 'err' : CopyNNSProposalError };
export interface CumulativeVP {
  'total_staked_vp_raw' : [] | [bigint],
  'total_staked_vp_by_hotkey_setters_raw' : [] | [bigint],
  'total_staked_vp_by_hotkey_setters' : bigint,
  'total_staked_vp' : bigint,
}
export interface DAONNSVoteRecord {
  'nns_proposal_id' : bigint,
  'adopt_vp' : bigint,
  'dao_decision' : string,
  'reject_vp' : bigint,
  'total_vp' : bigint,
  'vote_timestamp' : Timestamp,
  'voted_by_principal' : Principal,
}
export interface DAOVote {
  'decision' : DAOVoteDecision,
  'voter_principal' : Principal,
  'timestamp' : Timestamp,
  'voting_power' : bigint,
}
export type DAOVoteDecision = { 'Reject' : null } |
  { 'Adopt' : null };
export type DefaultVoteBehavior = { 'Skip' : null } |
  { 'VoteAdopt' : null } |
  { 'VoteReject' : null };
export interface DisburseMaturityInProgress {
  'timestamp_of_disbursement_seconds' : bigint,
  'amount_e8s' : bigint,
  'account_to_disburse_to' : [] | [Account],
  'finalize_disbursement_timestamp_seconds' : [] | [bigint],
}
export type DissolveState = { 'DissolveDelaySeconds' : bigint } |
  { 'WhenDissolvedTimestampSeconds' : bigint };
export interface Followees { 'followees' : Array<NeuronId> }
export type GetSNSProposalFullResult = { 'ok' : SNSProposalData } |
  { 'err' : SNSProposalError };
export type GetSNSProposalSummaryResult = { 'ok' : SNSProposalSummary } |
  { 'err' : SNSProposalError };
export interface GovernanceError {
  'error_message' : string,
  'error_type' : number,
}
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
export interface Motion { 'motion_text' : string }
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
export interface NeuronId__1 { 'id' : bigint }
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
export interface Percentage { 'basis_points' : [] | [bigint] }
export type ProcessSequentialProposalsResult = {
    'ok' : {
      'error_count' : bigint,
      'skipped_count' : bigint,
      'already_copied_count' : bigint,
      'processed_count' : bigint,
      'highest_processed_id' : bigint,
      'new_copied_count' : bigint,
      'newly_copied_proposals' : Array<[bigint, bigint]>,
    }
  } |
  { 'err' : CopyNNSProposalError };
export interface Proposal {
  'url' : string,
  'title' : string,
  'action' : [] | [Action],
  'summary' : string,
}
export type Result = {
    'ok' : {
      'nns_proposal_id' : bigint,
      'adopt_vp' : bigint,
      'dao_decision' : string,
      'reject_vp' : bigint,
      'total_vp' : bigint,
    }
  } |
  { 'err' : string };
export type Result_1 = {
    'ok' : {
      'skipped_already_voted' : bigint,
      'skipped_no_access' : bigint,
      'total_voting_power' : bigint,
      'successful_votes' : bigint,
    }
  } |
  { 'err' : string };
export type Result_2 = {
    'ok' : {
      'should_copy' : boolean,
      'topic_name' : string,
      'topic_id' : number,
      'proposal_id' : bigint,
      'reason' : string,
    }
  } |
  { 'err' : CopyNNSProposalError };
export type Result_3 = {
    'ok' : {
      'votes_successful' : bigint,
      'results' : Array<
        {
          'nns_proposal_id' : bigint,
          'vote_result' : { 'error' : string } |
            { 'already_voted' : string } |
            {
              'success' : {
                'adopt_vp' : bigint,
                'dao_decision' : string,
                'reject_vp' : bigint,
                'total_vp' : bigint,
              }
            } |
            { 'no_dao_votes' : string },
          'time_remaining_seconds' : [] | [bigint],
          'sns_proposal_id' : bigint,
        }
      >,
      'votes_no_dao_votes' : bigint,
      'total_proposals_checked' : bigint,
      'urgent_proposals_found' : bigint,
      'votes_failed' : bigint,
      'max_proposals_limit' : bigint,
      'votes_already_voted' : bigint,
      'votes_attempted' : bigint,
    }
  } |
  { 'err' : string };
export type Result_5 = { 'ok' : string } |
  { 'err' : string };
export interface SNSProposalData {
  'id' : [] | [SNSProposalId],
  'payload_text_rendering' : [] | [string],
  'action' : bigint,
  'failure_reason' : [] | [GovernanceError],
  'ballots' : Array<
    [
      string,
      {
        'vote' : number,
        'cast_timestamp_seconds' : bigint,
        'voting_power' : bigint,
      },
    ]
  >,
  'minimum_yes_proportion_of_total' : [] | [Percentage],
  'reward_event_round' : bigint,
  'failed_timestamp_seconds' : bigint,
  'reward_event_end_timestamp_seconds' : [] | [bigint],
  'proposal_creation_timestamp_seconds' : bigint,
  'initial_voting_period_seconds' : bigint,
  'reject_cost_e8s' : bigint,
  'latest_tally' : [] | [Tally],
  'wait_for_quiet_deadline_increase_seconds' : bigint,
  'decided_timestamp_seconds' : bigint,
  'proposal' : [] | [Proposal],
  'proposer' : [] | [{ 'id' : Uint8Array | number[] }],
  'wait_for_quiet_state' : [] | [WaitForQuietState],
  'minimum_yes_proportion_of_exercised' : [] | [Percentage],
  'is_eligible_for_rewards' : boolean,
  'executed_timestamp_seconds' : bigint,
}
export type SNSProposalError = { 'NetworkError' : string } |
  { 'ProposalNotFound' : null } |
  { 'SNSGovernanceError' : GovernanceError } |
  { 'InvalidProposalData' : string };
export interface SNSProposalId { 'id' : bigint }
export interface SNSProposalSummary {
  'voting_status' : VotingStatus,
  'title' : string,
  'voting_deadline' : bigint,
  'yes_votes' : bigint,
  'time_remaining_seconds' : [] | [bigint],
  'proposal_id' : bigint,
  'is_decided' : boolean,
  'total_votes' : bigint,
  'no_votes' : bigint,
}
export type ShouldCopyProposalResult = { 'ok' : boolean } |
  { 'err' : CopyNNSProposalError };
export type SnapshotId = bigint;
export type Subaccount = Uint8Array | number[];
export type TakeNeuronSnapshotError = { 'AlreadyTakingSnapshot' : null } |
  { 'SnsGovernanceCanisterIdNotSet' : null };
export type TakeNeuronSnapshotResult = { 'Ok' : SnapshotId } |
  { 'Err' : TakeNeuronSnapshotError };
export interface Tally {
  'no' : bigint,
  'yes' : bigint,
  'total' : bigint,
  'timestamp_seconds' : bigint,
}
export type Timestamp = bigint;
export type VotingStatus = { 'Tied' : null } |
  { 'YesLeading' : null } |
  { 'Decided' : null } |
  { 'NoLeading' : null } |
  { 'NotStarted' : null };
export interface WaitForQuietState {
  'current_deadline_timestamp_seconds' : bigint,
}
export interface neuronSnapshot {
  'addCopiedNNSProposal' : ActorMethod<[bigint, bigint], undefined>,
  'archiveProxy_getKnownArchives' : ActorMethod<[], Array<[string, Principal]>>,
  'archiveProxy_isValidArchive' : ActorMethod<[Principal], boolean>,
  'archiveProxy_resetImportTimestamps' : ActorMethod<[Principal], Result_5>,
  'archiveProxy_runManualBatchImport' : ActorMethod<[Principal], Result_5>,
  'archiveProxy_setMaxInnerLoopIterations' : ActorMethod<
    [Principal, bigint],
    Result_5
  >,
  'archiveProxy_startBatchImportSystem' : ActorMethod<[Principal], Result_5>,
  'archiveProxy_stopAllTimers' : ActorMethod<[Principal], Result_5>,
  'archiveProxy_stopBatchImportSystem' : ActorMethod<[Principal], Result_5>,
  'archiveProxy_updateConfig' : ActorMethod<
    [Principal, ArchiveConfig],
    Result_5
  >,
  'autoVoteOnProposalsExpiringWithinOneHour' : ActorMethod<[], Result_3>,
  'autoVoteOnUrgentProposals' : ActorMethod<[bigint, bigint], Result_3>,
  'cancel_neuron_snapshot' : ActorMethod<[], CancelNeuronSnapshotResult>,
  'clearCopiedNNSProposals' : ActorMethod<[], bigint>,
  'clearDAOVotedNNSProposals' : ActorMethod<[], bigint>,
  'clearDAOVotesForProposal' : ActorMethod<[bigint], bigint>,
  'clearLogs' : ActorMethod<[], undefined>,
  'clearNeuronSnapshots' : ActorMethod<
    [],
    {
      'cumulative_values_cleared' : bigint,
      'snapshots_cleared' : bigint,
      'neuron_store_entries_cleared' : bigint,
    }
  >,
  'copyNNSProposal' : ActorMethod<[bigint], CopyNNSProposalResult>,
  'getAutoVotingRoundCounter' : ActorMethod<[], bigint>,
  'getAutoVotingThresholdSeconds' : ActorMethod<[], bigint>,
  'getCopiedNNSProposals' : ActorMethod<[], Array<[bigint, bigint]>>,
  'getCopiedNNSProposalsCount' : ActorMethod<[], bigint>,
  'getCumulativeValuesAtSnapshot' : ActorMethod<
    [[] | [SnapshotId]],
    [] | [CumulativeVP]
  >,
  'getDAOVoteRecord' : ActorMethod<[bigint], [] | [DAONNSVoteRecord]>,
  'getDAOVoteTally' : ActorMethod<
    [bigint],
    [] | [
      {
        'reject_votes' : bigint,
        'adopt_votes' : bigint,
        'adopt_voting_power' : bigint,
        'total_voting_power' : bigint,
        'total_votes' : bigint,
        'reject_voting_power' : bigint,
      }
    ]
  >,
  'getDAOVotedNNSProposalsCount' : ActorMethod<[], bigint>,
  'getDAOVotesForProposal' : ActorMethod<
    [bigint],
    Array<[Uint8Array | number[], DAOVote]>
  >,
  'getDAOVotingProposalsCount' : ActorMethod<[], bigint>,
  'getDefaultVoteBehavior' : ActorMethod<[], DefaultVoteBehavior>,
  'getHighestProcessedNNSProposalId' : ActorMethod<[], bigint>,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  'getMaxNeuronSnapshots' : ActorMethod<[], bigint>,
  'getNNSProposalCopyInfo' : ActorMethod<[bigint], Result_2>,
  'getNNSProposalIdForSNS' : ActorMethod<[bigint], [] | [bigint]>,
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
  'getPeriodicTimerIntervalSeconds' : ActorMethod<[], bigint>,
  'getPeriodicTimerStatus' : ActorMethod<
    [],
    {
      'timer_id' : [] | [bigint],
      'last_run_time' : [] | [bigint],
      'next_run_time' : [] | [bigint],
      'interval_seconds' : bigint,
      'is_running' : boolean,
    }
  >,
  'getProposerSubaccount' : ActorMethod<[], Uint8Array | number[]>,
  'getSNSProposal' : ActorMethod<[bigint], GetSNSProposalFullResult>,
  'getSNSProposalIdForNNS' : ActorMethod<[bigint], [] | [bigint]>,
  'getSNSProposalSummary' : ActorMethod<[bigint], GetSNSProposalSummaryResult>,
  'getTacoDAONeuronId' : ActorMethod<[], NeuronId__1>,
  'getUrgentVotableProposals' : ActorMethod<
    [bigint],
    Array<
      {
        'is_expired' : boolean,
        'nns_proposal_id' : bigint,
        'proposal_timestamp_seconds' : [] | [bigint],
        'deadline_timestamp_seconds' : [] | [bigint],
        'time_remaining_seconds' : [] | [bigint],
        'sns_proposal_id' : bigint,
      }
    >
  >,
  'getVotableProposals' : ActorMethod<[], Array<[bigint, bigint]>>,
  'getVotableProposalsWithTimeLeft' : ActorMethod<
    [],
    Array<
      {
        'is_expired' : boolean,
        'nns_proposal_id' : bigint,
        'proposal_timestamp_seconds' : [] | [bigint],
        'deadline_timestamp_seconds' : [] | [bigint],
        'time_remaining_seconds' : [] | [bigint],
        'sns_proposal_id' : bigint,
      }
    >
  >,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  'get_neuron_snapshot_curr_neuron_id' : ActorMethod<[], [] | [NeuronId]>,
  'get_neuron_snapshot_head_id' : ActorMethod<[], SnapshotId>,
  'get_neuron_snapshot_importing_count' : ActorMethod<[], bigint>,
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
  'hasDAOVoted' : ActorMethod<[bigint], boolean>,
  'hasNeuronVoted' : ActorMethod<
    [bigint, Uint8Array | number[]],
    [] | [DAOVote]
  >,
  'isAutoProcessingRunning' : ActorMethod<[], boolean>,
  'isAutoVotingRunning' : ActorMethod<[], boolean>,
  'isNNSProposalCopied' : ActorMethod<[bigint], [] | [bigint]>,
  'markNNSProposalAsVoted' : ActorMethod<[bigint], boolean>,
  'processNewestNNSProposals' : ActorMethod<
    [[] | [number]],
    ProcessSequentialProposalsResult
  >,
  'removeCopiedNNSProposal' : ActorMethod<[bigint], undefined>,
  'setAutoVotingThresholdSeconds' : ActorMethod<[bigint], undefined>,
  'setDefaultVoteBehavior' : ActorMethod<[DefaultVoteBehavior], undefined>,
  'setHighestProcessedNNSProposalId' : ActorMethod<[bigint], undefined>,
  'setLogAdmin' : ActorMethod<[Principal], undefined>,
  'setMaxNeuronSnapshots' : ActorMethod<[bigint], undefined>,
  'setPeriodicTimerIntervalSeconds' : ActorMethod<[bigint], undefined>,
  'setProposerSubaccount' : ActorMethod<[Uint8Array | number[]], undefined>,
  'setSnsGovernanceCanisterId' : ActorMethod<[Principal], undefined>,
  'setTacoDAONeuronId' : ActorMethod<[bigint], undefined>,
  'setTest' : ActorMethod<[boolean], undefined>,
  'shouldCopyNNSProposal' : ActorMethod<[bigint], ShouldCopyProposalResult>,
  'startAutoProcessNNSProposals' : ActorMethod<[], boolean>,
  'startAutoVoteOnUrgentProposals' : ActorMethod<[], boolean>,
  'startPeriodicTimer' : ActorMethod<[], boolean>,
  'stopAutoProcessNNSProposals' : ActorMethod<[], boolean>,
  'stopAutoVoteOnUrgentProposals' : ActorMethod<[], boolean>,
  'stopPeriodicTimer' : ActorMethod<[], boolean>,
  'submitDAOVotes' : ActorMethod<
    [bigint, Array<Uint8Array | number[]>, DAOVoteDecision],
    Result_1
  >,
  'take_neuron_snapshot' : ActorMethod<[], TakeNeuronSnapshotResult>,
  'voteOnNNSProposal' : ActorMethod<[bigint], Result>,
}
export interface _SERVICE extends neuronSnapshot {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
