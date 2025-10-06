<template>

    <div class="standard-view">

        <!-- header bar -->
        <HeaderBar />

        <!-- scroll container -->
        <div class="scroll-y-container h-100">

            <!-- bootstrap container -->
            <div class="container p-0">

                <!-- bootstrap row -->
                <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

                    <!-- main content -->
                    <div class="nns-vote-view">

                        <!-- title container -->
                        <div class="d-flex align-items-center">

                            <!-- nns vote title -->
                            <h1 class="taco-title
                                       mb-4 mt-4 px-3">
                                <span class="taco-title__icon">🗳️</span>
                                <span class="taco-title__title">NNS Proposal Voting</span>
                            </h1>

                        </div>

                        <!-- top bar -->
                        <div class="nns-vote-view__top-bar gap-2 mb-4 shadow">

                            <!-- left-->
                            <div class="d-flex align-items-center ps-3 gap-0-2 flex-wrap">

                                <!-- if logged out, log in title -->
                                <h2 v-if="!userLoggedIn" class="nns-vote-view__top-bar__title py-2">
                                    Log in to Vote
                                </h2>

                                <!-- if logged in, nns voting title -->
                                <h2 v-if="userLoggedIn" class="nns-vote-view__top-bar__title py-2">

                                    <span class="whitespace-nowrap">Welcome, &hellip;{{ truncatedPrincipal }}&nbsp;</span>

                                    <span class="nns-vote-view__top-bar__vote-power text-nowrap">({{ votePower }} VP)</span>                                  

                                </h2>

                                <!-- refresh voting power button -->
                                <button v-if="userLoggedIn"
                                    class="btn btn-sm px-2 py-1 ms-auto"
                                    style="background-color: var(--yellow); color: var(--black); border-color: var(--yellow);"
                                    @click="refreshVotingPower"
                                    :class="{'disabled': refreshingVP}">

                                    <!-- refresh icon -->
                                    <span v-if="!refreshingVP">Refresh</span>
                                    <span v-if="refreshingVP">Refreshing</span>

                                </button>                                  

                            </div>

                            <!-- right -->
                            <div class="d-flex gap-2 flex-wrap ms-auto">

                                <!-- if logged out, login button -->
                                <button v-if="!userLoggedIn" class="btn iid-login" @click="iidLogIn">

                                    <!-- dfinity logo -->
                                    <DfinityLogo />

                                    <!-- login text -->
                                    <span class="taco-text-white">Login</span>

                                </button>

                                <!-- if logged in, refresh button -->
                                <button v-if="userLoggedIn" 
                                        class="btn taco-nav-btn taco-nav-btn--active"
                                        @click="refreshData">

                                    <span class="taco-text-black">
                                        {{ componentLoading ? 'Refreshing' : 'Refresh Proposal Data' }}
                                    </span>

                                </button>

                            </div>

                        </div>

                        <!-- logged out content -->
                        <div v-if="!userLoggedIn" 
                            class="nns-vote-view__logged-out-content">

                            <i class="fa-solid fa-gavel"></i>

                            <div class="login-curtain">
                                <button class="btn iid-login" @click="iidLogIn">
                                    <DfinityLogo />
                                    <span class="taco-text-white">Login to vote</span>
                                </button>
                            </div>

                        </div>

                        <!-- error container -->
                        <div v-else-if="error"
                             class="taco-container taco-container--l1
                                    p-4 d-flex flex-column align-items-center gap-0 mb-4 shadow">

                            <!-- error icon -->
                            <i class="fa-solid fa-exclamation-triangle fa-4x mt-3 mb-2"
                                style="color: var(--dark-orange);"></i>

                            <!-- error message -->
                            <p class="taco-text-black-to-white mb-4 text-center">{{ error }}</p>
                            
                            <!-- back to forum button -->
                            <router-link to="/chat/forum" 
                                         class="btn taco-btn taco-btn--green taco-btn--big mb-2"
                                         style="max-width: 24rem;">
                                Back to Forum
                            </router-link>

                        </div>                        

                        <!-- voting disabled notice -->
                        <div v-else-if="daoAlreadyVoted" 
                             class="taco-container taco-container--l1
                                    d-flex flex-column align-items-center flex-column mb-4 shadow">

                            <!-- clock icon -->
                            <i class="fa-solid fa-clock fa-4x mt-4"
                                style="color: var(--dark-brown-to-white);"></i>

                            <!-- voting closed text -->
                            <h4 class="mb-0 text-center"
                                style="color: var(--dark-brown-to-white);">Voting Closed</h4>

                            <!-- voting closed message -->
                            <p class="mb-2 text-center"
                                style="color: var(--dark-brown-to-white);">
                                Voting has concluded for this NNS proposal
                            </p>

                            <!-- back to forum button -->
                            <router-link to="/chat/forum" 
                                         class="btn taco-btn taco-btn--green taco-btn--big mb-3"
                                         style="max-width: 24rem;">
                                Back to Forum
                            </router-link>                            

                        </div>

                        <!-- proposals container -->
                        <div v-else 
                             class="nns-vote-view__proposals 
                                    d-flex flex-column gap-4">

                            <!-- NNS proposal section -->
                            <div class="taco-container taco-container--l1 shadow">

                                <!-- NNS proposal title -->
                                <div class="taco-container taco-container--l2 taco-container--l2--dark 
                                            d-flex flex-wrap justify-content-between align-items-center p-2">

                                    <!-- NNS proposal title text -->
                                    <h3 class="taco-text-white mb-0 py-1 px-2"
                                        style="font-size: 1.125rem;">🌐 Original NNS Proposal</h3>

                                    <!-- NNS proposal title link -->
                                    <a :href="nnsProposalLink" target="_blank"
                                        class="btn taco-btn taco-btn--green btn-sm ms-auto">
                                        View on NNS
                                    </a>
                                        
                                </div>

                                <!-- NNS proposal details -->
                                <div v-if="nnsProposal" class="pt-3">

                                    <!-- title -->
                                    <h4 style="color: var(--dark-brown-to-white);">
                                        #{{ nnsProposalId }} {{ nnsProposal.title || 'NNS Proposal' }}
                                    </h4>

                                    <!-- NNS voting progress -->
                                    <div v-if="nnsProposal.latest_tally" class="mb-3">

                                        <!-- vote percentages -->
                                        <div class="d-flex justify-content-between mb-1">

                                            <!-- yes vote percentage -->
                                            <span class="d-inline-flex flex-column align-items-center fw-bold pe-2"
                                                  style="color: var(--dark-brown-to-white);">
                                                <span>Yes</span>
                                                <span>{{ (Number(nnsProposal.latest_tally.yes) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) }}%</span>
                                            </span>

                                            <!-- total vote percentage -->
                                            <span class="d-inline-flex flex-column align-items-center fw-bold"
                                                style="color: var(--dark-brown-to-white);">
                                                <span class="text-center">Total Votes</span>
                                                <span class="text-center">{{ Number((Number(nnsProposal.latest_tally.total) / 100000000).toFixed(0)).toLocaleString() }} VP</span>
                                            </span>

                                            <!-- no vote percentage -->
                                            <span class="d-inline-flex flex-column align-items-center fw-bold ps-2"
                                                  style="color: var(--dark-brown-to-white);">
                                                <span>No</span>
                                                <span>{{ (Number(nnsProposal.latest_tally.no) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) }}% </span>
                                            </span>

                                        </div>

                                        <!-- progress bar -->
                                        <div class="progress mb-2 d-flex justify-content-between" 
                                             style="height: 20px; background-color: var(--white-to-light-orange);">
                                            
                                            <div class="progress-bar"
                                                :style="{ width: (Number(nnsProposal.latest_tally.yes) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) + '%' }"
                                                style="background-color: var(--success-green);">
                                            </div>

                                            <div class="progress-bar"
                                                :style="{ width: (Number(nnsProposal.latest_tally.no) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) + '%' }"
                                                style="background-color: var(--red);">
                                            </div>

                                        </div>

                                    </div>

                                    <!-- NNS proposal topic -->
                                    <div class="d-flex flex-column mb-3">

                                        <span class="fw-bold"
                                              style="color: var(--dark-brown-to-white);">TOPIC</span>

                                        <span class="taco-text-black-to-white">
                                            {{getNNSTopicName(nnsProposal.topic) }}
                                        </span>

                                    </div>

                                    <!-- NNS proposal description -->
                                    <div class="d-flex flex-column mb-2">

                                        <span class="fw-bold"
                                              style="color: var(--dark-brown-to-white);">DESCRIPTION</span>

                                        <span class="taco-text-black-to-white"
                                              v-html="nnsProposal.summary || 'No description available'"></span>

                                    </div>

                                </div>

                            </div>

                            <!-- SNS proposal section -->
                            <div class="taco-container taco-container--l1 shadow">

                                <!-- SNS proposal title -->
                                <div class="taco-container taco-container--l2 taco-container--l2--dark 
                                            d-flex flex-wrap justify-content-between align-items-center p-2">

                                    <!-- SNS proposal title text -->
                                    <h3 class="taco-text-white mb-0 py-1 px-2"
                                        style="font-size: 1.125rem;">💬 Taco Forum Discussion</h3>

                                    <!-- SNS proposal title link -->
                                    <router-link :to="`/chat/forum/${snsProposalId}`"
                                        class="btn taco-btn taco-btn--green btn-sm ms-auto">
                                        View Discussion
                                    </router-link>
                                        
                                </div>

                                <!-- SNS proposal details -->
                                <!-- v-if="snsProposal" -->
                                <div class="pt-3">

                                    <!-- title -->
                                    <h4 style="color: var(--dark-brown-to-white);">
                                        #{{ snsProposal.id }} {{ snsProposal.title }}
                                    </h4>

                                    <!-- SNS voting progress -->
                                    <div class="mb-3">

                                        <!-- vote percentages -->
                                        <div class="d-flex justify-content-between mb-1">

                                            <span class="d-inline-flex flex-column align-items-center fw-bold pe-2"
                                                  style="color: var(--dark-brown-to-white);">
                                                <span>Yes</span>
                                                <span>{{ snsProposal.totalVotes > 0 ? (Number(snsProposal.yesVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) : 0 }}%</span>
                                            </span>

                                            <span class="d-inline-flex flex-column align-items-center fw-bold"
                                                style="color: var(--dark-brown-to-white);">
                                                <span class="text-center">Total Votes</span>
                                                <span class="text-center">{{ Number((Number(snsProposal.totalVotes) / 100000000).toFixed(0)).toLocaleString() }} VP</span>
                                            </span>

                                            <span class="d-inline-flex flex-column align-items-center fw-bold ps-2"
                                                  style="color: var(--dark-brown-to-white);">
                                                <span>No</span>
                                                <span>{{ snsProposal.totalVotes > 0 ? (Number(snsProposal.noVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) : 0 }}%</span>
                                            </span>

                                        </div>

                                        <!-- progress bar -->
                                        <div class="progress mb-2 d-flex justify-content-between" 
                                            style="height: 20px; background-color: var(--white-to-light-orange);">

                                            <div class="progress-bar"
                                                :style="{ width: snsProposal.totalVotes > 0 ? (Number(snsProposal.yesVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) + '%' : '0%' }"
                                                style="background-color: var(--success-green);">
                                            </div>

                                            <div class="progress-bar"
                                                :style="{ width: snsProposal.totalVotes > 0 ? (Number(snsProposal.noVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) + '%' : '0%' }"
                                                style="background-color: var(--red);">
                                            </div>

                                        </div>

                                    </div>

                                    <!-- SNS proposal statue -->
                                    <div class="d-flex flex-column mb-3">

                                        <span class="fw-bold"
                                              style="color: var(--dark-brown-to-white);">STATUS</span>

                                        <span class="taco-text-black-to-white">{{ snsProposal.status }}</span>

                                    </div>

                                    <!-- SNS proposal description -->
                                    <div class="d-flex flex-column mb-2">

                                        <span class="fw-bold"
                                              style="color: var(--dark-brown-to-white);">DESCRIPTION</span>

                                        <span class="taco-text-black-to-white" 
                                             v-html="snsProposal.summary"></span>

                                    </div>

                                </div>

                            </div>

                            <!-- DAO vote tally section -->
                            <div class="taco-container taco-container--l1 shadow">

                                <!-- DAO vote tally title -->
                                <div class="taco-container taco-container--l2 taco-container--l2--dark 
                                            d-flex flex-wrap justify-content-between align-items-center p-2">

                                    <!-- DAO vote tally title text -->
                                    <h3 class="taco-text-white mb-0 py-1 px-2"
                                        style="font-size: 1.125rem;">⚖️ Taco Dao Votes</h3>

                                    <!-- DAO vote tally title link -->
                                    <button @click="refreshDAOVotes" class="btn taco-btn taco-btn--green btn-sm ms-auto"
                                        :disabled="componentLoading">
                                        {{ componentLoading ? 'Refreshing...' : 'Refresh Votes' }}
                                    </button>
                                        
                                </div>

                                <!-- DAO vote tally details -->
                                <div v-if="daoVoteTally && daoVoteTally.total_voting_power !== undefined" class="pt-3">

                                    <!-- title -->
                                    <h4 style="color: var(--dark-brown-to-white);">
                                        How the DAO is voting
                                    </h4>                                
                                    
                                    <!-- vote percentages -->
                                    <div class="d-flex justify-content-between mb-1">

                                        <span class="d-inline-flex flex-column align-items-center fw-bold pe-2"
                                                  style="color: var(--dark-brown-to-white);">
                                            <span>Yes</span>
                                            <span>{{ daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.adopt_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) : 0 }}%</span>
                                        </span>

                                        <span class="d-inline-flex flex-column align-items-center fw-bold"
                                            style="color: var(--dark-brown-to-white);">
                                            <span class="text-center">Total Votes</span>
                                            <span class="text-center">{{ Number((Number(daoVoteTally.total_voting_power) / 100000000).toFixed(0)).toLocaleString() }} VP</span>
                                        </span>

                                        <span class="d-inline-flex flex-column align-items-center fw-bold ps-2"
                                              style="color: var(--dark-brown-to-white);">
                                            <span>No</span>
                                            <span>{{ daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.reject_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) : 0 }}%</span>
                                        </span>

                                    </div>

                                    <!-- progress bar -->
                                    <div class="progress mb-3 d-flex justify-content-between" 
                                        style="height: 20px; background-color: var(--white-to-light-orange);">

                                        <div class="progress-bar"
                                            :style="{ width: daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.adopt_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) + '%' : '0%' }"
                                            style="background-color: var(--success-green);">
                                        </div>

                                        <div class="progress-bar"
                                            :style="{ width: daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.reject_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) + '%' : '0%' }"
                                            style="background-color: var(--red);">
                                        </div>

                                    </div>

                                    <!-- DAO vote stats -->
                                    <div class="d-flex justify-content-around flex-wrap gap-3-5">

                                        <div class="d-flex flex-column align-items-center">

                                            <span class="fw-bold text-center"
                                                  style="color: var(--dark-brown-to-white);">ADOPT VOTES</span>

                                            <span class="taco-text-black-to-white">
                                                {{ daoVoteTally.adopt_votes }} neurons
                                            </span>

                                        </div>

                                        <div class="d-flex flex-column align-items-center">

                                            <span class="fw-bold text-center"
                                                  style="color: var(--dark-brown-to-white);">REJECT VOTES</span>

                                            <span class="taco-text-black-to-white">
                                                {{ daoVoteTally.reject_votes}} neurons
                                            </span>

                                        </div>

                                        <div class="d-flex flex-column align-items-center">

                                            <span class="fw-bold text-center"
                                                  style="color: var(--dark-brown-to-white);">TOTAL PARTICIPANTS</span>

                                            <span class="taco-text-black-to-white">
                                                {{ daoVoteTally.total_votes }} neurons
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <!-- no DAO votes yet -->
                                <div v-else-if="!daoVoteTally || daoVoteTally.total_voting_power === undefined || daoVoteTally.total_votes === 0">

                                    <!-- no votes container -->
                                    <div class="my-4 px-3 text-center">

                                        <!-- no votes icon -->
                                        <div class="mb-1" style="font-size: 2.5rem;">⚖️</div>

                                        <!-- no votes text -->
                                        <p class="taco-text-black-to-white">No DAO votes cast yet. Be the first to vote!</p>

                                    </div>

                                </div>

                            </div>

                            <!-- voting interface section -->
                            <div v-if="userLoggedIn && !daoAlreadyVoted" class="taco-container taco-container--l1 shadow mb-4">

                                <!-- voting interface title -->
                                <div class="taco-container taco-container--l2 taco-container--l2--dark 
                                            d-flex flex-wrap justify-content-between align-items-center p-2">

                                    <!-- voting interface title text -->
                                    <h3 class="taco-text-white mb-0 py-1 px-2"
                                        style="font-size: 1.125rem;">🗳️ Cast Your Vote</h3>
                                        
                                </div>

                                <!-- simple voting interface for now -->
                                <div v-if="userNeurons.length > 0" class="mt-4 mb-2">

                                    <!-- select decision -->
                                    <div class="d-flex gap-3 justify-content-center">

                                        <!-- adopt button -->
                                        <button @click="voteDecision = 'Adopt'"
                                            class="btn taco-btn taco-btn--big cast-btn gap-2"
                                            :class="voteDecision === 'Adopt' ? 'taco-btn--success' : 'not-selected'">
                                            <i class="fa-solid fa-thumbs-up"></i> Adopt
                                        </button>

                                        <!-- reject button -->
                                        <button @click="voteDecision = 'Reject'"
                                            class="btn taco-btn taco-btn--big cast-btn gap-2"
                                            :class="voteDecision === 'Reject' ? 'taco-btn--danger' : 'not-selected'">
                                            <i class="fa-solid fa-thumbs-down"></i> Reject
                                        </button>

                                    </div>

                                    <!-- submit vote -->
                                    <div v-if="voteDecision" class="text-center d-flex flex-column align-items-center mt-4">

                                        <!-- submit vote button -->
                                        <button @click="submitVoteSimple" class="btn taco-btn taco-btn--big"
                                            :class="voteDecision === 'Adopt' ? 'taco-btn--success' : 'taco-btn--danger'"
                                            :disabled="votingInProgress || availableNeuronsToVote === 0">
                                            {{ votingInProgress ? 'Submitting...' : `Submit ${voteDecision} Vote` }}
                                        </button>

                                        <!-- voting info -->
                                        <div class="mt-3">

                                            <!-- if unvoted neurons available -->
                                            <span v-if="availableNeuronsToVote > 0"
                                                  style="color: var(--black-to-white);">
                                                Voting with {{ availableNeuronsToVote }} available neurons ({{userNeurons.length - availableNeuronsToVote }} already voted)
                                            </span>

                                            <!-- if no unvoted neurons available -->
                                            <span v-else style="color: var(--black-to-white);">
                                                All {{ userNeurons.length }} neurons have already voted on this proposal
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <!-- if no taco neurons found -->
                                <div v-else class="my-4 px-3 text-center d-flex flex-column align-items-center">

                                    <!-- no taco neurons icon -->
                                    <div class="mb-1 taco-text-black-to-white" style="font-size: 2rem;">
                                        <i class="fa fa-brain"></i>
                                    </div>

                                    <!-- no taco neurons text -->
                                    <p class="taco-text-black-to-white mb-4">No Taco neurons found</p>

                                    <router-link to="/wallet" class="btn taco-btn taco-btn--green w-fit-content">
                                        Create one in the wallet
                                    </router-link>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- footer bar -->
        <FooterBar />

    </div>

</template>

<style scoped lang="scss">

    // nns vote view
    .nns-vote-view {
        display: flex;
        flex-direction: column;

        &__top-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            background-color: var(--dark-orange-to-light-brown);
            border-radius: 0.5rem;
            padding: 0.5rem;

            // title
            &__title {
                color: var(--white);
                font-size: 1.125rem;
                font-family: 'Space Mono';
                font-weight: bold;
                margin: 0;
            }      

            // vote power
            &__vote-power {
                color: var(--light-gray);
                font-size: 0.825rem;
            }    

        }

        // logged out banner
        &__logged-out-content {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 300px;
            border-radius: .5rem;
            background-color: var(--yellow-to-brown);
            border: 1px solid var(--dark-orange-to-brown);

            i {
                font-size: 8rem;
                color: var(--dark-orange-to-dark-brown);
            }

            .login-curtain {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: var(--curtain-bg);
                padding: 0 3rem;
                border-radius: 0.5rem;
                display: flex;
                justify-content: center;
                align-items: center;

                .iid-login {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.325rem;
                }

                svg {
                    width: 1.375rem;
                }

                span {
                    font-size: 1rem;
                    font-family: 'Space Mono', monospace;
                }

            }
            
        }

    }

    // login
    .iid-login {
        display: inline-flex;
        align-items: center;
        gap: 0.325rem;

        svg {
            width: 1.375rem;
        }

        span {
            font-size: 1rem;
            font-family: 'Space Mono', monospace;
        }

        &:hover {
            background-color: rgba(0,0,0,0.05);
        }

        &:active {
            border-color: transparent;
        }
    }

    // hardcoded taco title
    .taco-title {
        display: inline-flex;
        margin-bottom: 0;
        font-size: 1.5rem;
        font-weight: 500;
        font-family: "Rubik Mono One", monospace;
        gap: 0.75rem;

        &__icon {
            color: var(--brown-to-white);
        }

        &__title {
            color: var(--brown-to-white);
        }
    }

    // cast button
    .cast-btn {
        width: 100%;

        &.not-selected {
            outline: 1px solid var(--black-to-white);
            color: var(--black-to-white);
        }

        &.not-selected:focus-visible {
            outline: 3px solid var(--light-brown-to-orange);
            outline-offset: 2px;
            color: var(--black-to-white);
        }

    }

</style>

<script setup lang="ts">

  /////////////
  // imports //
  /////////////

    import HeaderBar from '../components/HeaderBar.vue'
    import FooterBar from '../components/FooterBar.vue'
    import { ref, computed, onMounted, watch } from "vue"
    import { useRoute, useRouter } from "vue-router"
    import { storeToRefs } from 'pinia'
    import { useTacoStore } from "../stores/taco.store"
    import TacoTitle from "../components/misc/TacoTitle.vue"
    import DfinityLogo from "../assets/images/dfinityLogo.vue"
    import astronautLoader from "../assets/images/astonautLoader.webp"    

    /////////////
    // routing //
    /////////////   

    const route = useRoute()
    const router = useRouter()

    ///////////
    // setup //
    ///////////

    // images
    const astronautLoaderUrl = astronautLoader

    ///////////
    // store //
    ///////////    

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // app
    const { tacoSnsRootCanisterId } = storeToRefs(tacoStore)

    // user
    const { userLoggedIn } = storeToRefs(tacoStore)
    const { truncatedPrincipal } = storeToRefs(tacoStore)

    // # ACTIONS #

    // app
    const { uint8ArrayToHex } = tacoStore
    const { formatTokenAmount } = tacoStore
    // const { getNeuronDisplayName } = tacoStore
    const { appLoadingOn } = tacoStore
    const { appLoadingOff } = tacoStore
    const { findNNSProposalForSNS } = tacoStore
    const { hasDAOVoted } = tacoStore
    const { getNNSProposal } = tacoStore
    const { getSNSProposal } = tacoStore
    const { formatSNSProposalForDisplay } = tacoStore
    const { refreshUserVotingPower } = tacoStore
    const { getDAOVoteTally } = tacoStore
    const { getUserVotingNeurons } = tacoStore
    const { hasNeuronVoted } = tacoStore
    const { submitDAOVotes } = tacoStore
    const { showSuccess } = tacoStore
    const { showError } = tacoStore
    const { formatNNSProposalLink } = tacoStore

    // user
    const { iidLogIn } = tacoStore  
    // const { checkIfLoggedIn } = tacoStore

    /////////////////////
    // local variables //
    /////////////////////

    const componentLoading = ref(true)
    const error = ref('')
    const snsProposalId = ref<bigint>(0n)
    const nnsProposalId = ref<bigint>(0n)
    const nnsProposal = ref<any>(null)
    const snsProposal = ref<any>(null)
    const daoVoteTally = ref<any>(null)
    const daoAlreadyVoted = ref(false)
    const userNeurons = ref<any[]>([])
    const selectedNeurons = ref<Uint8Array[]>([])
    const voteDecision = ref<'Adopt' | 'Reject'>('')
    const votingInProgress = ref(false)
    const neuronVoteStatus = ref<Map<string, any>>(new Map())
    const refreshingVP = ref(false)

    ///////////////////
    // local methods //
    ///////////////////  

    // load proposal data
    const loadProposalData = async () => {

        // try
        try {

            // turn app loading on
            appLoadingOn()

            // turn component loading on
            componentLoading.value = true

            // clear error
            error.value = ''

            // get SNS proposal ID from route
            const proposalIdParam = route.params.id as string

            // if no proposal ID, throw error
            if (!proposalIdParam) {
                throw new Error('No proposal ID provided')
            }

            // set SNS proposal ID
            snsProposalId.value = BigInt(proposalIdParam)

            // find corresponding NNS proposal
            nnsProposalId.value = await findNNSProposalForSNS(snsProposalId.value) || 0n

            // if no corresponding NNS proposal, throw error
            if (nnsProposalId.value === 0n) {
                throw new Error('No corresponding NNS proposal found for this SNS proposal')
            }

            // check if DAO has already voted
            daoAlreadyVoted.value = await hasDAOVoted(nnsProposalId.value)

            // load both proposals
            const [nnsData, snsData] = await Promise.all([
                getNNSProposal(nnsProposalId.value),
                getSNSProposal(snsProposalId.value)
            ])

            // set NNS and SNS proposals
            nnsProposal.value = nnsData
            snsProposal.value = formatSNSProposalForDisplay(snsData)

            // load DAO vote tally
            await refreshDAOVotes()

            // load user neurons if logged in
            if (userLoggedIn.value) {
                await loadUserNeurons()
            }

        } 
        
        // catch
        catch (err: any) {
            console.error('Error loading proposal data:', err)
            error.value = err.message || 'Failed to load proposal data'
        } 
        
        // finally
        finally {

            // turn component loading off
            componentLoading.value = false

            // turn app loading off
            appLoadingOff()

        }

    }    

    // check if neuron is selected
    const isNeuronSelected = (neuronId: Uint8Array) => {

        // return true if neuron is selected
        return selectedNeurons.value.some(id =>
            uint8ArrayToHex(id) === uint8ArrayToHex(neuronId)
        )

    }

    // check if neuron has voted
    const hasVoted = (neuronId: Uint8Array) => {
        const key = uint8ArrayToHex(neuronId)
        return neuronVoteStatus.value.has(key)
    }

    // get NNS topic name
    const getNNSTopicName = (topicId: number) => {
        const topics: Record<number, string> = {
            0: 'Unspecified',
            1: 'Neuron Management',
            2: 'Exchange Rate',
            3: 'Network Economics',
            4: 'Governance',
            5: 'Node Admin',
            6: 'Participant Management',
            7: 'Subnet Management',
            8: 'Network Canister Management',
            9: 'KYC',
            10: 'Node Provider Rewards',
            11: 'SNS Decentralization Sale',
            12: 'Subnet Replica Version Management',
            13: 'Replica Version Management',
            14: 'SNS and Community Fund',
            15: 'API Boundary Node Management'
        }
        return topics[topicId] || `Topic ${topicId}`
    }

    // refresh DAO votes
    const refreshDAOVotes = async () => {
        try {
            const rawTally = await getDAOVoteTally(snsProposalId.value)
            // console.log('Raw DAO vote tally:', rawTally) // Debug log

            // Handle array format from backend (Candid optional returns as array)
            if (Array.isArray(rawTally) && rawTally.length > 0) {
                daoVoteTally.value = rawTally[0] // Extract from array
            } else if (rawTally && typeof rawTally === 'object' && !Array.isArray(rawTally)) {
                daoVoteTally.value = rawTally // Direct object
            } else {
                daoVoteTally.value = null // No votes
            }

            // console.log('Processed DAO vote tally:', daoVoteTally.value) // Debug log
        } catch (err) {
            console.error('Error refreshing DAO votes:', err)
        }
    }

    // load user neurons
    const loadUserNeurons = async () => {
        try {
            userNeurons.value = await getUserVotingNeurons()

            // Check vote status for each neuron
            for (const neuron of userNeurons.value) {
                // Handle different neuron ID formats
                let neuronIdBlob = null;
                if (neuron.id instanceof Uint8Array) {
                    // Categorized neuron format
                    neuronIdBlob = neuron.id;
                } else if (neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                    // Raw neuron format from SNS governance
                    neuronIdBlob = neuron.id[0].id;
                }

                if (neuronIdBlob) {
                    const voteStatus = await hasNeuronVoted(snsProposalId.value, neuronIdBlob)
                    // console.log('Vote status for neuron:', uint8ArrayToHex(neuronIdBlob), voteStatus)

                    // Check if voteStatus is a meaningful vote record (not null, undefined, or empty array)
                    if (voteStatus &&
                        voteStatus !== null &&
                        voteStatus !== undefined &&
                        !(Array.isArray(voteStatus) && voteStatus.length === 0)) {
                        const key = uint8ArrayToHex(neuronIdBlob)
                        neuronVoteStatus.value.set(key, voteStatus)
                        // console.log('Neuron marked as voted:', key)
                    } else {
                        // console.log('Neuron not voted:', uint8ArrayToHex(neuronIdBlob))
                    }
                }
            }
        } catch (err) {
            console.error('Error loading user neurons:', err)
        }
    }

    // submit vote
    const submitVoteSimple = async () => {
        if (!voteDecision.value || votingInProgress.value) return

        try {
            votingInProgress.value = true

            // Get all user neuron IDs
            const allNeuronIds = userNeurons.value.map(neuron => {
                // Handle different neuron ID formats
                if (neuron.id instanceof Uint8Array) {
                    // Categorized neuron format
                    return neuron.id;
                } else if (neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                    // Raw neuron format from SNS governance
                    return neuron.id[0].id;
                }
                return null;
            }).filter(id => id !== null)

            // console.log('User neurons:', userNeurons.value) // Debug
            // console.log('Extracted neuron IDs:', allNeuronIds) // Debug
            // console.log('Number of valid neuron IDs:', allNeuronIds.length) // Debug

            const result = await submitDAOVotes(
                snsProposalId.value,
                allNeuronIds,
                voteDecision.value
            )

            // console.log('Vote submission result:', result) // Debug

            // Handle different vote submission outcomes
            if (result.successful_votes > 0n) {
                // Some neurons voted successfully
                showSuccess(
                    `Vote submitted successfully! ${result.successful_votes} neurons voted with ${formatTokenAmount(BigInt(result.total_voting_power), 8)} VP.`
                )
            } else if (result.skipped_already_voted > 0n && result.skipped_no_access === 0n) {
                // All neurons already voted
                showError(
                    `All ${result.skipped_already_voted} of your neurons have already voted on this proposal.`
                )
            } else if (result.skipped_no_access > 0n) {
                // No access to neurons
                showError(
                    `Vote failed: No access to ${result.skipped_no_access} neurons. ${result.skipped_already_voted > 0n ? `${result.skipped_already_voted} neurons already voted.` : ''}`
                )
            } else {
                // Other cases
                showError('Vote submission failed for unknown reasons.')
            }

            // Reset form and refresh data
            voteDecision.value = 'Adopt'
            await refreshData()

        } catch (err: any) {
            console.error('Error submitting vote:', err)
            showError(err.message || 'Failed to submit vote')
        } finally {
            votingInProgress.value = false
        }
    }

    // refresh data
    const refreshData = async () => {
        
        // turn app loading on
        appLoadingOn()

        // turn component loading on
        componentLoading.value = true

        // refresh DAO votes and load user neurons
        await Promise.all([
            refreshDAOVotes(),
            loadUserNeurons()
        ])

        // turn component loading off
        componentLoading.value = false

        // turn app loading off
        appLoadingOff()

    }

    // refresh voting power
    const refreshVotingPower = async () => {

        // try
        try {

            // set refreshing VP to true
            refreshingVP.value = true            

            // refresh user voting power
            await refreshUserVotingPower()

        } 
        
        // catch
        catch (error) {
            console.error('Error refreshing voting power:', error)
        } 
        
        // finally
        finally {

            // set refreshing VP to false
            refreshingVP.value = false

        }

    }

    //////////////
    // computed //
    //////////////

    // Calculate total voting power from all user neurons
    const votePower = computed(() => {

        // if no user neurons, return 0
        if (!userNeurons.value || userNeurons.value.length === 0) {
            return '0'
        }

        const totalVP = userNeurons.value.reduce((sum, neuron) => {
            // Handle different neuron formats
            let votingPower = 0n
            if (neuron.voting_power !== undefined) {
                votingPower = BigInt(neuron.voting_power)
            } else if (neuron.cached_neuron_stake_e8s !== undefined) {
                votingPower = BigInt(neuron.cached_neuron_stake_e8s)
            }
            return sum + votingPower
        }, 0n)

        // Format as human-readable number (divide by 1e8 and format)
        const formattedVP = Number(totalVP) / 100000000
        return formattedVP.toLocaleString('en-US', { maximumFractionDigits: 0 })
    })

    const nnsProposalLink = computed(() => {
        return formatNNSProposalLink(nnsProposalId.value)
    })

    // Check how many neurons haven't voted yet
    const availableNeuronsToVote = computed(() => {
        if (!userNeurons.value || userNeurons.value.length === 0) {
            return 0
        }

        let availableCount = 0
        for (const neuron of userNeurons.value) {
            // Get neuron ID for checking vote status
            let neuronIdBlob = null
            if (neuron.id instanceof Uint8Array) {
                neuronIdBlob = neuron.id
            } else if (neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                neuronIdBlob = neuron.id[0].id
            }

            if (neuronIdBlob) {
                const key = uint8ArrayToHex(neuronIdBlob)
                if (!neuronVoteStatus.value.has(key)) {
                    availableCount++
                }
            }
        }

        return availableCount
    })

    const totalSelectedVotingPower = computed(() => {
        return selectedNeurons.value.reduce((total, neuronId) => {
            const neuron = userNeurons.value.find(n =>
                uint8ArrayToHex(n.id.id) === uint8ArrayToHex(neuronId)
            )
            return total + BigInt(neuron?.votingPower || 0)
        }, 0n)
    })

    const canSubmitVote = computed(() => {
        return selectedNeurons.value.length > 0 &&
            voteDecision.value &&
            !votingInProgress.value &&
            !daoAlreadyVoted.value
    })    

    //////////////
    // watchers //
    //////////////

    // watch for changes in user logged in state
    watch(userLoggedIn, async (newValue) => {
        if (newValue) {
            appLoadingOn()
            await loadUserNeurons()
            await loadProposalData()
            appLoadingOff()
        } else {
            userNeurons.value = []
            selectedNeurons.value = []
            neuronVoteStatus.value.clear()
        }
    })

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    onMounted(async () => {

        // if user is logged out, don't load proposal data
        if (!userLoggedIn.value) {
            return
        }

        // load proposal data
       loadProposalData()

    })

</script>
