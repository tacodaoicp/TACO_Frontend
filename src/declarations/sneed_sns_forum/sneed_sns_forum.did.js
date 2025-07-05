export const idlFactory = ({ IDL }) => {
  const ForumError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'NotFound' : IDL.Text,
    'Unauthorized' : IDL.Text,
    'AlreadyExists' : IDL.Text,
    'InternalError' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : ForumError });
  const CreateForumInput = IDL.Record({
    'sns_root_canister_id' : IDL.Opt(IDL.Principal),
    'title' : IDL.Text,
    'description' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : ForumError });
  const CreateProposalThreadInput = IDL.Record({
    'sns_root_canister_id' : IDL.Principal,
    'proposal_id' : IDL.Nat,
  });
  const CreateThreadInput = IDL.Record({
    'title' : IDL.Opt(IDL.Text),
    'body' : IDL.Text,
    'topic_id' : IDL.Nat,
  });
  const CreateTopicInput = IDL.Record({
    'forum_id' : IDL.Nat,
    'title' : IDL.Text,
    'parent_topic_id' : IDL.Opt(IDL.Nat),
    'description' : IDL.Text,
  });
  const AdminInfo = IDL.Record({
    'principal' : IDL.Principal,
    'added_at' : IDL.Int,
    'added_by' : IDL.Nat32,
  });
  const ForumResponse = IDL.Record({
    'id' : IDL.Nat,
    'sns_root_canister_id' : IDL.Opt(IDL.Principal),
    'title' : IDL.Text,
    'updated_at' : IDL.Int,
    'updated_by' : IDL.Principal,
    'deleted' : IDL.Bool,
    'description' : IDL.Text,
    'created_at' : IDL.Int,
    'created_by' : IDL.Principal,
  });
  const PostResponse = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Opt(IDL.Text),
    'updated_at' : IDL.Int,
    'updated_by' : IDL.Principal,
    'deleted' : IDL.Bool,
    'downvote_score' : IDL.Nat,
    'body' : IDL.Text,
    'upvote_score' : IDL.Nat,
    'created_at' : IDL.Int,
    'created_by' : IDL.Principal,
    'thread_id' : IDL.Nat,
    'reply_to_post_id' : IDL.Opt(IDL.Nat),
  });
  const VoteType = IDL.Variant({ 'upvote' : IDL.Null, 'downvote' : IDL.Null });
  const NeuronId = IDL.Record({ 'id' : IDL.Vec(IDL.Nat8) });
  const VoteResponse = IDL.Record({
    'updated_at' : IDL.Int,
    'post_id' : IDL.Nat,
    'vote_type' : VoteType,
    'created_at' : IDL.Int,
    'voter_principal' : IDL.Principal,
    'voting_power' : IDL.Nat,
    'neuron_id' : NeuronId,
  });
  const ProposalThreadMappingResponse = IDL.Record({
    'sns_root_canister_id' : IDL.Principal,
    'created_at' : IDL.Int,
    'created_by' : IDL.Principal,
    'proposal_id' : IDL.Nat,
    'thread_id' : IDL.Nat,
  });
  const ProposalTopicMappingResponse = IDL.Record({
    'proposals_topic_id' : IDL.Nat,
    'forum_id' : IDL.Nat,
    'set_at' : IDL.Int,
    'set_by' : IDL.Principal,
  });
  const ForumStats = IDL.Record({
    'total_forums' : IDL.Nat,
    'total_posts' : IDL.Nat,
    'total_votes' : IDL.Nat,
    'total_topics' : IDL.Nat,
    'total_threads' : IDL.Nat,
  });
  const TopicResponse = IDL.Record({
    'id' : IDL.Nat,
    'forum_id' : IDL.Nat,
    'title' : IDL.Text,
    'updated_at' : IDL.Int,
    'updated_by' : IDL.Principal,
    'deleted' : IDL.Bool,
    'parent_topic_id' : IDL.Opt(IDL.Nat),
    'description' : IDL.Text,
    'created_at' : IDL.Int,
    'created_by' : IDL.Principal,
  });
  const TextLimits = IDL.Record({
    'thread_body_max_length' : IDL.Nat,
    'forum_description_max_length' : IDL.Nat,
    'thread_title_max_length' : IDL.Nat,
    'topic_title_max_length' : IDL.Nat,
    'forum_title_max_length' : IDL.Nat,
    'post_title_max_length' : IDL.Nat,
    'topic_description_max_length' : IDL.Nat,
    'post_body_max_length' : IDL.Nat,
  });
  const ThreadResponse = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Opt(IDL.Text),
    'updated_at' : IDL.Int,
    'updated_by' : IDL.Principal,
    'deleted' : IDL.Bool,
    'body' : IDL.Text,
    'created_at' : IDL.Int,
    'created_by' : IDL.Principal,
    'topic_id' : IDL.Nat,
  });
  const SetProposalTopicInput = IDL.Record({
    'forum_id' : IDL.Nat,
    'topic_id' : IDL.Nat,
  });
  const UpdateTextLimitsInput = IDL.Record({
    'thread_body_max_length' : IDL.Opt(IDL.Nat),
    'forum_description_max_length' : IDL.Opt(IDL.Nat),
    'thread_title_max_length' : IDL.Opt(IDL.Nat),
    'topic_title_max_length' : IDL.Opt(IDL.Nat),
    'forum_title_max_length' : IDL.Opt(IDL.Nat),
    'post_title_max_length' : IDL.Opt(IDL.Nat),
    'topic_description_max_length' : IDL.Opt(IDL.Nat),
    'post_body_max_length' : IDL.Opt(IDL.Nat),
  });
  return IDL.Service({
    'add_admin' : IDL.Func([IDL.Principal], [Result], []),
    'create_forum' : IDL.Func([CreateForumInput], [Result_1], []),
    'create_post' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Nat), IDL.Opt(IDL.Text), IDL.Text],
        [Result_1],
        [],
      ),
    'create_proposal_thread' : IDL.Func(
        [CreateProposalThreadInput],
        [Result_1],
        [],
      ),
    'create_proposal_thread_with_auto_setup' : IDL.Func(
        [CreateProposalThreadInput],
        [Result_1],
        [],
      ),
    'create_thread' : IDL.Func([CreateThreadInput], [Result_1], []),
    'create_topic' : IDL.Func([CreateTopicInput], [Result_1], []),
    'delete_forum' : IDL.Func([IDL.Nat], [Result], []),
    'delete_post' : IDL.Func([IDL.Nat], [Result], []),
    'delete_thread' : IDL.Func([IDL.Nat], [Result], []),
    'delete_topic' : IDL.Func([IDL.Nat], [Result], []),
    'get_admins' : IDL.Func([], [IDL.Vec(AdminInfo)], ['query']),
    'get_forum' : IDL.Func([IDL.Nat], [IDL.Opt(ForumResponse)], ['query']),
    'get_forum_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(ForumResponse)],
        ['query'],
      ),
    'get_forums' : IDL.Func([], [IDL.Vec(ForumResponse)], ['query']),
    'get_forums_admin' : IDL.Func([], [IDL.Vec(ForumResponse)], ['query']),
    'get_post' : IDL.Func([IDL.Nat], [IDL.Opt(PostResponse)], ['query']),
    'get_post_admin' : IDL.Func([IDL.Nat], [IDL.Opt(PostResponse)], ['query']),
    'get_post_replies' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(PostResponse)],
        ['query'],
      ),
    'get_post_replies_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(PostResponse)],
        ['query'],
      ),
    'get_post_votes' : IDL.Func([IDL.Nat], [IDL.Vec(VoteResponse)], ['query']),
    'get_posts_by_thread' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(PostResponse)],
        ['query'],
      ),
    'get_posts_by_thread_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(PostResponse)],
        ['query'],
      ),
    'get_proposal_thread' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [IDL.Opt(ProposalThreadMappingResponse)],
        ['query'],
      ),
    'get_proposals_topic' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(ProposalTopicMappingResponse)],
        ['query'],
      ),
    'get_stats' : IDL.Func([], [ForumStats], ['query']),
    'get_subtopics' : IDL.Func([IDL.Nat], [IDL.Vec(TopicResponse)], ['query']),
    'get_text_limits' : IDL.Func([], [TextLimits], ['query']),
    'get_thread' : IDL.Func([IDL.Nat], [IDL.Opt(ThreadResponse)], ['query']),
    'get_thread_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(ThreadResponse)],
        ['query'],
      ),
    'get_thread_proposal_id' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(IDL.Tuple(IDL.Nat32, IDL.Nat))],
        ['query'],
      ),
    'get_threads_by_topic' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(ThreadResponse)],
        ['query'],
      ),
    'get_threads_by_topic_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(ThreadResponse)],
        ['query'],
      ),
    'get_topic' : IDL.Func([IDL.Nat], [IDL.Opt(TopicResponse)], ['query']),
    'get_topic_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(TopicResponse)],
        ['query'],
      ),
    'get_topics_by_forum' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(TopicResponse)],
        ['query'],
      ),
    'get_topics_by_forum_admin' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(TopicResponse)],
        ['query'],
      ),
    'health_check' : IDL.Func([], [IDL.Bool], ['query']),
    'is_admin' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'remove_admin' : IDL.Func([IDL.Principal], [Result], []),
    'remove_proposals_topic' : IDL.Func([IDL.Nat], [Result], []),
    'retract_vote' : IDL.Func([IDL.Nat], [Result], []),
    'set_proposals_topic' : IDL.Func([SetProposalTopicInput], [Result], []),
    'undelete_forum' : IDL.Func([IDL.Nat], [Result], []),
    'undelete_post' : IDL.Func([IDL.Nat], [Result], []),
    'undelete_thread' : IDL.Func([IDL.Nat], [Result], []),
    'undelete_topic' : IDL.Func([IDL.Nat], [Result], []),
    'update_forum' : IDL.Func([IDL.Nat, CreateForumInput], [Result], []),
    'update_post' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text), IDL.Text],
        [Result],
        [],
      ),
    'update_text_limits' : IDL.Func([UpdateTextLimitsInput], [Result], []),
    'update_thread' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text), IDL.Text],
        [Result],
        [],
      ),
    'update_topic' : IDL.Func([IDL.Nat, CreateTopicInput], [Result], []),
    'vote_on_post' : IDL.Func([IDL.Nat, VoteType], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
