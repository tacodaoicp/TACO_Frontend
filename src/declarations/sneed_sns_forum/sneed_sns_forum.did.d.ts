import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AdminInfo {
  'principal' : Principal,
  'added_at' : bigint,
  'added_by' : number,
}
export interface CreateForumInput {
  'sns_root_canister_id' : [] | [Principal],
  'title' : string,
  'description' : string,
}
export interface CreateProposalThreadInput {
  'sns_root_canister_id' : Principal,
  'proposal_id' : bigint,
}
export interface CreateThreadInput {
  'title' : [] | [string],
  'body' : string,
  'topic_id' : bigint,
}
export interface CreateTopicInput {
  'forum_id' : bigint,
  'title' : string,
  'parent_topic_id' : [] | [bigint],
  'description' : string,
}
export type ForumError = { 'InvalidInput' : string } |
  { 'NotFound' : string } |
  { 'Unauthorized' : string } |
  { 'AlreadyExists' : string } |
  { 'InternalError' : string };
export interface ForumResponse {
  'id' : bigint,
  'sns_root_canister_id' : [] | [Principal],
  'title' : string,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'deleted' : boolean,
  'description' : string,
  'created_at' : bigint,
  'created_by' : Principal,
}
export interface ForumStats {
  'total_forums' : bigint,
  'total_posts' : bigint,
  'total_votes' : bigint,
  'total_topics' : bigint,
  'total_threads' : bigint,
}
export interface NeuronId { 'id' : Uint8Array | number[] }
export interface PostResponse {
  'id' : bigint,
  'title' : [] | [string],
  'updated_at' : bigint,
  'updated_by' : Principal,
  'deleted' : boolean,
  'downvote_score' : bigint,
  'body' : string,
  'upvote_score' : bigint,
  'created_at' : bigint,
  'created_by' : Principal,
  'thread_id' : bigint,
  'reply_to_post_id' : [] | [bigint],
}
export interface ProposalThreadMappingResponse {
  'sns_root_canister_id' : Principal,
  'created_at' : bigint,
  'created_by' : Principal,
  'proposal_id' : bigint,
  'thread_id' : bigint,
}
export interface ProposalTopicMappingResponse {
  'proposals_topic_id' : bigint,
  'forum_id' : bigint,
  'set_at' : bigint,
  'set_by' : Principal,
}
export type Result = { 'ok' : null } |
  { 'err' : ForumError };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : ForumError };
export interface SetProposalTopicInput {
  'forum_id' : bigint,
  'topic_id' : bigint,
}
export interface TextLimits {
  'thread_body_max_length' : bigint,
  'forum_description_max_length' : bigint,
  'thread_title_max_length' : bigint,
  'topic_title_max_length' : bigint,
  'forum_title_max_length' : bigint,
  'post_title_max_length' : bigint,
  'topic_description_max_length' : bigint,
  'post_body_max_length' : bigint,
}
export interface ThreadResponse {
  'id' : bigint,
  'title' : [] | [string],
  'updated_at' : bigint,
  'updated_by' : Principal,
  'deleted' : boolean,
  'body' : string,
  'created_at' : bigint,
  'created_by' : Principal,
  'topic_id' : bigint,
}
export interface TopicResponse {
  'id' : bigint,
  'forum_id' : bigint,
  'title' : string,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'deleted' : boolean,
  'parent_topic_id' : [] | [bigint],
  'description' : string,
  'created_at' : bigint,
  'created_by' : Principal,
}
export interface UpdateTextLimitsInput {
  'thread_body_max_length' : [] | [bigint],
  'forum_description_max_length' : [] | [bigint],
  'thread_title_max_length' : [] | [bigint],
  'topic_title_max_length' : [] | [bigint],
  'forum_title_max_length' : [] | [bigint],
  'post_title_max_length' : [] | [bigint],
  'topic_description_max_length' : [] | [bigint],
  'post_body_max_length' : [] | [bigint],
}
export interface VoteResponse {
  'updated_at' : bigint,
  'post_id' : bigint,
  'vote_type' : VoteType,
  'created_at' : bigint,
  'voter_principal' : Principal,
  'voting_power' : bigint,
  'neuron_id' : NeuronId,
}
export type VoteType = { 'upvote' : null } |
  { 'downvote' : null };
export interface _SERVICE {
  'add_admin' : ActorMethod<[Principal], Result>,
  'create_forum' : ActorMethod<[CreateForumInput], Result_1>,
  'create_post' : ActorMethod<
    [bigint, [] | [bigint], [] | [string], string],
    Result_1
  >,
  'create_proposal_thread' : ActorMethod<[CreateProposalThreadInput], Result_1>,
  'create_proposal_thread_with_auto_setup' : ActorMethod<
    [CreateProposalThreadInput],
    Result_1
  >,
  'create_thread' : ActorMethod<[CreateThreadInput], Result_1>,
  'create_topic' : ActorMethod<[CreateTopicInput], Result_1>,
  'delete_forum' : ActorMethod<[bigint], Result>,
  'delete_post' : ActorMethod<[bigint], Result>,
  'delete_thread' : ActorMethod<[bigint], Result>,
  'delete_topic' : ActorMethod<[bigint], Result>,
  'get_admins' : ActorMethod<[], Array<AdminInfo>>,
  'get_forum' : ActorMethod<[bigint], [] | [ForumResponse]>,
  'get_forum_admin' : ActorMethod<[bigint], [] | [ForumResponse]>,
  'get_forum_by_sns_root' : ActorMethod<[Principal], [] | [ForumResponse]>,
  'get_forums' : ActorMethod<[], Array<ForumResponse>>,
  'get_forums_admin' : ActorMethod<[], Array<ForumResponse>>,
  'get_post' : ActorMethod<[bigint], [] | [PostResponse]>,
  'get_post_admin' : ActorMethod<[bigint], [] | [PostResponse]>,
  'get_post_replies' : ActorMethod<[bigint], Array<PostResponse>>,
  'get_post_replies_admin' : ActorMethod<[bigint], Array<PostResponse>>,
  'get_post_votes' : ActorMethod<[bigint], Array<VoteResponse>>,
  'get_posts_by_thread' : ActorMethod<[bigint], Array<PostResponse>>,
  'get_posts_by_thread_admin' : ActorMethod<[bigint], Array<PostResponse>>,
  'get_proposal_thread' : ActorMethod<
    [Principal, bigint],
    [] | [ProposalThreadMappingResponse]
  >,
  'get_proposals_topic' : ActorMethod<
    [bigint],
    [] | [ProposalTopicMappingResponse]
  >,
  'get_proposals_topic_by_sns_root' : ActorMethod<
    [Principal],
    [] | [ProposalTopicMappingResponse]
  >,
  'get_stats' : ActorMethod<[], ForumStats>,
  'get_subtopics' : ActorMethod<[bigint], Array<TopicResponse>>,
  'get_text_limits' : ActorMethod<[], TextLimits>,
  'get_thread' : ActorMethod<[bigint], [] | [ThreadResponse]>,
  'get_thread_admin' : ActorMethod<[bigint], [] | [ThreadResponse]>,
  'get_thread_proposal_id' : ActorMethod<[bigint], [] | [[number, bigint]]>,
  'get_threads_by_topic' : ActorMethod<[bigint], Array<ThreadResponse>>,
  'get_threads_by_topic_admin' : ActorMethod<[bigint], Array<ThreadResponse>>,
  'get_topic' : ActorMethod<[bigint], [] | [TopicResponse]>,
  'get_topic_admin' : ActorMethod<[bigint], [] | [TopicResponse]>,
  'get_topics_by_forum' : ActorMethod<[bigint], Array<TopicResponse>>,
  'get_topics_by_forum_admin' : ActorMethod<[bigint], Array<TopicResponse>>,
  'health_check' : ActorMethod<[], boolean>,
  'is_admin' : ActorMethod<[Principal], boolean>,
  'remove_admin' : ActorMethod<[Principal], Result>,
  'remove_proposals_topic' : ActorMethod<[bigint], Result>,
  'retract_vote' : ActorMethod<[bigint], Result>,
  'set_proposals_topic' : ActorMethod<[SetProposalTopicInput], Result>,
  'undelete_forum' : ActorMethod<[bigint], Result>,
  'undelete_post' : ActorMethod<[bigint], Result>,
  'undelete_thread' : ActorMethod<[bigint], Result>,
  'undelete_topic' : ActorMethod<[bigint], Result>,
  'update_forum' : ActorMethod<[bigint, CreateForumInput], Result>,
  'update_post' : ActorMethod<[bigint, [] | [string], string], Result>,
  'update_text_limits' : ActorMethod<[UpdateTextLimitsInput], Result>,
  'update_thread' : ActorMethod<[bigint, [] | [string], string], Result>,
  'update_topic' : ActorMethod<[bigint, CreateTopicInput], Result>,
  'vote_on_post' : ActorMethod<[bigint, VoteType], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
