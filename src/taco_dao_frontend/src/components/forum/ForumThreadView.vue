<template>

    <div class="forum-thread-view"
        :class="[{ 'overflow-hidden': componentLoading }]">

        <!-- loading curtain -->
        <div v-show="componentLoading" class="forum-thread-view__loading-curtain">
            
            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="loading-img">
  
        </div>

        <!-- hamburger menu for small screens -->
        <div class="forum-thread-view__hamburger-menu shadow"
            @click="toggleThreadMenu"
            :style="{
                'top': proposalSelected ? '3.5rem' : '0.5rem',
                'right': proposalSelected ? '0.25rem' : '0.5rem'
            }">

            <!-- icon -->
            <i class="fa-light fa-bars forum-thread-view__hamburger-menu__icon"></i>

        </div>

        <!-- no proposal selected -->
        <div v-if="!proposalSelected && !error" class="forum-thread-view__no-thread-selected">

            <!-- twisty arrow -->
            <TwistyArrow class="twisty-arrow" />

            <!-- wiggly arrow -->
            <WigglyArrow class="wiggly-arrow" />

            <!-- no thread selected text -->
            <p>Select a proposal to discuss</p>

        </div>

        <!-- thread navigation -->
        <div v-if="proposalSelected && !error" class="forum-thread-view__navigation">

            <!-- thread navigation left -->
            <div class="forum-thread-view__navigation__left">
                
                <!-- buttons -->
                <div class="btn-group flex-wrap">

                    <!-- discussion -->
                    <button class="btn taco-nav-btn"
                            :class="{ 'taco-nav-btn--active': threadNavigation === 'discussion' }"
                            @click="threadNavigation = 'discussion'">Discussion</button>

                    <!-- voting -->
                    <!-- <button class="btn taco-nav-btn">Voting</button> -->

                    <!-- vote -->
                    <!-- <button class="btn taco-nav-btn">Vote</button> -->

                    <!-- details -->
                    <button class="btn taco-nav-btn"
                            :class="{ 'taco-nav-btn--active': threadNavigation === 'details' }"
                            @click="threadNavigation = 'details'">Details</button>

                    <!-- settings -->
                    <button class="btn taco-nav-btn"
                            :class="{ 'taco-nav-btn--active': threadNavigation === 'settings' }"
                            @click="threadNavigation = 'settings'">Settings</button>

                </div>

            </div>

            <!-- thread navigation right -->
            <div v-if="threadNavigation === 'discussion'" 
                class="forum-thread-view__navigation__right">

                <!-- sneed head tiny -->
                <img :src="sneedHeadTiny" 
                    alt="Sneed Head Tiny" 
                    class="forum-thread-view__navigation__sneed-head">
                
                <!-- powered by sneed hub -->
                <span class="forum-thread-view__navigation__powered-by">powered by <a href="https://app.sneeddao.com/hub" target="_blank">Sneed Hub</a></span>

            </div>

        </div>

        <!-- ########## -->
        <!-- discussion -->
        <!-- ########## -->

        <!-- thread header -->
        <div v-if="proposalSelected && !error && threadNavigation === 'discussion'" 
            class="forum-thread-view__header shadow">

            <!-- thread header left -->
            <div class="forum-thread-view__header__left">
                
                <!-- thread title -->
                <span v-if="proposal" class="forum-thread-view__header__title">{{ proposal.title }}</span>

            </div>

            <!-- thread header right -->
            <div class="forum-thread-view__header__right">
                
                <!-- thread create date -->
                <!-- :title="formatFullDate(currentThread.created_at)" -->
                <span v-if="proposal"
                      class="forum-thread-view__header__date"
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      :title="formatDate(proposal.createdAt)">
                    {{ formatShortDate(proposal.createdAt) }}
                </span>

                <!-- comment count, add comment button, and refresh button -->
                <div class="d-flex align-items-center flex-wrap">

                    <!-- comment count -->
                    <span class="forum-thread-view__header__comment-count">
                        {{ posts.length }} comments
                    </span>

                    <!-- refresh button -->
                    <button @click="refreshPosts"
                        class="forum-thread-view__header__refresh btn">
                        <i class="fa-solid fa-refresh"></i>
                    </button>

                </div>

            </div>

        </div>

        <!-- new comment and sort selector container -->
         <div v-if="proposalSelected && !error && posts.length > 0 && threadNavigation === 'discussion'"
                class="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mx-3">

            <!-- left -->
            <div>

                <!-- add a comment button -->
                <button v-if="!addingNewComment && userLoggedIn"
                        @click="addingNewComment = !addingNewComment, replyingToPost = null"
                        class="forum-thread-view__add-comment btn">

                    <!-- add comment icon -->
                    <i class="fa-solid fa-comment"></i>

                    <!-- add comment text -->
                    <span>Add a Comment</span>

                </button>

                <!-- login to add comment button -->
                <button v-if="!userLoggedIn" 
                        class="forum-thread-view__add-comment btn"
                        @click="iidLogIn()">

                    <!-- dfinity logo -->
                    <DfinityLogo style="width: 1.375rem;" />

                    <!-- login to add comment text -->
                    <span>Login to Comment</span>

                </button>

            </div>

            <!-- right -->
            <div class="ms-auto">

                <!-- sort selector -->
                <select v-model="sortBy" class="forum-thread-view__sort-selector">
                    <option value="newest">By Newest</option>
                    <option value="score">By Score</option>
                    <option value="oldest">By Oldest</option>
                </select>

            </div>

         </div>

        <!-- new comment -->
        <div v-if="proposalSelected && !error && addingNewComment && threadNavigation === 'discussion'" 
            class="forum-thread-view__new-comment">

            <!-- title -->
            <span class="forum-thread-view__new-comment__title">New Comment</span>

            <!-- title input container -->
            <div class="forum-thread-view__new-comment__title-input-container">

                <!-- title input -->
                <input v-model="newPostTitle" 
                        type="text" 
                        class="form-control taco-input" 
                        placeholder="Optional title…"
                        maxlength="100">

                <!-- character count -->
                <span class="forum-thread-view__new-comment__character-count">{{ newPostTitle.length }}/100</span>

            </div>

            <!-- text area container -->
            <div class="forum-thread-view__new-comment__text-area-container">

                <!-- text area -->
                <textarea v-model="newPostBody" 
                        class="form-control taco-input" 
                        placeholder="Comment…"
                        maxlength="1000"></textarea>

                <!-- character count -->
                <span class="forum-thread-view__new-comment__character-count">{{ newPostBody.length }}/1000</span>

            </div>

            <!-- buttons -->
            <div class="forum-thread-view__new-comment__buttons">

                <!-- submit button -->
                <button @click="createNewPost()"
                        :disabled="!newPostBody.trim()"
                        class="btn taco-btn taco-btn--green">Submit</button>

                <!-- cancel button -->
                <button @click="addingNewComment = false"
                        class="btn taco-btn cancel-btn">Cancel</button>

            </div>

        </div>

        <!-- thread content -->
        <div v-if="proposalSelected && !error && threadNavigation === 'discussion'" 
            class="forum-thread-view__content">

            <!-- thread posts -->
            <div class="forum-thread-view__posts">

                <!-- posts list -->
                <div v-if="posts.length > 0" class="forum-thread-view__post-list">

                    <!-- post -->
                    <div v-for="post in sortedPosts" 
                         :key="post.id.toString()" 
                         class="forum-thread-view__post shadow"
                         :class="{ 'forum-thread-view__post--collapsed': collapsedPosts.has(post.id.toString()) }"
                         :style="{ 
                             marginLeft: getPostNestingLevel(post, new Map(posts.map(p => [p.id.toString(), p]))) * 1.5 + 'rem',
                             display: isPostHidden(post) ? 'none' : 'block'
                         }">

                        <!-- post loading curtain -->
                        <div v-if="post.loading" class="forum-thread-view__post__loading-curtain">
                            
                            <!-- astronaut -->
                            <img :src="astronautLoaderUrl" class="loading-img">

                        </div>

                        <!-- post header -->
                        <div class="forum-thread-view__post-header">

                            <!-- expand/collapse button -->
                            <button @click="collapseGroup(post.id)"
                                    class="forum-thread-view__post-expand-collapse-btn">

                                <!-- minus icon -->
                                <i v-if="collapsedPosts.has(post.id.toString())" class="fa-solid fa-plus fa-fw"></i>

                                <!-- plus icon -->
                                <i v-else class="fa-solid fa-minus fa-fw"></i>

                            </button>

                            <!-- post author -->
                            <div class="forum-thread-view__post-author">
                                <span>{{ getPrincipalDisplayName(post.created_by) }}</span>
                            </div>

                            <!-- separator -->
                            <span class="forum-thread-view__post-bullet">•</span>

                            <!-- post date -->
                            <div class="forum-thread-view__post-date">

                                <!-- post date text -->
                                <span data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                :title="formatTimestampDateLong(post.created_at)">
                                    {{ formatTimestampDate(post.created_at) }}
                                </span>

                            </div>

                            <!-- post update -->
                            <div v-if="isPostEdited(post)" class="d-none forum-thread-view__post-updated">

                                <!-- update date text -->
                                <span data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                :title="formatTimestampDateLong(post.updated_at)">
                                    edited {{ formatTimestampDate(post.updated_at) }}
                                </span>

                            </div>

                        </div>
                        
                        <!-- post body -->
                        <div class="forum-thread-view__post-body">

                            <!-- post title -->
                            <p class="forum-thread-view__post-title">{{ post.title[0] }}</p>

                            <!-- post body text-->
                            <p class="forum-thread-view__post-text">{{ post.body }}</p>

                        </div>
                        
                        <!-- post footer -->
                        <div class="forum-thread-view__post-footer">

                            <!-- voting -->
                            <div class="forum-thread-view__post-voting">

                                <!-- voting top -->
                                <div class="forum-thread-view__post-voting__top">

                                    <!-- upvote button -->
                                    <button class="forum-thread-view__post-voting__upvote-btn"
                                            :class="{ 'forum-thread-view__post-voting__upvote-btn--voted': getUserVote(post.id).voteType === 'upvote' }"
                                            @click="voteOnPost(post.id, 'upvote')"
                                            :disabled="getUserVote(post.id).voting">

                                        <!-- vote arrow -->
                                        <svg class="forum-thread-view__post-voting__vote-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.087 11.252">
                                            <path fill="currentColor" d="M.909,6.24h2.225v5.012h4.816v-5.012h2.222c.239,0,.47-.093.643-.258.348-.331.363-.881.032-1.23-.01-.011-.021-.022-.032-.032h0L6.2.258h0c-.366-.348-.941-.348-1.307,0L.269,4.718c-.348.332-.362.883-.031,1.231.01.01.02.021.031.031.172.164.399.257.637.26" />
                                        </svg>

                                    </button>

                                    <!-- vote count -->
                                    <div class="forum-thread-view__post-voting__vote-count">

                                                                            <!-- vote count number -->
                                    <span class="forum-thread-view__post-voting__vote-count-number"
                                          :class="{
                                              'forum-thread-view__post-voting__vote-count-number--positive': getNetVoteScoreValue(post) > 0,
                                              'forum-thread-view__post-voting__vote-count-number--negative': getNetVoteScoreValue(post) < 0
                                          }">
                                        {{ getNetVoteScore(post) }}
                                    </span>

                                    </div>

                                    <!-- downvote button -->
                                    <button class="forum-thread-view__post-voting__downvote-btn"
                                            :class="{ 'forum-thread-view__post-voting__downvote-btn--voted': getUserVote(post.id).voteType === 'downvote' }"
                                            @click="voteOnPost(post.id, 'downvote')"
                                            :disabled="getUserVote(post.id).voting">

                                        <!-- vote arrow -->
                                        <svg class="forum-thread-view__post-voting__vote-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.087 11.252">
                                            <path fill="currentColor" d="M.909,6.24h2.225v5.012h4.816v-5.012h2.222c.239,0,.47-.093.643-.258.348-.331.363-.881.032-1.23-.01-.011-.021-.022-.032-.032h0L6.2.258h0c-.366-.348-.941-.348-1.307,0L.269,4.718c-.348.332-.362.883-.031,1.231.01.01.02.021.031.031.172.164.399.257.637.26" />
                                        </svg>

                                    </button>

                                </div>

                                <!-- voting bottom -->
                                <div class="forum-thread-view__post-voting__bottom">

                                    <!-- my vp -->
                                    <span class="forum-thread-view__post-voting__my-vp"
                                        data-bs-toggle="tooltip" 
                                        data-bs-placement="top" 
                                        title="My Voting Power">0</span>

                                </div>

                            </div>

                            <!-- reply button -->
                            <button v-if="userLoggedIn"
                                    @click="startReply(post.id), addingNewComment = false"
                                    class="forum-thread-view__post-reply-btn">

                                <!-- reply icon -->
                                <i class="fa-solid fa-comment"></i>

                                <!-- reply text -->
                                <span>Reply</span>

                            </button>

                            <!-- login to reply -->
                            <button v-else
                                    @click="iidLogIn()"
                                    class="forum-thread-view__post-reply-btn">

                                <!-- dfinity logo -->
                                <DfinityLogo style="width: 1.375rem;" />

                                <!-- login to reply text -->
                                <span>Login to Reply</span>

                            </button>

                        </div>

                        <!-- reply form -->
                        <div v-if="replyingToPost === post.id" 
                            class="forum-thread-view__post-reply">

                            <!-- reply top -->
                            <div class="forum-thread-view__post-reply__top">

                                <!-- reply body -->
                                <textarea v-model="replyBody" 
                                        placeholder="Add a comment…" 
                                        class="form-control taco-input"></textarea>

                            </div>

                            <!-- reply bottom-->
                            <div class="forum-thread-view__post-reply__bottom">

                                <!-- submit button -->
                                <button @click="submitReply(post.id)"
                                         :disabled="!replyBody.trim()"
                                         class="btn taco-btn taco-btn--green">Submit</button>

                                <!-- cancel button -->
                                <button @click="cancelReply" 
                                        class="btn taco-btn reply-cancel-btn">Cancel</button>

                            </div>

                        </div>

                    </div>

                </div>

                <!-- no posts -->
                <div v-else class="forum-thread-view__no-posts">
                    <span>No comments yet</span>
                </div>

            </div>

        </div>

        <!-- add a comment button container -->
        <div v-if="proposalSelected && !error && posts.length === 0 && threadNavigation === 'discussion'" 
            class="forum-thread-view__add-comment-container">

            <!-- login to comment -->
            <button v-if="!userLoggedIn"
                    class="forum-thread-view__add-comment btn ms-0"
                    @click="iidLogIn()">

                <!-- dfinity logo -->
                <DfinityLogo style="width: 1.375rem;" />
                
                <!-- login to post -->
                <span style="color: var(--black-to-white);">Login to Comment</span>

            </button>

            <!-- add a comment button -->
            <button v-if="userLoggedIn && !addingNewComment"
                    @click="addingNewComment = !addingNewComment"
                    class="forum-thread-view__add-comment btn ms-0">
                    
                    <!-- add comment icon -->
                    <i class="fa-solid fa-comment"></i>

                    <!-- add comment text -->
                    <span>Add a Comment</span>
                    
                </button>

        </div>

        <!-- ####### -->
        <!-- details -->
        <!-- ####### -->

        <!-- thread details -->
        <div v-if="proposalSelected && !error && threadNavigation === 'details'" 
            class="forum-thread-view__details">

            <!-- details content -->
            <div class="forum-thread-view__details__content">

                <!-- title -->
                <div class="forum-thread-view__details__title">

                    <!-- title number -->
                    <span class="forum-thread-view__details__title-number">#{{ proposal.id }}&nbsp;</span>

                    <!-- title text -->
                    <span class="forum-thread-view__details__title-text">{{ proposal.title }}</span>

                </div>                

                <!-- progress details -->
                <div class="forum-thread-view__details__progress-container">

                    <!-- top -->
                    <div class="forum-thread-view__details__progress-container__top">

                        <!-- left -->
                        <div class="forum-thread-view__details__progress-container__top__left">

                            <!-- yes percentage and count container -->
                             <div class="forum-thread-view__details__progress-container__yes-details">

                                <!-- yes percentage -->
                                <span class="forum-thread-view__details__progress-container__yes-percentage">
                                    Yes <strong>{{ (Number(proposal.yesVotes) / Number(proposal.totalVotes) * 100).toFixed(2) }}%</strong>
                                </span>

                                <!-- yes count -->
                                <span class="forum-thread-view__details__progress-container__yes-count">{{ Number((Number(proposal.yesVotes) / 100000000).toFixed(0)).toLocaleString() }} VP</span>

                             </div>

                        </div>

                        <!-- center -->
                        <div class="forum-thread-view__details__progress-container__top__center">

                            <!-- total eligable and last updated container -->
                             <div class="forum-thread-view__details__progress-container__misc-details">

                                <!-- total votes -->
                                <span class="forum-thread-view__details__progress-container__total-votes">Total Votes</span>

                                <!-- total eligable -->
                                <span class="forum-thread-view__details__progress-container__eligable-count">{{ Number((Number(proposal.totalVotes) / 100000000).toFixed(0)).toLocaleString() }} VP</span>

                             </div>

                        </div>

                        <!-- right -->
                        <div class="forum-thread-view__details__progress-container__top__right">

                            <!-- no percentage and count container -->
                             <div class="forum-thread-view__details__progress-container__no-details">

                                <!-- no percentage -->
                                <span class="forum-thread-view__details__progress-container__no-percentage">No <strong>{{ (Number(proposal.noVotes) / Number(proposal.totalVotes) * 100).toFixed(2) }}%</strong></span>

                                <!-- no count -->
                                <span class="forum-thread-view__details__progress-container__no-count">{{ Number((Number(proposal.noVotes) / 100000000).toFixed(0)).toLocaleString() }} VP</span>

                             </div>

                        </div>

                    </div>

                    <!-- bottom -->
                    <div class="forum-thread-view__details__progress-container__bottom">
                        
                        <!-- progress -->
                        <div class="progress forum-thread-view__details__progress-container__progress" 
                            role="progressbar">

                            <!-- 3% threshold -->
                            <div class="three-percent-threshold"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="bottom" 
                                title="Minimum Participation (3%): At least this much voting power must participate for the proposal to be valid">
                            </div>

                            <!-- 50% threshold -->
                            <div class="fifty-percent-threshold"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="bottom" 
                                title="Simple Majority (50%): If a simple majority is needed, and more than half of the votes are Yes, the proposal will pass">
                            </div>

                            <!-- 66.6% threshold -->
                            <div class="sixty-six-percent-threshold"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="bottom" 
                                title="Super Majority (66.66%): If a super majority is needed, and more than 2/3 of the votes are Yes, the proposal will pass">
                            </div>

                            <!-- yes progress bar -->
                            <div class="progress-bar progress-bar--yes" 
                                :style="{ width: (Number(proposal.yesVotes) / Number(proposal.totalVotes) * 100).toFixed(2) + '%' }"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="bottom" 
                                title="Yes Votes"></div>

                            <!-- no progress bar -->
                            <div class="progress-bar progress-bar--no" 
                                :style="{ width: (Number(proposal.noVotes) / Number(proposal.totalVotes) * 100).toFixed(2) + '%' }"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="bottom" 
                                title="No Votes"></div>

                        </div>

                    </div>

                </div>

                <!-- key value pairs -->
                <div class="forum-thread-view__details__key-value-pairs">
                    
                    <!-- topic -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- topic key -->
                        <span class="forum-thread-view__details__key">Topic</span>

                        <!-- topic value -->
                        <span class="forum-thread-view__details__value">
                            {{ Object.keys(proposal.topic)[0].replace(/([A-Z])/g, ' $1').trim() }}
                        </span>

                    </div>

                    <!-- description -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- description key -->
                        <span class="forum-thread-view__details__key">Description</span>

                        <!-- description value -->
                        <span class="forum-thread-view__details__value wordwrap-anywhere" v-html="proposal.summary"></span>

                    </div>

                    <!-- proposer -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- proposer key -->
                        <span class="forum-thread-view__details__key">Proposing Neuron</span>

                        <!-- proposer value -->
                        <span class="forum-thread-view__details__value">

                            <!-- proposer name -->
                            <span v-if="getProposerNeuronDisplayName(proposal.proposer) !== ''">
                                {{ getProposerNeuronDisplayName(proposal.proposer) }}&nbsp;
                            </span>

                            <!-- proposer address -->
                            <span class="wordwrap-anywhere">
                                {{ proposal.proposer }}
                            </span>

                        </span>

                    </div>

                    <!-- created -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- created key -->
                        <span class="forum-thread-view__details__key">Created</span>

                        <!-- created value -->
                        <span class="forum-thread-view__details__value">{{ proposal.createdAt }}</span>

                    </div>

                    <!-- status -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- status key -->
                        <span class="forum-thread-view__details__key">Status</span>

                        <!-- status value -->
                        <span class="forum-thread-view__details__value forum-thread-view__details__value__status"
                            :class="[{ 'forum-thread-view__details__value__passed': proposal.status === 'Executed', 'forum-thread-view__details__value__failed': proposal.status === 'Rejected' }]">
                            {{ formatStatus(proposal.status) }}
                        </span>

                    </div>

                    <!-- decided date -->
                    <div v-if="proposal.status === 'Executed' || proposal.status === 'Rejected'"    class="forum-thread-view__details__key-value-pair">
                        
                        <!-- decided date key -->
                        <span class="forum-thread-view__details__key">Decision Date</span>

                        <!-- decided date value -->
                        <span class="forum-thread-view__details__value">{{ proposal.decidedAt }}</span>
                        
                    </div>

                    <!-- execution date -->
                    <div v-if="proposal.status === 'Executed'" class="forum-thread-view__details__key-value-pair">

                        <!-- execution date key -->
                        <span class="forum-thread-view__details__key">Execution Date</span>

                        <!-- execution date value -->
                        <span class="forum-thread-view__details__value">{{ proposal.executedAt }}</span>

                    </div>

                    <!-- url -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- url key -->
                        <span class="forum-thread-view__details__key">URL</span>

                        <!-- url value -->
                        <span class="forum-thread-view__details__value">
                            <a :href="proposal.url" target="_blank"
                            class="wordwrap-anywhere"
                            style="color: var(--blue-to-light-blue);">
                                {{ proposal.url }}
                            </a>
                        </span>

                    </div>

                    <!-- links -->
                    <div class="forum-thread-view__details__key-value-pair">

                        <!-- links key -->
                        <span class="forum-thread-view__details__key">Links</span>

                        <!-- links value -->
                        <div class="forum-thread-view__details__value d-flex flex-wrap gap-3">

                            <!-- nns -->
                            <a :href="`https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=${proposal.id}`" target="_blank"
                            style="color: var(--blue-to-light-blue);">NNS</a>

                            <!-- internet computer dashboard -->
                            <a :href="`https://dashboard.internetcomputer.org/sns/lacdn-3iaaa-aaaaq-aae3a-cai/proposal/${proposal.id}`" target="_blank"
                            style="color: var(--blue-to-light-blue);">Dashboard</a>

                            <!-- ic toolkit -->
                            <a :href="`https://ic-toolkit.app/sns-management/lacdn-3iaaa-aaaaq-aae3a-cai/proposals/view/${proposal.id}`" target="_blank"
                            style="color: var(--blue-to-light-blue);">IC Toolkit</a>

                        </div>

                    </div>

                    <!-- voting info -->
                    <div class="forum-thread-view__details__voting-info mb-3">

                        <!-- voting info key -->
                        <span class="forum-thread-view__details__key">Voting Info</span>

                        <!-- voting info value -->
                        <span class="forum-thread-view__details__value">

                            <span class="d-flex flex-column gap-1 mt-2" style="font-size: 1rem;">

                                <span>There are two ways a proposal can be decided</span>

                                <span class="mt-2"><strong>Immediate majority decision:</strong></span>

                                <span>A proposal is immediately adopted or rejected if, before the voting period ends, either a simple majority or a super majority of yes votes is reached, depending on the proposal type.</span>

                                <span class="mt-2"><strong>Standard majority decision:</strong></span>

                                <span>At the end of the voting period, a proposal is adopted if either a simple majority or a super majority of yes votes is reached, depending on the proposal type, provided these votes represent at least 3% of the total voting power. Otherwise, it is rejected. Before a proposal is decided, the voting period can be extended in order to "wait for quiet". Such voting period extensions occur when a proposal's voting results turn from either a Yes majority to a No majority or vice versa.</span>

                            </span>

                        </span>

                    </div>

                </div>

            </div>

        </div>

        <!-- ######## -->
        <!-- settings -->
        <!-- ######## -->

        <!-- settings -->
        <div v-if="proposalSelected && !error && threadNavigation === 'settings'" 
            class="forum-thread-view__settings">

            <!-- settings content -->
            <div class="forum-thread-view__settings__content">

                <!-- title -->
                <span class="forum-thread-view__settings__title">⚙️ Forum Settings</span>

                <!-- settings container -->
                <div class="forum-thread-view__settings__settings-container">

                    <!-- your account title -->
                    <span class="mt-0" style="font-size: 1.5rem;">Your Account</span>

                    <!-- settings key value pairs -->
                    <div class="forum-thread-view__settings__key-value-pairs">

                        <!-- settings key value pair -->
                        <div class="forum-thread-view__settings__key-value-pair">

                            <!-- key -->
                            <span class="forum-thread-view__settings__key">

                                <!-- text -->
                                <span>Your Principal</span>

                            </span>

                            <!-- value -->
                            <span class="forum-thread-view__settings__value">

                                <!-- text -->
                                <span>{{ userPrincipal }}</span>

                            </span>

                        </div>                     

                        <!-- settings key value pair -->
                        <div class="forum-thread-view__settings__key-value-pair">

                            <!-- key -->
                            <span class="forum-thread-view__settings__key">

                                <!-- text -->
                                <span>Your Name</span>

                            </span>

                            <!-- value -->
                            <span class="forum-thread-view__settings__value">

                                <!-- text -->
                                <span v-show="!editingName" 
                                        class="">{{ currentPrincipalName }}</span>

                                <!-- edit input -->
                                <input v-show="editingName" 
                                        v-model="nameBeingEdited"
                                        type="text" 
                                        class="taco-input rounded">

                                <!-- edit button -->
                                <button @click="editingName = !editingName; nameBeingEdited = currentPrincipalName"
                                        v-show="!editingName"
                                        class="btn taco-text-black-to-white py-0"
                                        style="border: none;">

                                    <!-- edit icon -->
                                    <i class="fa-solid fa-pencil"></i>

                                </button>

                                <!-- save button -->
                                <button @click="saveAccountName"
                                        v-show="editingName"
                                        class="btn taco-text-black-to-white py-0 ms-2"
                                        style="border: none;">

                                    <!-- save icon -->
                                    <i class="fa-solid fa-check fa-lg"></i>

                                </button>

                                <!-- cancel button -->
                                <button @click="editingName = !editingName"
                                        v-show="editingName"
                                        class="btn taco-text-black-to-white py-0"
                                        style="border: none;">

                                    <!-- cancel icon -->
                                    <i class="fa-solid fa-xmark fa-lg"></i>

                                </button>

                            </span>
                            
                        </div>

                    </div>

                    <!-- your neurons title -->
                    <!-- <span class="mt-3" style="font-size: 1.5rem;">Your Neurons</span> -->

                    <!-- no neurons message -->
                    <!-- <span v-if="userNeurons.length === 0" class="fst-italic">No TACO neurons found</span> -->

                    <!-- your neurons key value pairs -->
                    <!-- v-else -->
                    <div v-if="false" class="forum-thread-view__settings__key-value-pairs pt-0">

                        <!-- settings key value pair -->
                        <div v-for="neuron in userNeurons" 
                                :key="neuron.id"
                                class="forum-thread-view__settings__key-value-pair">

                            <!-- key -->
                            <span class="forum-thread-view__settings__key">

                                <!-- text -->
                                <span>neuron name</span>

                            </span>

                            <!-- value -->
                            <span class="forum-thread-view__settings__value">

                                <!-- text -->
                                <span class="">{{ currentPrincipalName }}</span>

                                <!-- edit input -->
                                <input type="text" 
                                        class="taco-input rounded">

                                <!-- edit button -->
                                <button class="btn taco-text-black-to-white py-0"
                                        style="border: none;">

                                    <!-- edit icon -->
                                    <i class="fa-solid fa-pencil"></i>

                                </button>

                                <!-- save button -->
                                <button class="btn taco-text-black-to-white py-0 ms-2"
                                        style="border: none;">

                                    <!-- save icon -->
                                    <i class="fa-solid fa-check fa-lg"></i>

                                </button>

                                <!-- cancel button -->
                                <button class="btn taco-text-black-to-white py-0"
                                        style="border: none;">

                                    <!-- cancel icon -->
                                    <i class="fa-solid fa-xmark fa-lg"></i>

                                </button>

                            </span>
                            
                        </div>                         
                        
                    </div>

                </div>

            </div>

        </div>

        <!-- ##### -->
        <!-- error -->
        <!-- ##### -->

        <!-- error -->
        <div v-if="error" class="forum-thread-view__error-container">

            <!-- taco error image -->
            <TacoError class="forum-thread-view__error-container__image" />

            <!-- title -->
            <span class="forum-thread-view__error-container__title">Uh oh! Something went tacos up 😱</span>

            <!-- error message -->
            <span class="forum-thread-view__error-container__message">{{ error || 'none provided' }}</span>

            <!-- reload container -->
            <div class="forum-thread-view__error-container__reload-container">

                <!-- back button -->
                <button @click="error = null" class="btn taco-nav-btn taco-nav-btn--active mt-3">
                    
                    <!-- back icon -->
                    <i class="fa-solid fa-arrow-left"></i>

                    <!-- back text -->
                    <span>Back</span>

                </button>
                
                <!-- or -->
                <span style="color: var(--black-to-white);">or</span>
                
                <!-- retry button -->
                <button @click="error = null; componentLoading = true; loadThreadData().then(() => componentLoading = false)" class="btn taco-nav-btn taco-nav-btn--active mt-3">

                    <!-- reload icon -->
                    <i class="fa-solid fa-refresh"></i>

                    <!-- retry text -->
                    <span>Reload</span>
                    
                </button>

            </div>

        </div>

    </div>

</template>

<style lang="scss" scoped>

/////////////////////
// component style //
/////////////////////

.forum-thread-view {
    overflow: auto;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: var(--light-orange-to-dark-brown);
    border-top-right-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;

    // loading curtain
    &__loading-curtain {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      user-select: none;

      .loading-img {
        width: 10rem;
        user-select: none;
      }

    }    

    // hamburger menu
    &__hamburger-menu {
      display: none;
      position: absolute;
      right: 0.25rem;
      background-color: var(--brown);
      height: fit-content;
      padding: 0.5rem 0.75rem;
      border-radius: 0.25rem;
      z-index: 999;
      cursor: pointer;

      // icon
      &__icon {
        font-size: 1.5rem;
        color: white;
      }

    }
    
    // no thread selected
    &__no-thread-selected {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        gap: 1rem;
        width: 100%;
        height: 100%;

        p {
            color: var(--black-to-white);
            font-size: 1.5rem;
            text-align: center;
            transform: translateY(-3rem);
        }

        // twisty and wiggly arrows
        .twisty-arrow, .wiggly-arrow {
            color: var(--light-brown-to-dark-orange);
            transform: translateY(-3rem);
        }

        // hide wiggly arrow when not on small screens
        .wiggly-arrow { 
            display: none;
            width: 6rem;
            transform: translate(2rem, -3rem);
        }

        // show twisty arrow when on small screens
        .twisty-arrow {
            display: block;
            width: 100%;
            max-width: 27rem;
        }
    }

    // thread navigation
    &__navigation {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem 0.5rem 0.5rem;
        background-color: var(--dark-orange);
        position: sticky;
        top: 0;
        z-index: 1000;
        border-bottom: 1px solid var(--brown);

        // left
        &__left {
            // placeholder
        }
        
        // right
        &__right {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: auto;
        }

        // button group
        .btn-group {
            
            // button
            .btn {
                padding: 0.25rem 1rem;
            }

        }

        // powered by sneed hub
        &__powered-by {
            font-size: 0.875rem;
            font-family: "Space Mono";
            color: var(--white);

            a {
                color: var(--white);
            }

        }

    }

    // thread header
    &__header {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        justify-content: space-between;
        align-items: center;
        background-color: var(--dark-orange-to-light-brown);
        color: var(--black-to-white);
        margin: 1rem;
        border-radius: 0.5rem;
        padding: 0.5rem 0.5rem 0.5rem 1rem;

        // left
        &__left {
            // placeholder
        }
        
        // right
        &__right {  
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.75rem;
            margin-left: auto;
        }

        // title
        &__title {
            font-size: 1.125rem;
            font-weight: 400;
        }

        // date
        &__date {
            font-size: 1rem;
            font-weight: 400;
        }

        // comment count
        &__comment-count {
            padding: 0.25rem 0.75rem;
            border: 1px solid var(--brown);
            border-radius: 0.25rem;
            background-color: var(--light-orange);
            font-weight: 600;
            text-wrap: nowrap;
            color: var(--black);
        }

        // add comment button
        &__add-comment {
            padding: 0.2rem 0.6rem;
            color: var(--dark-brown-to-light-orange);
            margin-left: 0.25rem;
            
            // active
            &--active {
                color: var(--dark-brown);
                background-color: var(--light-orange);
                border: 1px solid var(--brown);
            }
        }

        // refresh button
        &__refresh {
            padding: 0.2rem 0.6rem;
            color: var(--dark-brown-to-light-orange);
        }

    }

    // add comment button
    &__add-comment {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--black-to-white);
        border: 1px solid var(--black-to-white);
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;

        // active
        &:active {
            color: var(--black-to-white);
            border: 1px solid var(--black-to-white);
            border-radius: 0.375rem;
        }
    }

    // sort selector
    &__sort-selector {
        font-size: 1rem;
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid var(--black-to-white);
        background-color: transparent;
        font-family: "Space Mono";
        color: var(--black-to-white);
    }    

    // new comment
    &__new-comment {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem 1rem 0.5rem;
        background-color: var(--orange-to-brown);
        border-radius: 0.5rem;
        border: 1px solid var(--dark-orange);
        margin: 1rem;

        // title container
        &__title-input-container {
            display: flex;
            flex-direction: column;
        }

        // title
        &__title {
            font-weight: 600;
            font-size: 1.125rem;
            padding-left: 0.25rem;
            color: var(--black-to-white);
        }

        // character count
        &__character-count {
            display: block;
            text-align: right;
            font-size: 0.875rem;
            color: var(--dark-brown-to-light-orange);
        }

        // input
        input, textarea {
            font-weight: 400;
            font-size: 1rem;
        }

        // buttons
        &__buttons {
            display: flex;
            gap: 0.5rem;
        }

        .cancel-btn {
            background-color: var(--light-orange);
            border: 1px solid var(--dark-orange);
            border-radius: 0.5rem;
            padding: 0.25rem 0.75rem;
        }
    }

    // error container
    &__error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        width: 100%;
        gap: 1rem;
        margin-top: 5rem;

        // image
        &__image {
            width: 100%;
            max-width: 10rem;
        }

        // title
        &__title {
            color: var(--black-to-white);
        }

        // message  
        &__message {
            color: var(--black-to-white);
        }

        // reload container 
        &__reload-container {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 1rem;

            // reload button
            .btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
        }
    }

    // thread content
    &__content {
        
    }

    // thread posts
    &__posts {
        padding: 0 1rem 2.5rem;
    }

    // post list
    &__post-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
        overflow-x: hidden;
        overflow-y: auto;
    }

    // post
    &__post {
        padding: 1rem 1rem 0.25rem 1rem;
        background-color: var(--orange-to-brown);
        border-radius: 0.5rem;
        border: 1px solid var(--dark-orange);
        color: var(--black-to-white);
        position: relative;

        // collapsed state
        &--collapsed {
            padding-bottom: 1rem;
            
            // hide post body and footer when collapsed
            .forum-thread-view__post-body,
            .forum-thread-view__post-footer,
            .forum-thread-view__post-reply {
                display: none;
            }
        }

        // post loading curtain
        &__loading-curtain {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            border-radius: 0.375rem;

            // loading img
            .loading-img {
                width: 10rem;
            }
        }

        // post header
        &-header {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
        }

        // post expand/collapse button
        &-expand-collapse-btn {
            background-color: transparent;
            border: none;
            cursor: pointer;
            border: 1px solid var(--dark-orange);
            border-radius: 0.25rem;
            margin-right: 0.5rem;

            // icon
            i {
                color: var(--black-to-white);
                font-size: 0.75rem;
            }
        }

        // post author
        &-author {
            font-weight: 600;
        }

        // post bullet
        &-bullet {
            margin: 0 0.375rem;
            transform: scale(1.5);
        }

        // post date
        &-date {
            font-size: 0.925rem;
        }

        // post updated
        &-updated {
            font-size: 0.925rem;
            margin-left: 0.75rem;

            span {
                font-style: italic;
            }
        }

        // post body
        &-body {
            margin-top: 0.75rem;
        }

        // post title
        &-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            font-size: 1.125rem;
        }

        // post text
        &-text {
            font-family: "Rubik";
            font-weight: 300;
            margin-bottom: 0;
            line-height: 1.625;
        }

        // post footer
        &-footer {
            display: flex;
            align-items: start;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.75rem;
        }

        // post voting
        &-voting {
            display: flex;
            flex-direction: column;
            align-items: center;

            // voting top
            &__top {
                display: flex;
                gap: 0.125rem;
            }

            // voting bottom
            &__bottom {
                
            }

            // upvote and downvote buttons
            &__upvote-btn, &__downvote-btn, &__vote-count {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--light-orange-to-dark-brown);
                border: 1px solid var(--dark-orange-to-dark-brown);
                border-radius: 0.25rem;
                padding: 0.5rem;
            }

            // upvote button
            &__upvote-btn {

                // vote arrow
                .forum-thread-view__post-voting__vote-arrow {
                    color: var(--success-green);
                }

                // voted state
                &--voted {
                    background-color: var(--success-green);
                    border-color: var(--success-green);

                    // vote arrow
                    .forum-thread-view__post-voting__vote-arrow {
                        color: white;
                    }
                }
            }

            // downvote button
            &__downvote-btn {
                color: var(--black);

                // vote arrow
                .forum-thread-view__post-voting__vote-arrow {
                    transform: rotate(180deg);
                    color: var(--red);
                }

                // voted state
                &--voted {
                    background-color: var(--red);
                    border-color: var(--red);

                    // vote arrow
                    .forum-thread-view__post-voting__vote-arrow {
                        color: white;
                    }
                }
            }

            // vote count
            &__vote-count {
                
                // vote count number
                &-number {
                    line-height: 0;
                    font-weight: 600;
                    color: var(--dark-gray-to-gray);

                    // positive
                    &--positive {
                        color: var(--success-green);
                    }

                    // negative
                    &--negative {
                        color: var(--red);
                    }
                }
            }

            // vote arrow
            &__vote-arrow {
                width: 0.75rem;
            }

            // my vp
            &__my-vp {
                color: var(--brown-to-light-orange);
                font-size: 0.875rem;
            }

        }

        // post reply button
        &-reply-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background-color: var(--light-orange-to-dark-brown);
            border: 1px solid var(--dark-orange-to-dark-brown);
            border-radius: 0.25rem;
            padding: 0.25rem 0.75rem;

            // icon
            i {
                color: var(--black-to-white);
                font-size: 0.875rem;
            }

            // text
            span {
                font-size: 0.875rem;
                color: var(--black-to-white);
            }

        }

        // post reply
        &-reply {

            // top
            &__top {
                margin-top: 0.5rem;
            }

            // bottom
            &__bottom {
                display: flex;
                gap: 0.25rem;
                margin: 0.5rem 0 0.25rem;
            }

            // text area
            textarea {
                font-weight: 400;
                font-size: 1rem;
            }

            // cancel button
            .reply-cancel-btn {
                background-color: var(--light-orange);
                border: 1px solid var(--dark-orange);
                color: var(--black)
            }

        }
        
    }

    // no posts
    &__no-posts {
        text-align: center;
        padding: 2rem 0 0;
        
        span {
            font-size: 1.25rem;
            color: var(--black-to-white);
        }
    }

    // add comment container
    &__add-comment-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    // details
    &__details, &__settings {
        color: var(--black-to-white);

        // content
        &__content {
            padding: 1.5rem 2rem 1rem;
        }

        // title
        &__title {
            line-height: 1.25;
            font-size: 2.25rem;

            // title number
            &-number {
                font-size: 2.25rem;
            }

            // title text
            &-text {
                font-size: 2.25rem;
            }

        }

        // progress container
        &__progress-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 1rem;
            border-top: 1px solid var(--dark-orange);
            border-bottom: 1px solid var(--dark-orange);
            padding: 1rem 0 1.5rem;

            // top
            &__top {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 0.75rem;

                // left
                &__left {
                    
                }

                // center
                &__center {
                    
                }
                
                // right
                &__right {
                    
                }

            }

            // bottom
            &__bottom {
                
            }

            // yes details
            &__yes-details {
                display: flex;
                flex-direction: column;
            }

            // yes percentage
            &__yes-percentage {
                font-size: 1.25rem;
                text-align: center;
            }

            // yes count
            &__yes-count {
                font-size: 0.875rem;
                text-align: center;
            }

            // misc details
            &__misc-details {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            // total votes
            &__total-votes {
                font-size: 1.25rem;
                text-align: center;
            }

            // eligable count
            &__eligable-count {
                font-size: 0.875rem;
                text-align: center;
            }

            // no details
            &__no-details {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }

            // no percentage
            &__no-percentage {
                font-size: 1.25rem;
                text-align: center;
            }

            // no count
            &__no-count {
                font-size: 0.875rem;
                text-align: center;
            }

            // progress
            &__progress {
                position: relative;
                background-color: var(--white-to-light-orange);

                // first progress bar
                .progress-bar--yes {
                    background-color: var(--success-green);
                }

                // second progress bar
                .progress-bar--no {
                    background-color: var(--red);   
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                }

                // progress indicator
                .three-percent-threshold {
                    position: absolute;
                    left: 3%;
                    top: 0;
                    bottom: 0;
                    background-color: var(--light-orange-to-dark-brown);
                    width: 3px;
                }

                // progress indicator
                .fifty-percent-threshold {
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    background-color: var(--light-orange-to-dark-brown);
                    width: 3px;
                }

                // progress indicator
                .sixty-six-percent-threshold {
                    position: absolute;
                    left: 66.66%;
                    top: 0;
                    bottom: 0;
                    background-color: var(--light-orange-to-dark-brown);
                    width: 3px;
                }

            }
            
        }

        // settings container
        &__settings-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 1rem;
            border-top: 1px solid var(--dark-orange);
            padding: 1rem 0 1.5rem;
        }        

        // key value pairs
        &__key-value-pairs {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding-top: 1.5rem;
        }

        // key value pair
        &__key-value-pair {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.25rem 0.75rem;
        }        

        // key
        &__key {
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            background-color: var(--dark-orange);
            color: var(--white);
            font-size: 0.875rem;
        }

        // value
        &__value {
            font-size: 1.125rem;

            // status
            &__status {
                color: var(--black-to-white);
                outline: 1px solid var(--black-to-white);
                padding: 0.125rem 0.5rem;
                border-radius: 0.25rem;
            }

            // passed
            &__passed {
                color: var(--white) !important;
                background-color: var(--success-green) !important;
                padding: 0.125rem 0.5rem;
                border-radius: 0.25rem;
                outline: none;
            }

            // failed
            &__failed {
                color: var(--white) !important;
                background-color: var(--red) !important;
                padding: 0.125rem 0.5rem;
                border-radius: 0.25rem;
                outline: none;
            }

        }
        
        // voting info
        &__voting-info {

            // voting info text
            &-text {
                
            }

        }

        // inputs
        input {
            padding: 0rem 0.5rem;
        }
        
    }

    // settings
    &__settings {
        
        // key value pairs
        &__key-value-pairs {
            padding-top: 0.5rem;
        }

    }    

}

///////////////////
// media queries //
///////////////////

// less than 390px
@media (max-width: 499.98px) {

    // hide twisty arrow
    .forum-thread-view__navigation__right {
        display: none !important;
    }
}

// phone protrait
@media (max-width: 575.98px) {
    
    // hide twisty arrow
    .twisty-arrow {
        display: none !important;
    }

    // show wiggly arrow
    .wiggly-arrow {
        display: block !important;
    }

    // show hamburger menu
    .forum-thread-view__hamburger-menu {
        display: flex !important;
        align-items: center;
        justify-content: center;
    }

    // forum thread view
    .forum-thread-view {
        border-radius: 0.5rem;
    }    

}

// phone landscape
@media (min-width: 576px) and (max-width: 767.98px) { 

    // hide twisty arrow
    .twisty-arrow {
        display: none !important;
    }

    // show wiggly arrow
    .wiggly-arrow {
        display: block !important;
    }

    // show hamburger menu
    .forum-thread-view__hamburger-menu {
        display: flex !important;
        align-items: center;
        justify-content: center;
    }

    // forum thread view
    .forum-thread-view {
        border-radius: 0.5rem;
    }    
    
}

// tablet
@media (min-width: 767px) and (max-width: 991.98px) {
    // hide twisty arrow
    .twisty-arrow {
        display: none !important;
    }

    // show wiggly arrow
    .wiggly-arrow {
        display: block !important;
    }

    // forum thread view
    .forum-thread-view {
        border-radius: 0.5rem;
    }

    // show hamburger menu
    .forum-thread-view__hamburger-menu {
        display: flex !important;
        align-items: center;
        justify-content: center;
    }

}

// // small daktop
// @media (min-width: 992px) and (max-width: 1199.98px) {
    
// }

// // medium desktop
// @media (min-width: 1200px) and (max-width: 1399.98px) {
    
// }    

</style> 

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import { ref, onMounted, computed, watch } from 'vue'
    import { useRoute } from 'vue-router'
    import { useTacoStore } from '../../stores/taco.store'
    import { storeToRefs } from 'pinia'
    import TwistyArrow from '../../assets/images/twistyArrow.vue'
    import WigglyArrow from '../../assets/images/wigglyArrow.vue'
    import SneedHeadTiny from '../../assets/images/sneed-head-tiny.png'
    import astronautLoader from '../../assets/images/astonautLoader.webp'
    import DfinityLogo from "../../assets/images/dfinityLogo.vue"
    import TacoError from '../../assets/images/tacoError.vue'
    import { Principal } from '@dfinity/principal'

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // user
    const { userLoggedIn } = storeToRefs(tacoStore) // reactive
    const { userPrincipal } = storeToRefs(tacoStore) // reactive

    // forum
    const { threadMenuOpen } = storeToRefs(tacoStore) // reactive

    // # ACTIONS #

    // user
    const { iidLogIn } = tacoStore // not reactive
    const { getPrincipalDisplayName } = tacoStore // not reactive
    const { getNeuronDisplayName } = tacoStore // not reactive
    const { setPrincipalName } = tacoStore // not reactive
    const { setNeuronName } = tacoStore // not reactive
    const { getUserNeurons } = tacoStore // not reactive

    // forum
    const { toggleThreadMenu } = tacoStore // not reactive

    /////////////////////
    // local variables //
    /////////////////////

    // router
    const route = useRoute()

    // component loading
    const componentLoading = ref(false)

    // thread navigation
    const threadNavigation = ref('discussion')

    // user votes
    const userVotes = ref<Map<string, { voteType: 'upvote' | 'downvote' | null; voting: boolean }>>(new Map())
    
    // thread data
    const threadData = ref<any>({ exists: false, mapping: null, thread: null })

    // posts
    const posts = ref<any[]>([])

    // proposal
    const proposal = ref<any>(null)

    // proposal selected
    const proposalSelected = ref(true)

    // thread has been started
    const threadStarted = ref(false)

    // replying to post
    const replyingToPost = ref<bigint | null>(null)

    // reply body
    const replyBody = ref('')

    // adding new comment
    const addingNewComment = ref(false)

    // new post title
    const newPostTitle = ref('')

    // new post body
    const newPostBody = ref('')

    // collapsed posts
    const collapsedPosts = ref<Set<string>>(new Set())

    // sort by
    const sortBy = ref('newest')

    // editing name
    const editingName = ref(false)

    // name being edited
    const nameBeingEdited = ref('')

    // user neurons
    const userNeurons = ref<any[]>([])

    // images
    const astronautLoaderUrl = astronautLoader
    const sneedHeadTiny = SneedHeadTiny

    // error
    const error = ref<string | null>(null)    

    ///////////////////
    // local methods //
    ///////////////////

    // load proposal
    const loadProposal = async () => {

        // log
        // console.log('loading proposal')

        // scroll to top before setting loading state
        const container = document.querySelector('.forum-thread-view')
        if (container) {
            container.scrollTop = 0
        }

        // set component loading to true
        componentLoading.value = true

        // try
        try {

            // nullify error
            error.value = null
            
            // try to find in already loaded proposals
            let foundProposal = findProposal()
            
            // if no proposal found
            if (!foundProposal) {

                // log
                // console.log('Proposal not in current list, fetching more...')

                // fetch more proposals
                await tacoStore.fetchTacoProposals(100)

                // try to find proposal again
                foundProposal = findProposal()

            }
            
            // if proposal found
            if (foundProposal) {

                // log
                // console.log('proposal found')

                // set proposal to found proposal
                proposal.value = foundProposal

                // load thread data
                await loadThreadData()

            } 
            
            // else
            else {

                // set error
                error.value = `Proposal #${proposalId.value} not found`

            }

        } 

        // catch
        catch (err: any) {

            // set error
            error.value = err.message || 'Failed to load proposal'

            // log error
            console.error('Error loading proposal:', err)

        } 
        
        // finally
        finally {

            // set component loading to false
            componentLoading.value = false
            
        }

    }

    // find proposal from store
    const findProposal = () => {
        return tacoStore.fetchedTacoProposals.find(p => p.id === proposalId.value)
    }

    // load thread
    const loadThreadData = async () => {

        // log
        // console.log('loading thread data')

        // try
        try {

            // get thread data
            threadData.value = await tacoStore.getProposalThread(proposalId.value!)
            
            // if thread data exists and thread exists
            if (threadData.value.exists && threadData.value.thread) {

                // load posts
                await loadPosts(threadData.value.thread.id)

                // initialize user votes
                await initializeUserVotes()

            }

        }
        
        // catch
        catch (err: any) {

            // log error
            console.error('Error loading thread data:', err)
            
            // Don't show error for missing thread - it's expected
        }

    }

    // load posts
    const loadPosts = async (threadId: bigint) => {    

        // try
        try {

            // get posts by thread
            posts.value = await tacoStore.getPostsByThread(threadId)

        } catch (err: any) {

            // log error
            console.error('Error loading posts:', err)

        }

    }

    // refresh posts
    const refreshPosts = async () => {

        // if thread id is null, just return
        if (!threadData.value.thread?.id) {
            return
        }

        // component loading
        componentLoading.value = true

        // load posts
        await loadPosts(threadData.value.thread.id)

        // component loading
        componentLoading.value = false
    }

    // initialize user votes
    const initializeUserVotes = async () => {

        // if user is not logged in or there are no posts
        if (!tacoStore.userLoggedIn || posts.value.length === 0) return
        
        // try
        try {

            // get user principal
            const userPrincipal = tacoStore.userPrincipal

            // map through posts
            const voteChecks = posts.value.map(async (post) => {

                // try
                try {

                    // get votes for post
                    const votes = await tacoStore.getPostVotes(post.id)

                    // find user vote
                    const userVote = votes.find(vote => vote.voter_principal.toString() === userPrincipal)

                    // get vote type
                    const voteType = userVote ? ('upvote' in userVote.vote_type ? 'upvote' : 'downvote') : null
                    
                    // set user vote
                    userVotes.value.set(post.id.toString(), {
                        voteType,
                        voting: false
                    })

                } 
                
                // catch
                catch (error) {

                    // log error
                    console.error('Error getting votes for post:', post.id, error)

                    // set user vote to null
                    userVotes.value.set(post.id.toString(), {
                        voteType: null,
                        voting: false
                    })

                }

            })
            
            // wait for all vote checks to complete
            await Promise.all(voteChecks)

        } 
        
        // catch
        catch (error) {

            // log error
            console.error('Error initializing user votes:', error)

        }

    }

    // start replying to a post
    const startReply = (postId: bigint) => {
        replyingToPost.value = postId
        replyBody.value = ''
        addingNewComment.value = false
    }

    // cancel reply
    const cancelReply = () => {
        replyingToPost.value = null
        replyBody.value = ''
    }

    // create reply to post
    const submitReply = async (parentPostId: bigint) => {

        // if reply body is empty
        if (!replyBody.value.trim()) {

            // hide component loading
            componentLoading.value = false

            // return
            return

        }
        
        // try
        try {

            // set post loading to true
            const post = posts.value.find(post => post.id === parentPostId)
            if (post) post.loading = true

            // nullify error
            error.value = null

            // create post
            const result = await tacoStore.createPost(
                threadData.value.thread.id,
                replyBody.value.trim(),
                parentPostId
            )
            
            // if post created successfully
            if (result.success) {

                // nullify reply body
                replyBody.value = ''

                // nullify replying to post
                replyingToPost.value = null

                // reload posts to show the new reply
                await loadPosts(threadData.value.thread.id)

                // reinitialize user votes for the updated posts
                await initializeUserVotes()

            }

        } 
        
        // catch
        catch (err: any) {

            // set error
            error.value = err.message || 'Failed to create reply'

            // log error
            console.error('Error creating reply:', err)
            
        } 
        
        // finally
        finally {

            // reload posts
            await loadPosts(threadData.value.thread.id)

            // set post loading to false
            const post = posts.value.find(post => post.id === parentPostId)
            if (post) post.loading = false

        }
        
    }

    // create new thread for proposal
    const createThread = async () => {

        // try
        try {
            
            // show component loading
            componentLoading.value = true

            // nullify error
            error.value = null
            
            // create thread
            const result = await tacoStore.createProposalThread(proposalId.value!)

            // log
            // console.log('thread creation result', result)

            // if thread created successfully
            if (result.success) {

                // log
                // console.log('thread creation successful, loading thread data')

                // reload thread data
                await loadThreadData()

            }

        } 
        
        // catch
        catch (err: any) {

            // set error
            error.value = err.message || 'Failed to create discussion thread'

            // log error
            console.error('Error creating thread:', err)

        } 
        
        // finally
        finally {

            // hide component loading
            componentLoading.value = false

        }
    }

    // create new post
    const createNewPost = async () => {

        // log
        // console.log('creating new post')

        // if new post body is empty, return
        if (!newPostBody.value.trim()) return

        // if no thread exists, create thread
        if (!threadData.value.exists) {

            // log
            // console.log('no thread exists')

            // create thread
            await createThread()

            // log
            // console.log('thread creation done')

        }
        
        // try
        try {

            // log
            // console.log('creating comment')

            // show component loading
            componentLoading.value = true

            // nullify error
            error.value = null
            
            // create post
            const result = await tacoStore.createPost(
                threadData.value.thread.id,
                newPostBody.value.trim(),
                undefined,
                newPostTitle.value.trim() || undefined
            )

            // if post created successfully
            if (result.success) {

                // log
                // console.log('post created successfully')

                // nullify new post body
                newPostBody.value = ''
                
                // reload posts to show the new post
                await loadPosts(threadData.value.thread.id)

                // reinitialize user votes for the updated posts
                await initializeUserVotes()

                // log
                // console.log('new post created successfully, hiding new post form')

                // hide new post form
                addingNewComment.value = false

            }

        } 
        
        // catch
        catch (err: any) {

            // set error
            error.value = err.message || 'Failed to create post'

            // log error
            console.error('Error creating post:', err)

        } 
        
        // finally
        finally {

            // hide new post form
            addingNewComment.value = false

            // hide component loading
            componentLoading.value = false

        }

    }    

    // check if a post should be hidden (has a collapsed ancestor)
    const isPostHidden = (post: any): boolean => {
        // if this post has no parent, it's never hidden
        if (!post.reply_to_post_id || !Array.isArray(post.reply_to_post_id) || post.reply_to_post_id.length === 0) {
            return false
        }
        
        // check if any ancestor is collapsed
        const checkAncestors = (currentPost: any): boolean => {
            if (!currentPost.reply_to_post_id || !Array.isArray(currentPost.reply_to_post_id) || currentPost.reply_to_post_id.length === 0) {
                return false
            }
            
            // check if parent is collapsed
            const parentId = currentPost.reply_to_post_id[0]
            if (collapsedPosts.value.has(parentId.toString())) {
                return true
            }
            
            // recursively check parent's ancestors
            const parentPost = posts.value.find(p => p.id === parentId)
            if (parentPost) {
                return checkAncestors(parentPost)
            }
            
            return false
        }
        
        return checkAncestors(post)
    }

    // collapse group
    const collapseGroup = (postId: bigint) => {

        // log
        // console.log('collapsing group', postId)

        // toggle collapsed state for just this post
        const postIdStr = postId.toString()
        if (collapsedPosts.value.has(postIdStr)) {
            collapsedPosts.value.delete(postIdStr)
        } else {
            collapsedPosts.value.add(postIdStr)
        }
        
    }

    // calculate net vote score (upvotes minus downvotes)
    const getNetVoteScore = (post: any) => {

        // get upvotes and downvotes
        const upvotes = Number(post.upvote_score || 0)

        // get downvotes
        const downvotes = Number(post.downvote_score || 0)

        // calculate net score
        const netScore = upvotes - downvotes
        
        // move decimal place up 8 positions and hide decimals
        const adjustedScore = Math.floor(netScore / 100000000)

        // add comma formatting
        const formattedScore = adjustedScore.toLocaleString()

        // add + prefix for positive numbers, keep - for negative
        return adjustedScore > 0 ? `+${formattedScore}` : formattedScore

    }

    // get numeric value for vote score (for conditional styling)
    const getNetVoteScoreValue = (post: any) => {

        // get upvotes and downvotes
        const upvotes = Number(post.upvote_score || 0)

        // get downvotes
        const downvotes = Number(post.downvote_score || 0)

        // calculate net score
        const netScore = upvotes - downvotes
        
        // move decimal place up 8 positions and hide decimals
        return Math.floor(netScore / 100000000)

    }

    // get user's current vote for a post
    const getUserVote = (postId: bigint) => {

        // return user vote or default to null
        return userVotes.value.get(postId.toString()) || { voteType: null, voting: false }
        
    }

    // vote on a post
    const voteOnPost = async (postId: bigint, voteType: 'upvote' | 'downvote') => {

        // if user is not logged in, return
        if (!tacoStore.userLoggedIn) return
        
        // get user's current vote
        const currentVote = getUserVote(postId)
        
        // try
        try {

            // set post loading to true
            const post = posts.value.find(post => post.id === postId)
            if (post) post.loading = true   

            // set voting state
            userVotes.value.set(postId.toString(), {
                ...currentVote,
                voting: true
            })
            
            // if user is clicking the same vote type
            if (currentVote.voteType === voteType) {

                // retract vote
                await tacoStore.retractVote(postId)

                // set user vote to null
                userVotes.value.set(postId.toString(), {
                    voteType: null,
                    voting: false
                })

            } 
            
            // else
            else {

                // vote or change vote
                await tacoStore.voteOnPost(postId, voteType)

                // set user vote to the new vote type
                userVotes.value.set(postId.toString(), {
                    voteType,
                    voting: false
                })

            }
            
            // refresh posts
            if (threadData.value.exists && threadData.value.thread) {

                // load posts
                await loadPosts(threadData.value.thread.id)

                // reinitialize user votes
                await initializeUserVotes()

            }
            
        } 
        
        // catch
        catch (error: any) {

            // log error
            console.error('Error voting on post:', error)

            // set user vote to null
            userVotes.value.set(postId.toString(), {
                ...currentVote,
                voting: false
            })
            
            // show error toast
            tacoStore.addToast({
                id: Date.now(),
                code: 'vote-error',
                title: 'Vote Failed',
                icon: 'fa-solid fa-exclamation-triangle',
                message: `Failed to vote: ${error.message || 'Unknown error'}`
            })

        }

        // finally
        finally {

            // set post loading to false
            const post = posts.value.find(post => post.id === postId)
            if (post) post.loading = false

        }

    }

    // calculate nesting level for a post
    const getPostNestingLevel = (post: any, postsMap: Map<string, any>): number => {
        if (!post.reply_to_post_id || !Array.isArray(post.reply_to_post_id) || post.reply_to_post_id.length === 0) {
            return 0 // top level post
        }
        
        // find the first parent post (assuming single parent for simplicity)
        const parentId = post.reply_to_post_id[0]
        const parentPost = postsMap.get(parentId.toString())
        
        if (!parentPost) {
            return 0 // parent not found, treat as top level
        }
        
        // recursively calculate parent's nesting level and add 1
        return getPostNestingLevel(parentPost, postsMap) + 1
    }

    // calculate post score for sorting (similar to organizePostsTree)
    const calculatePostScore = (post: any) => {
        return getNetVoteScoreValue(post)
    }

    // flatten tree structure into ordered list
    const flattenPostTree = (posts: any[]): any[] => {
        const result: any[] = []
        
        posts.forEach(post => {
            result.push(post)
            if (post.replies && post.replies.length > 0) {
                result.push(...flattenPostTree(post.replies))
            }
        })
        
        return result
    }

    // check if post was edited (at least 1 minute apart)
    const isPostEdited = (post: any) => {
        // convert nanoseconds to milliseconds
        const createdMs = Number(post.created_at) / 1_000_000
        const updatedMs = Number(post.updated_at) / 1_000_000
        
        // calculate time difference in seconds
        const timeDiffSeconds = (updatedMs - createdMs) / 1000
        
        // only show edited if difference is 60+ seconds (1 minute)
        return timeDiffSeconds >= 60
    }

    // convert proposer string to neuron display name
    const getProposerNeuronDisplayName = (proposerString: string) => {
        if (!proposerString) return ''
        
        // convert the proposer string to Uint8Array (neuron ID)
        const neuronIdBytes = new Uint8Array(proposerString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
        
        // SNS root canister ID
        const snsRoot = Principal.fromText('lacdn-3iaaa-aaaaq-aae3a-cai')
        
        return getNeuronDisplayName(snsRoot, neuronIdBytes)
    }

    // format status
    const formatStatus = (status: string) => {
      if (status === "Executed") return "PASSED"
      if (status === "Rejected") return "FAILED"
      return status
    }

    // save account name
    const saveAccountName = async () => {

        // log
        console.log('saving account name')

        // if name is empty, return
        if (!nameBeingEdited.value.trim()) return     
        
        // if name being edited is the same as the current principal name, return
        if (nameBeingEdited.value.trim() === currentPrincipalName.value) return

        // try
        try {

            // log
            console.log('trying to save account name', nameBeingEdited.value.trim())

            // show loading curtain
            componentLoading.value = true

            // set account name
            await setPrincipalName(nameBeingEdited.value.trim())

            // log
            console.log('account name saved successfully')
            
        }

        // catch
        catch (error) {

            // log error
            console.error('Error saving account name:', error)

            // show error toast
            tacoStore.addToast({
                id: Date.now(),
                code: 'save-account-name-error',
                title: 'Error Saving Account Name',
                icon: 'fa-solid fa-exclamation-triangle',
                message: `Failed to save account name: ${error.message || 'Unknown error'}`
            })

        }

        // finally
        finally {

            // close editing name
            editingName.value = false

            // hide loading curtain
            componentLoading.value = false

        }

    }

    // load user neurons
    const loadUserNeurons = async () => {

        // if user is not logged in, return
        if (!userLoggedIn.value) return
        
        // try
        try {
            
            // get user neurons
            const neurons = await getUserNeurons()

            // set user neurons
            userNeurons.value = neurons
            
            // // Initialize input refs for each neuron
            // neurons.forEach(neuron => {
            //     const key = neuronKey(neuron)
            //     neuronNameInputs.value[key] = ''
            //     neuronNameSaving.value[key] = false
            // })
            
            // log
            console.log('loaded user neurons:', neurons)

        } 
        
        // catch
        catch (error) {

            // log error
            console.error('error loading user neurons:', error)

            // set user neurons to empty array
            userNeurons.value = []
            
        } 
        
        // finally
        finally {
            
            // code

        }

    }

    // // save neuron name (not massaged yet)
    // const saveNeuronName = async (neuronId) => {

    //     // log
    //     console.log('saving neuron name', neuronId)

    //     // get key
    //     const key = neuronKey({ id: neuronId })

    //     // get name
    //     const name = neuronNameInputs.value[key]

    //     // if name is empty, return
    //     if (!name?.trim()) return
        
    //     // try
    //     try {

    //         // show loading curtain
    //         componentLoading.value = true

    //         // set neuron name saving to true
    //         neuronNameSaving.value[key] = true

    //         // get taco sns root
    //         const tacoSnsRoot = Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai') // TACO SNS root

    //         // set neuron name
    //         await setNeuronName(tacoSnsRoot, neuronId.id, name.trim())

    //         // set neuron name inputs to empty string
    //         neuronNameInputs.value[key] = ''

    //         // log success
    //         console.log('neuron name saved successfully')

    //     } 
        
    //     // catch
    //     catch (error) {

    //         // log error
    //         console.error('error saving neuron name:', error)

    //         // show error toast
    //         tacoStore.addToast({
    //             id: Date.now(),
    //             code: 'save-neuron-name-error',
    //             title: 'Error Saving Neuron Name',
    //             icon: 'fa-solid fa-exclamation-triangle',
    //             message: `Failed to save neuron name: ${error.message || 'Unknown error'}`
    //         })

    //     } 
        
    //     // finally
    //     finally {

    //         // set neuron name saving to false
    //         neuronNameSaving.value[key] = false

    //         // hide loading curtain
    //         componentLoading.value = false

    //     }
        
    // }

    // not massaged yet

    // // neuron key
    // const neuronKey = (neuron) => {
    //     if (neuron.id && neuron.id.id) {
    //         return Array.from(neuron.id.id, byte => byte.toString(16).padStart(2, '0')).join('')
    //     }
    //     return 'unknown'
    // }

    // // format neuron id
    // const formatNeuronId = (neuronId) => {
    //     if (neuronId && neuronId.id) {
    //         const hex = Array.from(neuronId.id, byte => byte.toString(16).padStart(2, '0')).join('')
    //         return hex.length > 12 ? `${hex.substring(0, 6)}...${hex.substring(hex.length - 6)}` : hex
    //     }
    //     return 'Unknown'
    // }

    // // get neuron current name
    // const getNeuronCurrentName = (neuronId) => {
    //     if (neuronId && neuronId.id) {
    //         const tacoSnsRoot = Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai') // TACO SNS root
    //         return getNeuronDisplayName(tacoSnsRoot, neuronId.id)
    //     }
    //     return 'Unknown'
    // }    

    // date formatting
    const formatShortDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }    
    const formatTimestampDate = (timestamp: bigint) => {
        // convert nanoseconds to milliseconds for Date constructor
        const milliseconds = Number(timestamp) / 1_000_000
        return new Date(milliseconds).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }
    const formatTimestampDateLong = (timestamp: bigint) => {
        // convert nanoseconds to milliseconds for Date constructor
        const milliseconds = Number(timestamp) / 1_000_000
        return new Date(milliseconds).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    //////////////
    // computed //
    //////////////

    // proposal id as bigint
    const proposalId = computed(() => {

        // get id from route params
        const id = route.params.id as string

        // return proposal id if id exists, otherwise null
        return id ? BigInt(id) : null

    })

    // sorted posts using organizePostsTree logic
    const sortedPosts = computed(() => {
        
        // if there are no posts, return an empty array
        if (!posts.value.length) return []
        
        // create a map of all posts with replies array
        const postMap = new Map()
        const rootPosts: any[] = []

        // initialize all posts in the map with empty replies array
        posts.value.forEach(post => {

            // set post id as key and post data as value in the map
            postMap.set(Number(post.id), { ...post, replies: [] })

        })

        // organize into tree structure
        posts.value.forEach(post => {

            // get post data from map
            const postData = postMap.get(Number(post.id))

            // if post has a parent
            if (post.reply_to_post_id && Array.isArray(post.reply_to_post_id) && post.reply_to_post_id.length > 0) {

                // get parent id
                const parentId = Number(post.reply_to_post_id[0])

                // get parent from map
                const parent = postMap.get(parentId)
                
                // if parent exists
                if (parent) {

                    // add post to parent's replies
                    parent.replies.push(postData)

                } 
                
                // else
                else {

                    // parent not found, treat as root post
                    rootPosts.push(postData)

                }
                
            } 
            
            // else
            else {

                // add post to root posts
                rootPosts.push(postData)

            }

        })

        // recursive function to sort replies based on sortBy value
        const sortReplies = (post: any) => {
            switch (sortBy.value) {
                case 'newest':
                    post.replies.sort((a: any, b: any) => Number(b.created_at) - Number(a.created_at))
                    break
                case 'oldest':
                    post.replies.sort((a: any, b: any) => Number(a.created_at) - Number(b.created_at))
                    break
                case 'score':
                    post.replies.sort((a: any, b: any) => calculatePostScore(b) - calculatePostScore(a))
                    break
            }
            
            // recursively sort replies
            post.replies.forEach(sortReplies)
        }

        // sort root posts based on sortBy value
        switch (sortBy.value) {
            case 'newest':
                rootPosts.sort((a, b) => Number(b.created_at) - Number(a.created_at))
                break
            case 'oldest':
                rootPosts.sort((a, b) => Number(a.created_at) - Number(b.created_at))
                break
            case 'score':
                rootPosts.sort((a, b) => calculatePostScore(b) - calculatePostScore(a))
                break
        }
        
        rootPosts.forEach(sortReplies)

        // flatten the tree structure back to a flat array for the template
        return flattenPostTree(rootPosts)
        
    })

    // current principal name
    const currentPrincipalName = computed(() => {
        
        // get principal display name
        return getPrincipalDisplayName(userPrincipal.value)

    })

    //////////////
    // watchers //
    //////////////

    // watch for route change
    watch(() => route.path, async (newPath) => {

        // log
        // console.log('ForumThreadView: route changed')

        // if proposalId is not null
        if (proposalId.value) {
            
            // log
            // console.log('a proposal was selected')

            // set proposal selected to true
            proposalSelected.value = true

            // clear posts
            posts.value = []

            // load proposal
            await loadProposal()

        } else {

            // log
            // console.log('no proposal was selected')

            // set proposal selected to false
            proposalSelected.value = false

        }

    })

    // watch for logout
    watch(() => userLoggedIn.value, async (newVal) => {

        // log
        // console.log('user logged in changed to', newVal)

        // if user is logged out
        if (!newVal) {

            // set adding new comment to false
            addingNewComment.value = false

            // set replying to post to null
            replyingToPost.value = null

        }

    })
  
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // on mounted
    onMounted(async () => {

        // log
        // console.log('forum discussion view mounted')

        // if proposalId is not null
        if (proposalId.value) {

            // log
            // console.log('a proposal is already selected')

            // load proposal
            await loadProposal()

        } else {

            // log
            // console.log('no proposal selected yet')

            // set proposal selected to false
            proposalSelected.value = false

        }

        // if user is logged in
        if (userLoggedIn.value) {

            // log
            console.log('user is logged in, loading user neurons')

            // load user neurons
            await loadUserNeurons()
            
        }

    })

</script>