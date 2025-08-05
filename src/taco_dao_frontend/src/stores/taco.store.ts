/////////////
// Imports //
/////////////

// vue
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { useStorage } from "@vueuse/core"
import { AuthClient } from "@dfinity/auth-client"
import { Actor, AnonymousIdentity } from "@dfinity/agent"
import { createAgent } from '@dfinity/utils'
import { idlFactory } from "../../../declarations/ledger_canister/ledger_canister.did.js"
import { idlFactory as daoBackendIDL } from "../../../declarations/dao_backend/DAO_backend.did.js"
import { Result_4, idlFactory as treasuryIDL, UpdateConfig, RebalanceConfig, _SERVICE as TreasuryService } from "../../../declarations/treasury/treasury.did.js"
import { idlFactory as neuronSnapshotIDL, _SERVICE as NeuronSnapshotService } from "../../../declarations/neuronSnapshot/neuronSnapshot.did.js"
import { idlFactory as sneedForumIDL, _SERVICE as SneedForumService } from "../../../declarations/sneed_sns_forum/sneed_sns_forum.did.js"
import { idlFactory as appSneedDaoIDL, _SERVICE as AppSneedDaoService } from "../../../declarations/app_sneeddao_backend/app_sneeddao_backend.did.js"
import { idlFactory as snsGovernanceIDL } from "../../../declarations/sns_governance/sns_governance.did.js"
import { Principal } from '@dfinity/principal'
import { AccountIdentifier } from '@dfinity/ledger-icp'
import { canisterId as iiCanisterId } from "../../../declarations/internet_identity/index.js"
import type { Result_1, UserState } from "../../../declarations/dao_backend/DAO_backend.did.d"

///////////
// Types //
///////////

interface SnapshotInfo {
    lastSnapshotId: bigint;
    lastSnapshotTime: bigint;
    totalVotingPower: bigint;
}
interface TradingMetrics {
    lastUpdate: bigint;
    totalTradesExecuted: bigint;
    totalTradesFailed: bigint;
    avgSlippage: number;
    successRate: number;
}
interface Trade {
    tokenSold: Principal;
    tokenBought: Principal;
    amountSold: bigint;
    amountBought: bigint;
    exchange: 'ICPSwap' | 'KongSwap';
    timestamp: bigint;
    success: boolean;
    error?: string;
}
interface TimerHealth {
    snapshot: {
        active: boolean;
        lastSnapshotTime: bigint | null;
        nextExpectedSnapshot: bigint | null;
        inProgress: boolean;
    };
    treasury: {
        shortSync: {
            active: boolean;
            lastSync: bigint | null;
        };
        rebalanceStatus: 'Idle' | 'Trading' | 'Failed';
        rebalanceError?: string;
        tradingMetrics?: {
            lastRebalanceAttempt: bigint;
            totalTradesExecuted: bigint;
            totalTradesFailed: bigint;
            avgSlippage: number;
            successRate: number;
        };
        recentTrades?: Trade[];
    };
}
interface RebalanceStatus {
    Idle?: null;
    Trading?: null;
    Failed?: string;
}
interface SystemLog {
    timestamp: bigint;
    level: string;
    message: string;
}
interface TradingLog {
    timestamp: bigint;
    message: string;
}
interface TokenMetadata {
    symbol: string;
    decimals: number;
}
interface MetadataEntry {
    [key: string]: { Text?: string; Nat?: string };
}
interface TradingStatusResult {
    ok?: {
        metrics: TradingMetrics;
        executedTrades?: Trade[];
        rebalanceStatus: { Idle: null } | { Trading: null } | { Failed: string };
    };
    err?: string;
}
interface TrustedToken {
    tokenId: Principal;
    tokenSymbol: string;
    tokenDecimals: number;
    balance: bigint;
    priceInUSD: string;
}
interface TrustedTokenEntry {
    0: Principal;
    1: {
        tokenSymbol: string;
        tokenDecimals: bigint;
        balance: bigint;
        priceInUSD: string;
        Active: boolean;
        isPaused: boolean;
        pausedDueToSyncFailure: boolean;
        lastTimeSynced: bigint;
        epochAdded: bigint;
        priceInICP: bigint;
        tokenName: string;
        tokenTransferFee: bigint;
        tokenType: { ICRC3: null };
        pastPrices: any[];
    };
}
interface RebalanceResult {
    ok?: { Text: string };
    err?: { ConfigError: string } | { LiquidityError: string } | { PriceError: string } | { SystemError: string } | { TradeError: string };
}
interface UpdateSlippageConfig {
    maxSlippageBasisPoints?: bigint[];
    rebalanceIntervalNS?: bigint[];
    maxTradeAttemptsPerInterval?: bigint[];
    minTradeValueICP?: bigint[];
    maxTradeValueICP?: bigint[];
    portfolioRebalancePeriodNS?: bigint[];
    maxTradesStored?: bigint[];
    maxKongswapAttempts?: bigint[];
    shortSyncIntervalNS?: bigint[];
    longSyncIntervalNS?: bigint[];
    maxPriceHistoryEntries?: bigint[];
    priceUpdateIntervalNS?: bigint[];
    tokenSyncTimeoutNS?: bigint[];
}
interface VotingMetricsResponse {
    ok: {
        totalVotingPower: bigint;
        totalVotingPowerByHotkeySetters: bigint;
        allocatedVotingPower: bigint;
        principalCount: bigint;
        neuronCount: bigint;
    };
}
interface VoterDetails {
    principal: Principal;
    state: UserState;
}
interface NeuronAllocation {
    neuronId: Uint8Array;
    votingPower: bigint;
    lastUpdate: bigint;
    lastAllocationMaker: Principal;
    allocations: [Principal, bigint][];
}
interface ProcessedNeuronAllocation {
    neuronId: Uint8Array;
    votingPower: bigint;
    lastUpdate: bigint;
    lastAllocationMaker: Principal;
    allocations: [string, bigint][];
}
interface NeuronAllocationResponse {
    ok?: [Uint8Array, NeuronAllocation][];
    err?: string;
}
interface Allocation {
    token: Principal;
    basisPoints: number;
}
interface SystemParameterResult {
    ok?: null;
    err?: string;
}
export interface GetSystemParameterResult {
    FollowDepth?: bigint;
    MaxFollowers?: bigint;
    MaxPastAllocations?: bigint;
    SnapshotInterval?: bigint;
    MaxTotalUpdates?: bigint;
    MaxAllocationsPerDay?: bigint;
    AllocationWindow?: bigint;
    MaxFollowUnfollowActionsPerDay?: bigint;
    MaxFollowed?: bigint;
    LogAdmin?: Principal;
}
interface TradingPauseReason {
    PriceAlert?: {
        conditionName: string;
        triggeredAt: bigint;
        alertId: bigint;
    };
    CircuitBreaker?: {
        reason: string;
        triggeredAt: bigint;
        severity: string;
    };
}
interface TradingPauseRecord {
    token: Principal;
    tokenSymbol: string;
    reason: TradingPauseReason;
    pausedAt: bigint;
}
interface TradingPausesResponse {
    pausedTokens: TradingPauseRecord[];
    totalCount: bigint;
}
interface TokenSnapshot {
    token: Principal;
    symbol: string;
    balance: bigint;
    decimals: bigint;
    priceInICP: bigint;
    priceInUSD: number;
    valueInICP: bigint;
    valueInUSD: number;
}
interface SnapshotReason {
    PreTrade?: null;
    PostTrade?: null;
    Scheduled?: null;
    PriceUpdate?: null;
    Manual?: null;
}
interface PortfolioSnapshot {
    timestamp: bigint;
    tokens: TokenSnapshot[];
    totalValueICP: bigint;
    totalValueUSD: number;
    snapshotReason: SnapshotReason;
}
interface PortfolioHistoryResponse {
    snapshots: PortfolioSnapshot[];
    totalCount: bigint;
}
// Forum interfaces (using Candid types from the IDL)
import type {
    ForumResponse as CandidForumResponse,
    TopicResponse as CandidTopicResponse,
    ThreadResponse as CandidThreadResponse,
    PostResponse as CandidPostResponse,
    ProposalTopicMappingResponse as CandidProposalTopicMappingResponse
} from "../../../declarations/sneed_sns_forum/sneed_sns_forum.did.d"
interface NeuronNameKey {
    sns_root_canister_id: Principal;
    neuron_id: {
        id: Uint8Array;
    };
}
interface NeuronNameEntry {
    name: string;
    verified: boolean;
}
interface PrincipalNameEntry {
    name: string;
    verified: boolean;
}
interface NamesCache {
    principals: Map<string, PrincipalNameEntry>;
    neurons: Map<string, NeuronNameEntry>; // key format: "snsRoot:neuronIdHex"
    lastLoaded: number | null;
}
interface ProposalData {
    id?: { id: bigint };
    proposal?: {
        title: string;
        summary: string;
        url: string;
        action?: any;
    };
    proposal_creation_timestamp_seconds: bigint;
    decided_timestamp_seconds: bigint;
    executed_timestamp_seconds: bigint;
    failed_timestamp_seconds: bigint;
    latest_tally?: {
        yes: bigint;
        no: bigint;
        total: bigint;
        timestamp_seconds: bigint;
    };
    proposer?: { id: Uint8Array };
    is_eligible_for_rewards: boolean;
    ballots: [string, { vote: any; voting_power: bigint; cast_timestamp_seconds: bigint }][];
}
interface TacoProposal {
    id: bigint;
    title: string;
    summary: string;
    url: string;
    status: 'Open' | 'Adopted' | 'Rejected' | 'Failed' | 'Executed';
    createdAt: Date;
    decidedAt?: Date;
    executedAt?: Date;
    proposer?: string;
    yesVotes: bigint;
    noVotes: bigint;
    totalVotes: bigint;
}
interface ListProposalsResponse {
    proposals: ProposalData[];
    include_ballots_by_caller?: boolean;
    include_topic_filtering?: boolean;
}
interface GovernanceError {
    error_message: string;
    error_type: number;
}
interface ListProposalsResult {
    Ok?: ListProposalsResponse;
    Err?: GovernanceError;
}

// Naming system interfaces
interface NeuronNameKey {
    sns_root_canister_id: Principal;
    neuron_id: {
        id: Uint8Array;
    };
}

interface NeuronNameEntry {
    name: string;
    verified: boolean;
}

interface PrincipalNameEntry {
    name: string;
    verified: boolean;
}

interface NamesCache {
    principals: Map<string, PrincipalNameEntry>;
    neurons: Map<string, NeuronNameEntry>; // key format: "snsRoot:neuronIdHex"
    lastLoaded: number | null;
}

// SNS Governance interfaces
interface ProposalData {
    id?: { id: bigint };
    proposal?: {
        title: string;
        summary: string;
        url: string;
        action?: any;
    };
    proposal_creation_timestamp_seconds: bigint;
    decided_timestamp_seconds: bigint;
    executed_timestamp_seconds: bigint;
    failed_timestamp_seconds: bigint;
    latest_tally?: {
        yes: bigint;
        no: bigint;
        total: bigint;
        timestamp_seconds: bigint;
    };
    proposer?: { id: Uint8Array };
    is_eligible_for_rewards: boolean;
    ballots: [string, { vote: any; voting_power: bigint; cast_timestamp_seconds: bigint }][];
}

interface TacoProposal {
    id: bigint;
    title: string;
    summary: string;
    url: string;
    status: 'Open' | 'Adopted' | 'Rejected' | 'Failed' | 'Executed';
    createdAt: Date;
    decidedAt?: Date;
    executedAt?: Date;
    proposer?: string;
    yesVotes: bigint;
    noVotes: bigint;
    totalVotes: bigint;
}

interface ListProposalsResponse {
    proposals: ProposalData[];
    include_ballots_by_caller?: boolean;
    include_topic_filtering?: boolean;
}

interface GovernanceError {
    error_message: string;
    error_type: number;
}

interface ListProposalsResult {
    Ok?: ListProposalsResponse;
    Err?: GovernanceError;
}

/////////////
// Exports //
/////////////

export const useTacoStore = defineStore('taco', () => {

    // # STATE #

    // app
    const router = useRouter()
    const darkModeToggled = useStorage('darkMode', false)
    const appLoading = ref(false)
    const backendError = ref(false)
    const backendErrorIcon = ref('fa-solid fa-circle-exclamation')
    const backendErrorIconColor = ref('var(--red)')
    const backendErrorText = ref('backend error')
    const toasts = ref<{ 
        id: number; 
        code: string; 
        title: string; 
        icon: string; 
        message: string;
        tradeAmount?: string;
        tokenSellIdentifier?: string; 
        tradeLimit?: string;
        tokenInitIdentifier?: string;
    }[]>([])
    let authClientInstance: AuthClient | null = null

    // user
    const userLoggedIn = ref(false)
    const userPrincipal = ref('')
    const truncatedPrincipal = computed(() => {

        // get full principal
        const fullPrincipal = userPrincipal.value

        // remove dashes
        const cleanedPrincipal = fullPrincipal.replace(/-/g, '')

        // get last five characters
        const lastFiveChars = cleanedPrincipal.slice(-5)

        // return truncated principal
        return `${lastFiveChars}`

    })
    const userLedgerAccountId = ref('')
    const userAcceptedHotkeyTutorial = useStorage('userAcceptedHotkeyTutorial', false)
    const openChatSeenStoreValue = useStorage('openChatSeenStoreValue', false)
    const userAcceptedReportsDisclaimer = useStorage('userAcceptedReportsDisclaimer', false)

    // crypto prices
    const icpPriceUsd = useStorage('icpPriceUsd', 0)
    const btcPriceUsd = useStorage('btcPriceUsd', 0)
    const tacoPriceUsd = useStorage('tacoPriceUsd', 0)
    const tacoPriceIcp = useStorage('tacoPriceIcp', 0)
    const lastPriceUpdate = useStorage('lastPriceUpdate', 0)

    // dao
    const fetchedTokenDetails = ref<TrustedTokenEntry[]>([])
    const fetchedAggregateAllocation = ref<[Principal, bigint][]>([])
    const fetchedVotingPowerMetrics = ref<VotingMetricsResponse | null>(null)
    const fetchedUserAllocation = ref([])
    const totalPortfolioValueInUsd = ref(0)
    const totalPortfolioValueInIcp = ref(0)
    const portfolioTokenPricesInUsd = useStorage('portfolioTokenPricesInUsd', [])
    const portfolioTokenPricesInIcp = useStorage('portfolioTokenPricesInIcp', [])

    // sns provided canisters
    const snsTreasuryTacoValueInUsd = ref(0)
    const snsTreasuryIcpValueInUsd = ref(0)
    const totalTreasuryValueInUsd = ref(0)

    // treasury
    const fetchedTradingStatus = ref()

    // snassy's 
    const timerHealth = ref({
        snapshot: {
            active: false,
            lastSnapshotTime: null,
            nextExpectedSnapshot: null,
            inProgress: false
        },
        treasury: {
            shortSync: {
                active: false,
                lastSync: null
            },
            rebalanceStatus: 'Idle',
            rebalanceError: undefined
        }
    } as TimerHealth)

    // forum
    const tacoForumId = ref<bigint | null>(null)
    const proposalsTopicId = ref<bigint | null>(null)
    const fetchedForums = ref<CandidForumResponse[]>([])
    const fetchedProposalsThreads = ref<CandidThreadResponse[]>([])
    const fetchedThreadPosts = ref<CandidPostResponse[]>([])
    const threadMenuOpen = ref(false)
    
    // proposals
    const fetchedTacoProposals = ref<TacoProposal[]>([])
    const proposalsLoading = ref(false)
    const proposalsLoadingMore = ref(false)
    const proposalsHasMore = ref(true)
    const proposalsLastId = ref<bigint | null>(null)
    
    // naming system  
    const namesCache = ref<NamesCache>({
        principals: new Map(),
        neurons: new Map(),
        lastLoaded: null
    })
    const namesLoading = ref(false)
    
    // logs
    const systemLogs = ref<SystemLog[]>([])
    const tradingLogs = ref<TradingLog[]>([])

    // other
    const tokenMetadataCache = new Map<string, TokenMetadata>();
    const rebalanceConfig = ref<RebalanceConfig | null>(null)
    const systemParameters = ref<GetSystemParameterResult | null>(null)
    const fetchedVoterDetails = ref<VoterDetails[]>([])
    const fetchedNeuronAllocations = ref<ProcessedNeuronAllocation[]>([])
    const snapshotStatus = ref({
        active: false,
        lastSnapshotTime: null as bigint | null,
        nextExpectedSnapshot: null as bigint | null,
        inProgress: false
    })

    // # ACTIONS #

    // local methods
    const formatTokenAmount = (amount: bigint, decimals: number): string => {
        const amountStr = amount.toString();
        const padded = amountStr.padStart(decimals + 1, '0');
        const integerPart = padded.slice(0, -decimals) || '0';
        const decimalPart = padded.slice(-decimals);
        return `${integerPart}.${decimalPart}`;
    }    
    const convertBigIntToString = (obj: any): any => {

        // if array
        if (Array.isArray(obj)) {

            // map over array
            return obj.map(item => convertBigIntToString(item))

        }

        // if object
        else if (typeof obj === 'object' && obj !== null) {

            // create new object
            const newObj: any = {}

            // map over object
            for (const key in obj) {

                // if bigint
                if (typeof obj[key] === 'bigint') {

                    // convert bigint to string
                    newObj[key] = obj[key].toString()

                } 
                
                // else
                else {

                    // recursive call
                    newObj[key] = convertBigIntToString(obj[key])
                }

            }

            // return new object
            return newObj

        } 
        
        // else
        else {

            // return original object
            return obj

        }

    }
    function getLocalHost(): string {

        // get the port from the environment variable
        const port = import.meta.env.VITE_LOCAL_PORT || '51000'

        // log
        // console.log('port', port)

        // return the local host
        return `http://localhost:${port}`

    }
    const getAuthClient = async (): Promise<AuthClient> => {
        if (!authClientInstance) {
            authClientInstance = await AuthClient.create({
                idleOptions: {
                    disableIdle: true
                }
            })
        }
        return authClientInstance
    }      

    // app
    const changeRoute = (destination: string) => {

        // change route
        router.push('/' + destination)

    }
    const toggleDarkMode = (skipCounter: boolean) => {

        // get document root
        const root = document.documentElement

        // color pallet
        root.style.setProperty("--light-red", "#FF7575")
        root.style.setProperty("--red", "#EB0000")
        root.style.setProperty("--red-hover", "#D40000")
        root.style.setProperty("--light-orange", "#FEEAC1")
        root.style.setProperty("--light-orange-hover", "#ffdd81")
        root.style.setProperty("--orange", "#FED66C")
        root.style.setProperty("--dark-orange", "#DA8D28")
        root.style.setProperty("--light-brown", "#C16D33")
        root.style.setProperty("--light-brown-hover", "#b96428")
        root.style.setProperty("--brown", "#934A17")
        root.style.setProperty("--dark-brown", "#512100")
        root.style.setProperty("--yellow", "#FEC800")
        root.style.setProperty("--yellow-hover", "#F1BE00")
        root.style.setProperty("--light-green", "#7CDC86")
        root.style.setProperty("--success-green", "#19B229")
        root.style.setProperty("--success-green-hover", "#179F25")
        root.style.setProperty("--green", "#B7CD02")
        root.style.setProperty("--green-hover", "#A3B700")
        root.style.setProperty("--dark-green", "#7D8828")
        root.style.setProperty("--light-blue", "#B4C2E9")
        root.style.setProperty("--light-blue-hover", "#9DAFE1")
        root.style.setProperty("--blue", "#546595")
        root.style.setProperty("--blue-hover", "#46547D")
        root.style.setProperty("--white", "#FFFFFF")
        root.style.setProperty("--light-gray", "#F4F3EC")
        root.style.setProperty("--gray", "#ACACA8")
        root.style.setProperty("--dark-gray", "#777777")
        root.style.setProperty("--black", "#2D2D2D")

        // toggleable colors

        // in light mode
        if (!darkModeToggled.value) {
            root.style.setProperty("--white-to-black", "#2D2D2D") // black
            root.style.setProperty("--white-to-light-orange", "#FEEAC1") // light orange
            root.style.setProperty("--white-to-light-blue", "#B4C2E9") // light blue
            root.style.setProperty("--dark-gray-to-light-gray", "#F4F3EC") // light gray
            root.style.setProperty("--dark-gray-to-gray", "#777777") // dark gray
            root.style.setProperty("--black-to-white", "#FFFFFF") // white
            root.style.setProperty("--light-orange-hover-to-light-brown-hover", "#b96428") // light brown hover
            root.style.setProperty("--light-orange-to-orange", "#FED66C") // orange
            root.style.setProperty("--light-orange-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--light-orange-to-light-brown", "#C16D33") // light brown
            root.style.setProperty("--light-orange-to-brown", "#934A17") // brown
            root.style.setProperty("--light-orange-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--orange-to-brown", "#934a17") // brown
            root.style.setProperty("--orange-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--orange-to-light-brown", "#c16d33") // light brown
            root.style.setProperty("--light-brown-to-white", "#ffffff") // white
            root.style.setProperty("--light-brown-to-yellow", "#FEC800") // yellow
            root.style.setProperty("--light-brown-to-orange", "#FED66C") // orange
            root.style.setProperty("--light-brown-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--light-brown-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--dark-brown-to-light-orange", "#feeac1") // light orange
            root.style.setProperty("--dark-brown-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-transparent", "transparent") // transparent
            root.style.setProperty("--transparent-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-light-orange", "#feeac1") // light orange
            root.style.setProperty("--dark-orange-to-orange", "#FED66C") // orange
            root.style.setProperty("--dark-orange-to-brown", "#934a17") // brown
            root.style.setProperty("--dark-orange-to-light-brown", "#c16d33") // light brown
            root.style.setProperty("--dark-orange-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--dark-orange-to-yellow", "#FEC800") // yellow
            root.style.setProperty("--yellow-to-brown", "#934a17") // brown
            root.style.setProperty("--yellow-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--yellow-to-orange", "#FED66C") // orange
            root.style.setProperty("--yellow-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--yellow-to-black", "#2D2D2D") // black
            root.style.setProperty("--brown-to-light-orange", "#FEEAC1") // light orange
            root.style.setProperty("--brown-to-light-gray", "#F4F3EC") // light gray
            root.style.setProperty("--light-green-to-success-green-hover", "#7CDC86") // light green
            root.style.setProperty("--light-green-to-success-green", "#7CDC86") // light green
            root.style.setProperty("--green-to-orange", "#FED66C") // orange
            root.style.setProperty("--green-to-brown", "#934a17") // green
            root.style.setProperty("--green-to-yellow", "#FEC800") // yellow
            root.style.setProperty("--dark-green-to-light-green", "#B4C2E9") // light green
            root.style.setProperty("--success-green-to-success-green-hover", "#19B229") // success green hover
            root.style.setProperty("--success-green-hover-to-success-green", "#179F25") // success green
            root.style.setProperty("--success-green-hover-to-light-green", "#7CDC86") // light green
            root.style.setProperty("--dark-green-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--blue-to-light-blue", "#B4C2E9") // light blue
            root.style.setProperty("--brown-to-white", "#ffffff") // white
            root.style.setProperty("--brown-to-orange", "#FED66C") // orange
            root.style.setProperty("--brown-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--brown-to-green", "#934a17") // brown
            root.style.setProperty("--dark-brown-to-white", "#ffffff") // white
            root.style.setProperty("--red-to-light-red", "#FF7575") // light red
            root.style.setProperty("--light-red-to-red", "#EB0000") // red
            root.style.setProperty("--red-to-red-hover", "#EB0000") // error red hover
            root.style.setProperty("--black-to-white", "#ffffff") // white
            root.style.setProperty("--gray-to-light-gray", "#F4F3EC") // light gray
            root.style.setProperty("--gray-to-dark-gray", "#777777") // dark gray
            root.style.setProperty("--dark-gray-to-gray", "#ACACA8") // gray
            root.style.setProperty("--dark-gray-to-yellow", "#FEC800") // yellow
            root.style.setProperty("--curtain-bg", "rgba(0,0,0,0.75)") // darker curtain bg
            // toggle logic
            if (skipCounter === false) {
                darkModeToggled.value = true
                toggleDarkMode(true)
            }
        }

        // in dark mode
        else {
            root.style.setProperty("--white-to-black", "#ffffff") // white
            root.style.setProperty("--white-to-light-orange", "#ffffff") // white
            root.style.setProperty("--white-to-light-blue", "#ffffff") // white
            root.style.setProperty("--dark-gray-to-light-gray", "#777777") // dark gray
            root.style.setProperty("--dark-gray-to-gray", "#ACACA8") // dark
            root.style.setProperty("--black-to-white", "#2D2D2D") // black
            root.style.setProperty("--light-orange-hover-to-light-brown-hover", "#ffdd81") // light orange hover
            root.style.setProperty("--light-orange-to-orange", "#FEEAC1") // light orange
            root.style.setProperty("--light-orange-to-dark-orange", "#FEEAC1") // light orange
            root.style.setProperty("--light-orange-to-light-brown", "#feeac1") // light orange
            root.style.setProperty("--light-orange-to-brown", "#feeac1") // light orange
            root.style.setProperty("--light-orange-to-dark-brown", "#feeac1") // light orange
            root.style.setProperty("--orange-to-brown", "#FEd66c") // orange
            root.style.setProperty("--orange-to-dark-brown", "#FEd66c") // orange
            root.style.setProperty("--orange-to-light-brown", "#FEd66c") // orange
            root.style.setProperty("--light-brown-to-white", "#C16D33") // light brown
            root.style.setProperty("--light-brown-to-yellow", "#C16D33") // light brown
            root.style.setProperty("--light-brown-to-orange", "#c16d33") // light brown
            root.style.setProperty("--light-brown-to-dark-orange", "#c16d33") // light brown
            root.style.setProperty("--light-brown-to-dark-brown", "#c16d33") // light brown
            root.style.setProperty("--dark-brown-to-light-orange", "#512100") // dark brown
            root.style.setProperty("--dark-brown-to-dark-orange", "#512100") // dark brown
            root.style.setProperty("--dark-orange-to-transparent", "#DA8D28") // dark orange
            root.style.setProperty("--transparent-to-dark-orange", "transparent") // transparent
            root.style.setProperty("--dark-orange-to-light-orange", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-orange", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-brown", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-light-brown", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-dark-brown", "#DA8D28") // dark orange
            root.style.setProperty("--dark-orange-to-yellow", "#DA8D28") // dark orange
            root.style.setProperty("--yellow-to-brown", "#FEC800") // yellow
            root.style.setProperty("--yellow-to-dark-brown", "#FEC800") // yellow
            root.style.setProperty("--yellow-to-orange", "#FEC800") // yellow
            root.style.setProperty("--yellow-to-dark-orange", "#FEC800") // yellow
            root.style.setProperty("--yellow-to-black", "#FEC800") // yellow
            root.style.setProperty("--brown-to-light-orange", "#934a17") // brown
            root.style.setProperty("--brown-to-light-gray", "#934a17") // brown
            root.style.setProperty("--light-green-to-success-green-hover", "#179F25") // success green hover
            root.style.setProperty("--light-green-to-success-green", "#19B229") // success green
            root.style.setProperty("--green-to-orange", "#B7CD02") // green
            root.style.setProperty("--green-to-yellow", "#B7CD02") // green
            root.style.setProperty("--dark-green-to-light-green", "#B4C2E9") // dark green
            root.style.setProperty("--success-green-to-success-green-hover", "#179F25") // success green hover
            root.style.setProperty("--success-green-hover-to-success-green", "#19B229") // success green
            root.style.setProperty("--success-green-hover-to-light-green", "#179F25") // light green
            root.style.setProperty("--dark-green-to-dark-brown", "#7D8828") // dark green
            root.style.setProperty("--green-to-brown", "#B7CD02") // brown
            root.style.setProperty("--blue-to-light-blue", "#546595") // blue
            root.style.setProperty("--brown-to-white", "#934a17") // brown
            root.style.setProperty("--brown-to-orange", "#934a17") // brown
            root.style.setProperty("--brown-to-dark-orange", "#934a17") // brown
            root.style.setProperty("--brown-to-green", "#B7CD02") // green
            root.style.setProperty("--dark-brown-to-white", "#512100") // dark brown
            root.style.setProperty("--red-to-light-red", "#EB0000") // red
            root.style.setProperty("--light-red-to-red", "#FF7575") // light red
            root.style.setProperty("--red-to-red-hover", "#D40000") // error red hover
            root.style.setProperty("--black-to-white", "#2D2D2D") // black
            root.style.setProperty("--gray-to-light-gray", "#ACACA8") // gray
            root.style.setProperty("--gray-to-dark-gray", "#ACACA8") // gray
            root.style.setProperty("--dark-gray-to-gray", "#777777") // dark gray
            root.style.setProperty("--dark-gray-to-yellow", "#777777") // darkk gray
            root.style.setProperty("--curtain-bg", "rgba(0,0,0,0.5)") // lighter curtain bg
            // toggle logic
            if (skipCounter === false) {
                darkModeToggled.value = false
                toggleDarkMode(true)
            }
        }
    }
    const appLoadingOn = () => {

        // set app loading to true
        appLoading.value = true

    }
    const appLoadingOff = () => {

        // set app loading to false
        appLoading.value = false

    }
    const addToast = (toast: { id: number; 
        code: string; 
        title: string; 
        icon: string; 
        message: string;
        tradeAmount?: string;
        tokenSellIdentifier?: string;
        tradeLimit?: string;
        tokenInitIdentifier?: string; }) => {

        // add the toast to the array
        toasts.value.push(toast)
        
        // remove the toast after 5 seconds (5000ms)
        setTimeout(() => {

        
            removeToast(toast.id)

        }, 5000)

    }
    const removeToast = (id: number) => {

        // remove the toast from the array
        toasts.value = toasts.value.filter((toast) => toast.id !== id)

    }

    // user
    const checkIfLoggedIn = async () => {

        // log
        // console.log('checking if user is logged in')

        // create auth client
        const authClient = await getAuthClient()

        // if user is logged in
        if (await authClient.isAuthenticated()) {

            // log
            // console.log('user is logged in')

            // set user principal
            setUserPrincipal(authClient.getIdentity().getPrincipal().toString())

            // set user ledger account ID
            setUserLedgerAccountId(calculateAccountId(userPrincipal.value))

            // set user logged in to true
            userLoggedIn.value = true

            // log
            // console.log('🔍 Triggering loadAllNames() from checkIfLoggedIn - user is logged in')

            // Load names cache in background (non-blocking)
            loadAllNames().catch(console.error)


        } else {

            // log
            // console.log('user is not logged in')

            // set user principal to empty string
            setUserPrincipal('')

            // set user logged in to false
            userLoggedIn.value = false

            // clear user ledger account ID
            userLedgerAccountId.value = ''

        }

    }
    const setUserPrincipal = (principal: string) => {
        
        // log
        // console.log('user principal:', principal)

        // set user principal
        userPrincipal.value = principal

    }
    const setUserLedgerAccountId = (accountId: string) => {

        // log
        // console.log('user ledger account ID:', accountId)

        // set user ledger account ID
        userLedgerAccountId.value = accountId

    }
    const calculateAccountId = (principal: string) => {

        // convert principal to principal object
        const principalObj = Principal.fromText(principal)

        // calculate account ID
        const accountId = AccountIdentifier.fromPrincipal({
            principal: principalObj,
            subAccount: undefined
        })

        // return account ID as hex string
        return accountId.toHex()

    }
    const iidLogIn = async () => {

        // turn app loading on
        appLoadingOn()

        try {

            // create auth client
            const authClient = await getAuthClient()

            // if already logged in
            if (await authClient.isAuthenticated()) {

                // set user principal
                setUserPrincipal(authClient.getIdentity().getPrincipal().toString())

                // set user logged in to true
                userLoggedIn.value = true

                // calculate and set user ledger account ID
                userLedgerAccountId.value = calculateAccountId(userPrincipal.value)

                // turn app loading off
                appLoadingOff()

                // return true to indicate success
                return true

            }

            // login
            await new Promise((resolve, reject) => {
                authClient.login({
                    maxTimeToLive: BigInt(30 * 24 * 60 * 60 * 1000 * 1000 * 1000),
                    identityProvider:
                        process.env.DFX_NETWORK === "ic" || process.env.DFX_NETWORK === "staging"
                            ? 'https://identity.ic0.app'
                            : `http://${iiCanisterId}.localhost:8080/`,
                    onSuccess: resolve,
                    onError: reject,
                })
            })

            // set user principal
            setUserPrincipal(authClient.getIdentity().getPrincipal().toString())

            // calculate and set user ledger account ID
            userLedgerAccountId.value = calculateAccountId(userPrincipal.value)

            // console.log('setting user logged in to true')

            // set user logged in to true
            userLoggedIn.value = true

            // calculate and set user ledger account ID
            userLedgerAccountId.value = calculateAccountId(userPrincipal.value)

            // refresh voting power immediately after login
            try {
                await refreshUserVotingPower()
            } catch (error) {

                // log
                // console.log('Could not refresh voting power on login:', error)

                // Don't fail login if refresh fails

            }

            // Load names cache in background (non-blocking)
            // console.log('🔍 Triggering loadAllNames() from iidLogIn - after successful login');
            loadAllNames().catch(console.error);

            // turn app loading off
            appLoadingOff()

            // return true to indicate success
            return true

        } catch (error) {

            // turn app loading off
            appLoadingOff()

            // log error
            console.error('There was a problem logging in with iid:', error)

            // set user principal to empty string
            setUserPrincipal('')

            // set user logged in to false
            userLoggedIn.value = false

            // clear user ledger account ID
            userLedgerAccountId.value = ''

            // return false to indicate failure
            return false

        }

    }
    const iidLogOut = async () => {

        // turn app loading on
        appLoadingOn()

        try {

            // create auth client
            const authClient = await getAuthClient()

            // logout
            await authClient.logout()

            // set user principal to empty string
            setUserPrincipal('')

            // set user logged in to false
            userLoggedIn.value = false

            // clear user ledger account ID
            userLedgerAccountId.value = ''

            // turn app loading off
            appLoadingOff()

            // return true to indicate success
            return true

        } catch (error) {

            // turn app loading off
            appLoadingOff()

            // log error
            console.error('There was a problem logging out of iid:', error)

            // return false to indicate failure
            return false

        }

    }
    const acceptHotkeyTutorial = () => {

        // log
        // console.log('taco.store: accepting hotkey tutorial')

        // accept hotkey tutorial
        userAcceptedHotkeyTutorial.value = true

    }
    const setOpenChatSeenStoreValue = () => {
        openChatSeenStoreValue.value = true
    }
    const acceptReportsDisclaimer = () => {
        userAcceptedReportsDisclaimer.value = true
    }

    // canister ids
    const daoBackendCanisterId = () => {

        // determine canisterId based on network
        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_DAO_BACKEND_IC || 'vxqw7-iqaaa-aaaan-qzziq-cai';
                break;
            case "staging":
                return  process.env.CANISTER_ID_DAO_BACKEND_STAGING || 'tisou-7aaaa-aaaai-atiea-cai';
                break;
        }        
        return 'ywhqf-eyaaa-aaaad-qg6tq-cai'; // local canisterId
    }
    const treasuryCanisterId = () => {

        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_TREASURY_IC || 'v6t5d-6yaaa-aaaan-qzzja-cai';
                break;
            case "staging":
                return  process.env.CANISTER_ID_TREASURY_STAGING || 'tptia-syaaa-aaaai-atieq-cai';
                break;
        }        
        return 'z4is7-giaaa-aaaad-qg6uq-cai'; // local canisterId
    }
    const neuronSnapshotCanisterId = () => {
        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_NEURONSNAPSHOT_IC || 'vzs3x-taaaa-aaaan-qzzjq-cai';
                break;
            case "staging":
                return  process.env.CANISTER_ID_NEURONSNAPSHOT_STAGING || 'tgqd4-eqaaa-aaaai-atifa-cai';
                break;
        }        
        return 'tgqd4-eqaaa-aaaai-atifa-cai'; // local canisterId
    }

    // crypto prices
    const fetchCryptoPrices = async () => {

        // log
        // console.log('taco.store: fetchCryptoPrices()')

        // get current time
        const now = Date.now()

        // set one hour in milliseconds
        const timeToUpdate = 30 * 1000 // 30 seconds

        // if time to update has passed, fetch new prices
        if (now - lastPriceUpdate.value > timeToUpdate) {

            // log
            console.log('✨ fetching new crypto prices')

            // try coingecko standard endpoint for icp and btc
            try {

                // log
                // console.log('taco.store: fetching new crypto prices - coingecko standard endpoint')

                // fetch
                const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=internet-computer,bitcoin&price_change_percentage=1h,24h')
                
                // if not ok, throw error
                if (!response.ok) throw new Error(`HTTP ${response.status}`)

                // parse response
                const data = await response.json()
                
                // log
                // console.log('taco.store: fetchCryptoPrices() - coingecko standard endpoint data:', data)

                // Find the specific coins in the array
                const icpData = data.find((coin: { id: string }) => coin.id === 'internet-computer')
                const btcData = data.find((coin: { id: string }) => coin.id === 'bitcoin')

                // Set the prices
                icpPriceUsd.value = icpData?.current_price || 0
                btcPriceUsd.value = btcData?.current_price || 0

                // // set last price update
                lastPriceUpdate.value = now

            } catch (error) {

                // log error
                console.error('error fetching crypto prices from coingecko standard endpoint:', error)

            }

            // try gecko terminal pool endpoint for taco
            try {

                // log
                // console.log('taco.store: fetching new crypto prices - gecko terminal pool endpoint')

                // use pool endpoint instead of token endpoint (previous version caused 500)
                const resp = await fetch(
                    `https://api.geckoterminal.com/api/v2/networks/icp/pools/vhoia-myaaa-aaaar-qbmja-cai`,
                    { mode: 'cors' }
                )

                // if not ok, throw error
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

                // parse response
                const body = await resp.json()

                // log
                // console.log('taco.store: fetchCryptoPrices() - gecko terminal pool endpoint - body:', body)

                const baseTokenPriceQuoteToken = body.data.attributes.base_token_price_quote_token
                const basePrice  = Number(body.data.attributes.base_token_price_usd)
                
                // set the base price
                tacoPriceUsd.value = basePrice || 0

                // set the base token price quote token
                tacoPriceIcp.value = baseTokenPriceQuoteToken || 0

                // set last price update
                lastPriceUpdate.value = now                

            } catch (error) {

                // log error
                console.error('error fetching crypto prices from gecko terminal pool endpoint:', error)

            }

        }
        
        // else, use saved prices
        else {

            console.log('💾 using saved crypto prices')
            // console.log('💾 ICP price in USD:', icpPriceUsd.value)
            // console.log('💾 BTC price in USD:', btcPriceUsd.value)
            // console.log('💾 Taco price in ICP:', tacoPriceIcp.value)

        }

    }

    // ledger canisters
    const icrc1Metadata = async (passedCanisterId: string) => {

        // log
        // console.log('taco.store: icrc1Metadata() - calling for metadata...')

        try {

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })         

            // create actor
            const actor = Actor.createActor(idlFactory, {
                agent,
                canisterId: passedCanisterId,
            })

            //////////////////////
            // post actor logic //

            // get metadata
            const metadata = await actor.icrc1_metadata()

            // log
            // console.log('taco.store: icrc1Metadata() - returned metadata:', metadata)

            // return metadata
            return metadata

        } catch (error) {

            // log error
            console.error('error fetching metadata from icrc1 canister:', error)

            // return false
            return false

        }

    }
    const icrc1BalanceOf = async (canisterId: string, owner: Principal, subaccount?: Uint8Array) => {
        
        // log
        // console.log('taco.store: icrc1BalanceOf() - calling for balance...')
        // console.log('taco.store: icrc1BalanceOf() - canisterId:', canisterId)
        // console.log('taco.store: icrc1BalanceOf() - owner:', owner.toText())

        try {

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })         

            // create actor
            const actor = Actor.createActor(idlFactory, {
                agent,
                canisterId: canisterId,
            })

            //////////////////////
            // post actor logic //

            // create account identifier
            const accountId = {
                owner: owner,
                subaccount: subaccount ? [subaccount] : []
            }

            // get balance
            const balance = await actor.icrc1_balance_of(accountId)

            // log
            // console.log('taco.store: icrc1BalanceOf() - returned balance:', balance)

            // return balance
            return balance

        } catch (error) {

            // log error
            console.error('error fetching balance from icrc1 canister:', error)

            // return false
            return false

        }

    }

    // sns provided canisters
    const fetchTotalTreasuryValueInUsd = async () => {

        // first fetch the total ICP in the treasury
        // second fetch the total TACO in the treasury
        // convert both to usd
        // add both values together
        // set total treasury value in usd

        /////////////////////////
        // conversion function //
        /////////////////////////

        // convert hex string to Uint8Array
        const hexToUint8Array = (hex: string): Uint8Array => {
            const bytes = new Uint8Array(hex.length / 2)
            for (let i = 0; i < hex.length; i += 2) {
                bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
            }
            return bytes
        }

        /////////////////////////////////////
        // fetch total ICP in the treasury //
        /////////////////////////////////////

        // log
        // console.log('taco.store: fetchTotalTreasuryValueInUsd()')

        // call icrc1 balance of for sns treasury taco balance
        const snsTreasuryTacoBalance = await icrc1BalanceOf(
            'kknbx-zyaaa-aaaaq-aae4a-cai', 
            Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai'),
            hexToUint8Array('ab5aaa420bfefa4244885e1b59347569bafacb144ecb6578fe3aed5cd772dc78')
        )

        // log
        // console.log('treasury taco balance:', snsTreasuryTacoBalance)

        //////////////////////////////////////
        // fetch total TACO in the treasury //
        //////////////////////////////////////
        
        // log
        // console.log('taco.store: fetchTotalTreasuryValueInUsd() - fetching total ICP in the treasury')

        // call icp ledger balance for sns treasury icp balance
        const snsTreasuryIcpBalance = await icrc1BalanceOf(
            'ryjl3-tyaaa-aaaaa-aaaba-cai', // ICP ledger canister ID
            Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai'),
            // hexToUint8Array('df86d44b4cf253518395a3213fbb6b256a27e60fb590c1b27211be9011709fdc')
        )

        // log
        // console.log('treasury icp balance:', snsTreasuryIcpBalance)

        /////////////////
        // format data //
        /////////////////

        // convert balances to numbers
        const tacoBalance = snsTreasuryTacoBalance ? Number(snsTreasuryTacoBalance) : 0
        const icpBalance = snsTreasuryIcpBalance ? Number(snsTreasuryIcpBalance) : 0

        // convert to proper units (ICP has 8 decimals, TACO has 8 decimals)
        const tacoBalanceNormalized = tacoBalance / Math.pow(10, 8)
        const icpBalanceNormalized = icpBalance / Math.pow(10, 8)

        // convert to USD using current prices
        const tacoValueUsd = tacoBalanceNormalized * tacoPriceUsd.value

        // log
        // console.log('taco value in usd: %c$' + tacoValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // convert to USD using current prices
        const icpValueUsd = icpBalanceNormalized * icpPriceUsd.value

        // log
        // console.log('icp value in usd: %c$' + icpValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // calculate total treasury value in usd
        const totalValue = tacoValueUsd + icpValueUsd

        // log total value
        // console.log('total treasury value: %c$' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // set sns treasury taco value in usd
        snsTreasuryTacoValueInUsd.value = tacoValueUsd

        // set sns treasury icp value in usd
        snsTreasuryIcpValueInUsd.value = icpValueUsd

        // set total treasury value in usd
        totalTreasuryValueInUsd.value = totalValue

        // return
        return

    }

    // dao backend
    const fetchTokenDetails = async () => {

        // log
        // console.log('taco.store: fetchTokenDetails()')

        try {

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            let canisterId = daoBackendCanisterId();

            // create actor
            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId(),
            })
            
            //////////////////////
            // post actor logic //

            // get token details
            const tokenDetails = await actor.getTokenDetails()

            // set fetched token details
            // @ts-ignore
            fetchedTokenDetails.value = tokenDetails

            // log
            // console.log('taco.store: fetchTokenDetails() - returned info:', tokenDetails)

            // calculate total portfolio value in USD
            totalPortfolioValueInUsd.value = fetchedTokenDetails.value.reduce((acc, tokenEntry) => {

                // get token details
                const tokenDetails = tokenEntry[1]

                // calculate token value
                const tokenValue = Number(tokenDetails.priceInUSD) * (Number(tokenDetails.balance) / Math.pow(10, Number(tokenDetails.tokenDecimals)))

                // return total value
                return acc + tokenValue

            }, 0)

            // log
            // console.log('taco.store: fetchTokenDetails() - total portfolio value in USD:', totalPortfolioValueInUsd.value)

            // calculate total portfolio value in ICP
            totalPortfolioValueInIcp.value = fetchedTokenDetails.value.reduce((acc, tokenEntry) => {

                // get token details
                const tokenDetails = tokenEntry[1]

                // calculate token value
                const tokenValue = (Number(tokenDetails.priceInICP) / Math.pow(10, 8)) * (Number(tokenDetails.balance) / Math.pow(10, Number(tokenDetails.tokenDecimals)))

                // return total value
                return acc + tokenValue

            }, 0)

            // log
            // console.log('taco.store: fetchTokenDetails() - total portfolio value in ICP:', totalPortfolioValueInIcp.value)

            // return
            return            

        } catch (error) {

            // log error
            console.error('error fetching token details from dao backend:', error)

            // return
            return false

        }

    }
    const fetchAggregateAllocation = async () => {

        // log
        // console.log('taco.store: fetchAggregateAllocation() - Starting fetch...')

        try {

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })


            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId(),
            })

            //////////////////////
            // post actor logic //            

            // get aggregate allocation
            const aggregateAllocation = await actor.getAggregateAllocation()

            // log
            // console.log('taco.store: fetchAggregateAllocation() - returned info:', aggregateAllocation)

            // if invalid response format
            if (!aggregateAllocation || !Array.isArray(aggregateAllocation)) {

                // log error
                console.error('taco.store: fetchAggregateAllocation() - Invalid response format:', aggregateAllocation)

                // return
                return false

            }

            // set fetched aggregate allocation
            fetchedAggregateAllocation.value = aggregateAllocation

            // log
            // console.log('taco.store: fetchAggregateAllocation() - Updated state:', fetchedAggregateAllocation.value)

            // return
            return true

        } catch (error) {

            // log error
            console.error('taco.store: fetchAggregateAllocation() - Error:', error)

            // return
            return false

        }

    }    
    const fetchVotingPowerMetrics = async () => {

        // log
        // console.log('taco.store: fetchVotingPowerMetrics() - Starting fetch...')

        try {

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";
                
            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // create actor
            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId(),
            })

            //////////////////////
            // post actor logic //            

            // get voting power metrics
            const response = await actor.votingPowerMetrics() as VotingMetricsResponse;

            // if invalid response format
            if (!response || !('ok' in response)) {

                // log error
                console.error('taco.store: fetchVotingPowerMetrics() - Invalid response format:', response)

                // return
                return

            }

            // store the response directly instead of wrapping it in an array
            fetchedVotingPowerMetrics.value = response

            // log
            // console.log('taco.store: fetchVotingPowerMetrics() - Updated state:', fetchedVotingPowerMetrics.value)

            // return
            return true

        } catch (error) {

            // log error
            console.error('taco.store: fetchVotingPowerMetrics() - Error:', error)

            // return
            return false

        }

    }
    const fetchUserAllocation = async () => {

        // log
        // console.log('taco.store: fetchUserAllocation()')      

        try {

            // create auth client
            const authClient = await getAuthClient()

            // if user is logged in
            if (await authClient.isAuthenticated()) {

                // get host
                const host = process.env.DFX_NETWORK === "local"
                    ? getLocalHost()
                    : "https://ic0.app";                

                // get identity
                const identity = await authClient.getIdentity()

                // create an agent with the user's identity
                const agent = await createAgent({
                    identity,
                    host,
                    fetchRootKey: process.env.DFX_NETWORK === "local",
                })

                // create actor
                const actor = Actor.createActor(daoBackendIDL, {
                    agent,
                    canisterId: daoBackendCanisterId(),
                })

                //////////////////////
                // post actor logic //            

                // call the userState function
                const userState = await actor.getUserAllocation()

                // set fetched user state
                // @ts-ignore
                fetchedUserAllocation.value = userState

                // log
                // console.log('taco.store: DAO backend - actor.getUserAllocation() - fetchedUserAllocation.value:', fetchedUserAllocation.value)  

                // return
                return true

            } else {

                // log
                // console.log('cannot fetch user state, user not logged in')

                // return
                return false

            }

        } catch (error) {

            // log error
            console.error('error fetching user allocation:', error)

            // return
            return false

        }

    }
    const refreshUserVotingPower = async () => {

        // log
        // console.log('taco.store: refreshUserVotingPower()')      

        try {

            // create auth client
            const authClient = await getAuthClient()

            // if user is logged in
            if (await authClient.isAuthenticated()) {

                // get host
                const host = process.env.DFX_NETWORK === "local"
                    ? getLocalHost()
                    : "https://ic0.app";                

                // get identity
                const identity = await authClient.getIdentity()

                // create an agent with the user's identity
                const agent = await createAgent({
                    identity,
                    host,
                    fetchRootKey: process.env.DFX_NETWORK === "local",
                })

                // create actor
                const actor = Actor.createActor(daoBackendIDL, {
                    agent,
                    canisterId: daoBackendCanisterId(),
                })

                //////////////////////
                // post actor logic //            

                // call the refreshUserVotingPower function
                // @ts-ignore
                const result = await actor.refreshUserVotingPower() as any

                // log the result
                // console.log('taco.store: DAO backend - actor.refreshUserVotingPower() - result:', result)  

                // check if successful
                if (result && result.ok) {
                    // refresh user allocation to get updated data
                    await fetchUserAllocation()
                    
                    // // show success toast
                    // addToast({
                    //     id: Date.now(),
                    //     code: 'voting-power-refreshed',
                    //     title: 'Voting Power Updated',
                    //     icon: 'fa-solid fa-check-circle',
                    //     message: `Updated from ${result.ok.oldVotingPower} to ${result.ok.newVotingPower} VP (${result.ok.neuronsUpdated} neurons)`
                    // })
                    
                    return result.ok
                } else {
                    // handle error case
                    const errorMsg = result && result.err ? JSON.stringify(result.err) : 'Unknown error'
                    console.error('Error refreshing voting power:', errorMsg)
                    
                    // show error toast
                    addToast({
                        id: Date.now(),
                        code: 'voting-power-error',
                        title: 'Voting Power Refresh Failed',
                        icon: 'fa-solid fa-exclamation-triangle',
                        message: `Failed to refresh voting power: ${errorMsg}`
                    })
                    
                    return false
                }

            } else {

                // log
                // console.log('cannot refresh voting power, user not logged in')

                // return
                return false

            }

        } catch (error) {

            // log error
            console.error('error refreshing voting power:', error)

            // show error toast
            addToast({
                id: Date.now(),
                code: 'voting-power-error',
                title: 'Voting Power Refresh Failed',
                icon: 'fa-solid fa-exclamation-triangle',
                message: `Error: ${error}`
            })

            // return
            return false

        }

    }
    const updateAllocation = async (allocations: any) => {

        // log
        // console.log('taco.store: updateAllocation()')

        // turn on loading
        appLoadingOn()        

        try {

            // create auth client
            const authClient = await getAuthClient()

            // if user is logged in
            if (await authClient.isAuthenticated()) {

                // get host
                const host = process.env.DFX_NETWORK === "local"
                    ? getLocalHost()
                    : "https://ic0.app";                

                // get identity
                const identity = await authClient.getIdentity()

                // create an agent with the user's identity
                const agent = await createAgent({
                    identity,
                    host,
                    fetchRootKey: process.env.DFX_NETWORK === "local",
                })

                // create actor
                const actor = Actor.createActor(daoBackendIDL, {
                    agent,
                    canisterId: daoBackendCanisterId(),
                })

                //////////////////////
                // post actor logic //            

                // call the updateAllocation function
                await actor.updateAllocation(allocations)

                // log
                // console.log('taco.store: DAO backend - actor.updateAllocation() - updated allocation')                  

                // turn off loading
                appLoadingOff()

                // return
                return true

            } else {

                // log
                // console.log('cannot update allocation, user not logged in')

                // turn off loading
                appLoadingOff()

                // return
                return false

            }

        } catch (error) {

            // log error
            console.error('error updating allocation:', error)

            // turn off loading
            appLoadingOff()

            // return
            return false

        }
    }
    const followAllocation = async (principal: Principal) => {

        // log
        // console.log('taco.store: followAllocation()')

        // turn on loading
        appLoadingOn()        

        try {

            // create auth client
            const authClient = await getAuthClient()

            // if user is logged in
            if (await authClient.isAuthenticated()) {

                // get host
                const host = process.env.DFX_NETWORK === "local"
                    ? getLocalHost()
                    : "https://ic0.app";                

                // get identity
                const identity = await authClient.getIdentity()

                // create an agent with the user's identity
                const agent = await createAgent({
                    identity,
                    host,
                    fetchRootKey: process.env.DFX_NETWORK === "local",
                })

                // create actor
                const actor = Actor.createActor(daoBackendIDL, {
                    agent,
                    canisterId: daoBackendCanisterId(),
                })

                //////////////////////
                // post actor logic //            

                // call the followAllocation function
                await actor.followAllocation(principal)

                // log
                // console.log('taco.store: DAO backend - actor.followAllocation() - followed allocation')                  

                // turn off loading
                appLoadingOff()

                // return
                return true

            } else {

                // log
                // console.log('cannot follow allocation, user not logged in')

                // turn off loading
                appLoadingOff()

                // return
                return false

            }

        } catch (error) {

            // log
            console.error('error following allocation:', error)

            // turn off loading
            appLoadingOff()

            // return
            return false

        }
    }
    const unfollowAllocation = async (principal: Principal) => {

        // log
        // console.log('taco.store: unfollowAllocation()')

        // turn on loading
        appLoadingOn()        

        try {

            // create auth client
            const authClient = await getAuthClient()

            // if user is logged in
            if (await authClient.isAuthenticated()) {

                // get host
                const host = process.env.DFX_NETWORK === "local"
                    ? getLocalHost()
                    : "https://ic0.app";                

                // get identity
                const identity = await authClient.getIdentity()

                // create an agent with the user's identity
                const agent = await createAgent({
                    identity,
                    host,
                    fetchRootKey: process.env.DFX_NETWORK === "local",
                })

                // create actor
                const actor = Actor.createActor(daoBackendIDL, {
                    agent,
                    canisterId: daoBackendCanisterId(),
                })

                // log
                // console.log('taco.store: DAO backend - actor.unfollowAllocation() - unfollowing allocation:', principal)                  

                // call the unfollowAllocation function
                await actor.unfollowAllocation(principal)

                // log
                // console.log('taco.store: DAO backend - actor.unfollowAllocation() - unfollowed allocation')

                // turn off loading
                appLoadingOff()

                // return
                return true

            } else {

                // log
                // console.log('cannot follow allocation, user not logged in')

                // turn off loading
                appLoadingOff()

                // return
                return false

            }

        } catch (error) {

            // log
            console.error('error unfollowing allocation:', error)

            // turn off loading
            appLoadingOff()

            // return
            return false

        }
    }

    // treasury backend
    const getTradingStatus = async () => {

        // log
        // console.log('taco.store: unfollowAllocation()')   

        try {

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app"

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // create actor
            const actor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId(),
            })
            
            //////////////////////
            // post actor logic //

            // get trading status
            const tradingStatus = await actor.getTradingStatus()

            // set fetched token details
            fetchedTradingStatus.value = tradingStatus

            // return
            return true

        } catch (error) {

            // log error
            console.error('error fetching trading status from treasury backend:', error)

            // return
            return false

        }
    }

    // snassy's
    const getTokenMetadata = async (canisterId: string): Promise<TokenMetadata> => {
        if (tokenMetadataCache.has(canisterId)) {
            return tokenMetadataCache.get(canisterId)!;
        }

        const metadata = await icrc1Metadata(canisterId) as [string, MetadataEntry][];
        if (!metadata) {
            return { symbol: 'UNKNOWN', decimals: 8 }; // Default fallback
        }

        const symbolEntry = metadata.find(m => m[0] === 'symbol')?.[1];
        const decimalsEntry = metadata.find(m => m[0] === 'decimals')?.[1];
        
        const symbol = typeof symbolEntry?.Text === 'string' ? symbolEntry.Text : 'UNKNOWN';
        const decimals = Number(decimalsEntry?.Nat || '8');
        
        const tokenMetadata: TokenMetadata = { symbol, decimals };
        tokenMetadataCache.set(canisterId, tokenMetadata);
        return tokenMetadata;
    }
    const refreshTimerStatus = async () => {
        // console.log('refreshTimerStatus: Starting refresh...');
        try {
            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app"
            //console.log('refreshTimerStatus: Using host:', host);

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })
            //console.log('refreshTimerStatus: Agent created');

            // Create DAO actor for snapshot info
            //console.log('refreshTimerStatus: Using DAO canisterId:', daoCanisterId);

            const daoActor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId(),
            })
            //console.log('refreshTimerStatus: DAO Actor created');

            // Get snapshot info
            const snapshotInfo = await daoActor.getSnapshotInfo() as SnapshotInfo[];
            //console.log('refreshTimerStatus: Raw snapshot info:', snapshotInfo);
            
            if (snapshotInfo && snapshotInfo.length > 0) {
                const info = snapshotInfo[0];
                const snapshotInterval = BigInt(15 * 60 * 1_000_000_000); // 15m in nanoseconds
                const nextExpected = info.lastSnapshotTime + snapshotInterval;
                
                snapshotStatus.value = {
                    active: true,
                    lastSnapshotTime: info.lastSnapshotTime,
                    nextExpectedSnapshot: nextExpected,
                    inProgress: false
                };
                //console.log('refreshTimerStatus: Updated snapshotStatus:', snapshotStatus.value);
            }

            // Create Treasury actor for sync info
            //console.log('refreshTimerStatus: Using Treasury canisterId:', treasuryCanisterId);

            const treasuryActor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            })
            //console.log('refreshTimerStatus: Treasury Actor created');

            // Get treasury status and token details in parallel
            const [tradingStatusResult, tokenDetailsResult] = await Promise.all([
                treasuryActor.getTradingStatus() as Promise<TradingStatusResult>,
                daoActor.getTokenDetails() as Promise<TrustedTokenEntry[]>
            ]);
            //console.log('refreshTimerStatus: Received trading status:', tradingStatusResult);
            //console.log('refreshTimerStatus: Received token details:', tokenDetailsResult);

            // Update token details
            fetchedTokenDetails.value = tokenDetailsResult;

            if ('ok' in tradingStatusResult && tradingStatusResult.ok) {
                const { metrics, executedTrades, rebalanceStatus } = tradingStatusResult.ok;
                timerHealth.value.treasury = {
                    shortSync: {
                        active: true,
                        lastSync: BigInt(metrics.lastUpdate)
                    },
                    rebalanceStatus: 'Idle' in rebalanceStatus ? 'Idle' 
                        : 'Trading' in rebalanceStatus ? 'Trading'
                        : 'Failed',
                    rebalanceError: 'Failed' in rebalanceStatus ? rebalanceStatus.Failed : undefined,
                    tradingMetrics: {
                        lastRebalanceAttempt: BigInt(metrics.lastUpdate),
                        totalTradesExecuted: metrics.totalTradesExecuted,
                        totalTradesFailed: metrics.totalTradesFailed,
                        avgSlippage: metrics.avgSlippage,
                        successRate: metrics.successRate
                    },
                    recentTrades: executedTrades
                };
                
                // Update trading logs from executed trades
                if (executedTrades) {
                    // console.log('refreshTimerStatus: Processing trades with token details:', 
                    //     fetchedTokenDetails.value.map(t => ({
                    //         id: (t[0] as Principal).toText(),
                    //         symbol: t[1]?.tokenSymbol,
                    //         decimals: t[1]?.tokenDecimals?.toString()
                    //     }))
                    // )
                    tradingLogs.value = executedTrades.map((trade: Trade) => {
                        if (trade.error && trade.error.length > 0) {
                            return {
                                timestamp: trade.timestamp,
                                message: `Failed: ${trade.error[0]}`
                            };
                        }
                        
                        // Find token details from our trusted tokens list
                        const soldToken = fetchedTokenDetails.value.find(t => {
                            try {
                                const tradeTokenId = (trade.tokenSold as Principal).toText();
                                const listTokenId = (t[0] as Principal).toText();
                                return tradeTokenId === listTokenId;
                            } catch (error) {
                                console.error('Error comparing sold token IDs:', error);
                                return false;
                            }
                        })?.[1];

                        const boughtToken = fetchedTokenDetails.value.find(t => {
                            try {
                                const tradeTokenId = (trade.tokenBought as Principal).toText();
                                const listTokenId = (t[0] as Principal).toText();
                                return tradeTokenId === listTokenId;
                            } catch (error) {
                                console.error('Error comparing bought token IDs:', error);
                                return false;
                            }
                        })?.[1];

                        if (!soldToken || !boughtToken) {
                            return {
                                timestamp: trade.timestamp,
                                message: `Trade with unknown tokens: ${(trade.tokenSold as Principal).toText()} -> ${(trade.tokenBought as Principal).toText()}`
                            };
                        }

                        // Format amounts using token decimals from our trusted tokens
                        const formattedSoldAmount = Number(trade.amountSold) / Math.pow(10, Number(soldToken.tokenDecimals));
                        const formattedBoughtAmount = Number(trade.amountBought) / Math.pow(10, Number(boughtToken.tokenDecimals));

                        // Extract exchange name from the variant
                        const exchangeName = Object.keys(trade.exchange)[0];

                        return {
                            timestamp: trade.timestamp,
                            message: `${formattedSoldAmount} ${soldToken.tokenSymbol} → ${formattedBoughtAmount} ${boughtToken.tokenSymbol} on ${exchangeName}`
                        };
                    });
                }
                
                //console.log('refreshTimerStatus: Updated treasuryStatus:', timerHealth.value.treasury.shortSync);
                //console.log('refreshTimerStatus: Updated tradingLogs:', tradingLogs.value);
            } else if (tradingStatusResult.err) {
                console.error('refreshTimerStatus: Error getting trading status:', tradingStatusResult.err);
            }
        } catch (error) {
            console.error('refreshTimerStatus: Error refreshing timer status:', error);
        }
    }
    const triggerManualSnapshot = async () => {
        try {
            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // determine canisterId based on network
            let canisterId = daoBackendCanisterId();


            // create actor
            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            })

            timerHealth.value.snapshot.inProgress = true;
            await actor.triggerSnapshot();
            await refreshTimerStatus();
        } catch (error) {
            console.error('Error triggering manual snapshot:', error);
        } finally {
            timerHealth.value.snapshot.inProgress = false;
        }
    }
    const restartSnapshotTimer = async () => {
        try {
            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // determine canisterId based on network
            let canisterId = daoBackendCanisterId();


            // create actor
            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            })

            await actor.startSnapshotTimer();
            await refreshTimerStatus();
        } catch (error) {
            console.error('Error restarting snapshot timer:', error);
        }
    }
    const restartTreasurySyncs = async () => {
        // console.log('TacoStore: restartTreasurySyncs called');
        try {
            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"

            // create agent
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // determine canisterId based on network

            const actor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId(),
            });

            await actor.admin_restartSyncs();
            await refreshTimerStatus();
            // console.log('TacoStore: Treasury syncs restarted');
        } catch (error) {
            console.error('TacoStore: Error restarting treasury syncs:', error);
            throw error;
        }
    }
    const recoverPoolBalances = async () => {
        // console.log('TacoStore: recoverPoolBalances called');
        try {
            // Create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                throw new Error('User not authenticated');
            }

            // Get authenticated identity
            const identity = await authClient.getIdentity();

            // Create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const actor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId(),
            });

            const result = await actor.admin_recoverPoolBalances() as any;
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            await refreshTimerStatus();
            // console.log('TacoStore: Pool balances recovered:', result.ok);
        } catch (error) {
            console.error('TacoStore: Error recovering pool balances:', error);
            throw error;
        }
    }  
    const triggerManualSync = async () => {
        try {
            // get host
            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // get identity
            const identity = await authClient.getIdentity();

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"

            // create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // create actor
            const actor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId(),
            })

            await actor.admin_syncWithDao();
            await refreshTimerStatus();
        } catch (error) {
            console.error('Error triggering manual sync:', error);
        }
    }
    const fetchSystemLogs = async () => {
        // console.log('fetchSystemLogs: Starting to fetch logs...');
        try {
            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                // console.log('fetchSystemLogs: User not authenticated');
                return;
            }

            // get identity
            const identity = await authClient.getIdentity();
            // console.log('fetchSystemLogs: Got authenticated identity');

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"
            // console.log('fetchSystemLogs: Using host:', host);

            // create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })
            // console.log('fetchSystemLogs: Agent created with authenticated identity');

            // determine canisterId based on network
            let canisterId = daoBackendCanisterId();

            // console.log('fetchSystemLogs: Using canisterId:', canisterId);

            // create actor
            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            })
            // console.log('fetchSystemLogs: Actor created');

            const logs = await actor.getLogs(100) as SystemLog[];
            // console.log('fetchSystemLogs: Received logs:', logs);
            systemLogs.value = logs;
            // console.log('fetchSystemLogs: Updated systemLogs.value:', systemLogs.value);
        } catch (error) {
            console.error('fetchSystemLogs: Error fetching system logs:', error);
        }
    }
    const startRebalancing = async () => {
        try {
            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // get identity
            const identity = await authClient.getIdentity();

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"

            // create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // create actor
            const actor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId(),
            })

            const result = await actor.startRebalancing() as RebalanceResult;
            if ('err' in result) {
                console.error('Error starting rebalancing:', result.err);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error starting rebalancing:', error);
            return false;
        }
    }
    const stopRebalancing = async () => {
        try {
            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // get identity
            const identity = await authClient.getIdentity();

            // get host
            const host = process.env.DFX_NETWORK === "local"
                ? `http://localhost:54612`
                : "https://ic0.app"

            // create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })

            // create actor
            const actor = Actor.createActor(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId(),
            })

            const result = await actor.stopRebalancing() as RebalanceResult;
            if ('err' in result) {
                console.error('Error stopping rebalancing:', result.err);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error stopping rebalancing:', error);
            return false;
        }
    }
    const updateRebalanceConfig = async (updates: UpdateConfig) => {
        // console.log('TacoStore: updateRebalanceConfig called with', updates);
        try {
            appLoadingOn();

            // NOTE TO AI: DO NOT CHANGE THIS PATTERN FOR OTHER FUNCTIONS
            // DO NOT INTRODUCE A getTreasuryActor method !!
            // JUST LEAVE THIS CODE HERE AS IS !!
            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Get the identity
            const identity = await authClient.getIdentity();
            
            // Create an agent with the identity
            const agent = await createAgent({
                identity,
                host: import.meta.env.VITE_IC_HOST
            });

            // Create treasury actor with authenticated identity
            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });
            // END OF NOTE TO AI!

            const result = await treasury.updateRebalanceConfig(updates, []);
            // console.log('TacoStore: updateRebalanceConfig result:', result);

            if ('ok' in result) {
                addToast({
                    id: Date.now(),
                    code: 'success',
                    title: 'Success',
                    icon: 'fa-solid fa-check',
                    message: 'Configuration updated successfully'
                });
                await refreshTimerStatus();
            } else {
                // Convert the error variant to a string
                let errorMessage = 'Unknown error';
                if (typeof result.err === 'object') {
                    // Extract the error message from the variant
                    const errorVariant = result.err;
                    const errorType = Object.keys(errorVariant)[0];
                    const errorDetail = Object.values(errorVariant)[0];
                    errorMessage = `${errorType}: ${errorDetail}`;
                } else {
                    errorMessage = String(result.err);
                }
                console.error('Failed to update configuration:', errorMessage);
                addToast({
                    id: Date.now(),
                    code: 'error',
                    title: 'Error',
                    icon: 'fa-solid fa-triangle-exclamation',
                    message: 'Failed to update configuration: ' + errorMessage
                });
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error('Error updating configuration:', error);
            addToast({
                id: Date.now(),
                code: 'error',
                title: 'Error',
                icon: 'fa-solid fa-triangle-exclamation',
                message: 'Error updating configuration: ' + (error.message || String(error))
            });
            throw error;
        } finally {
            appLoadingOff();
        }
    }
    const getRebalanceConfig = async () => {
        try {
            appLoadingOn();

            // NOTE TO AI: DO NOT CHANGE THIS PATTERN FOR OTHER FUNCTIONS
            // DO NOT INTRODUCE A getTreasuryActor method !!
            // JUST LEAVE THIS CODE HERE AS IS !!

            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Get the identity
            const identity = await authClient.getIdentity();
            
            // Create an agent with the identity
            const agent = await createAgent({
                identity,
                host: import.meta.env.VITE_IC_HOST
            });

            // Create treasury actor with authenticated identity
            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            // END OF NOTE TO AI!

            // Get the current config using getSystemParameters
            const config = await treasury.getSystemParameters();
            if (!config) {
                throw new Error('Failed to get system parameters');
            }
            rebalanceConfig.value = config;
            return config;

        } catch (error) {
            console.error('Error getting system parameters:', error);
            throw error;
        } finally {
            appLoadingOff();
        }
    }
    const getSystemParameters = async () => {
        try {
            appLoadingOn();

            // NOTE TO AI: DO NOT CHANGE THIS PATTERN FOR OTHER FUNCTIONS
            // DO NOT INTRODUCE A getTreasuryActor method !!
            // JUST LEAVE THIS CODE HERE AS IS !!

            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Get the identity
            const identity = await authClient.getIdentity();
            
            // Create an agent with the identity
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });
            let canisterId = daoBackendCanisterId();


            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            });

            // END OF NOTE TO AI!

            // Get the current config using getSystemParameters
            const config = await actor.getSystemParameters();
            if (!config) {
                throw new Error('Failed to get system parameters');
            }
            systemParameters.value = config as GetSystemParameterResult;
            return config;

        } catch (error) {
            console.error('Error getting system parameters:', error);
            throw error;
        } finally {
            appLoadingOff();
        }
    }
    const executeTradingCycle = async () => {
        appLoadingOn();
        try {
            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Get the identity
            const identity = await authClient.getIdentity();
            
            // Create an agent with the identity
            const agent = await createAgent({
                identity,
                host: import.meta.env.VITE_IC_HOST
            });

            // Create treasury actor with authenticated identity
            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            await treasury.admin_executeTradingCycle();
        } catch (error) {
            console.error('Error executing trading cycle:', error);
            throw error;
        } finally {
            appLoadingOff();
        }
    }
    const pauseToken = async (principal: Principal, reason: string): Promise<boolean> => {
        // console.log('TacoStore: pauseToken called for', principal.toText());
        try {
            // Create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // Get authenticated identity
            const identity = await authClient.getIdentity();

            // Create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            let canisterId = daoBackendCanisterId();


            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            });

            const result = await actor.pauseTokenWithReason(principal, reason) as Result_1;
            if ('err' in result) {
                console.error('Error pausing token:', result.err);
                return false;
            }
            // console.log('TacoStore: Token paused successfully');
            return true;
        } catch (error) {
            console.error('TacoStore: Error pausing token:', error);
            return false;
        }
    }
    const unpauseToken = async (principal: Principal, reason: string): Promise<boolean> => {
        // console.log('TacoStore: unpauseToken called for', principal.toText());
        try {
            // Create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // Get authenticated identity
            const identity = await authClient.getIdentity();

            // Create agent with authenticated identity
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            let canisterId = daoBackendCanisterId();


            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            });

            const result = await actor.unpauseTokenWithReason(principal, reason) as Result_1;
            if ('err' in result) {
                console.error('Error unpausing token:', result.err);
                return false;
            }
            // console.log('TacoStore: Token unpaused successfully');
            return true;
        } catch (error) {
            console.error('TacoStore: Error unpausing token:', error);
            return false;
        }
    }
    const fetchVoterDetails = async () => {
        // console.log('taco.store: fetchVoterDetails() - Starting fetch...');
        try {
            // Create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // Get authenticated identity
            const identity = await authClient.getIdentity();


            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            })
            // console.log('taco.store: fetchVoterDetails() - Agent created');

            let canisterId = daoBackendCanisterId();

            // console.log('taco.store: fetchVoterDetails() - Using canisterId:', canisterId);

            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            })
            // console.log('taco.store: fetchVoterDetails() - Actor created');

            const voterDetails = await actor.admin_getUserAllocations();
            // console.log('taco.store: fetchVoterDetails() - Raw response:', voterDetails);

            if (!voterDetails || !Array.isArray(voterDetails)) {
                console.error('taco.store: fetchVoterDetails() - Invalid response format:', voterDetails);
                return;
            }

            fetchedVoterDetails.value = voterDetails.map(([principal, state]) => ({
                principal,
                state
            }));
            // console.log('taco.store: fetchVoterDetails() - Updated state:', fetchedVoterDetails.value);
            return;
        } catch (error) {
            console.error('taco.store: fetchVoterDetails() - Error:', error);
            throw error;
        }
    }
    const fetchNeuronAllocations = async () => {
        try {
            // Create auth client
            const authClient = await getAuthClient();

            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return false;
            }

            // Get authenticated identity
            const identity = await authClient.getIdentity();

            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            let canisterId = daoBackendCanisterId();


            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            });

            const result = await actor.admin_getNeuronAllocations();
            // console.log('Raw neuron allocations:', result);

            if (!Array.isArray(result)) {
                console.error('Expected array response from admin_getNeuronAllocations, got:', typeof result);
                fetchedNeuronAllocations.value = [];
                return;
            }

            fetchedNeuronAllocations.value = result.map(([neuronId, allocation]) => ({
                neuronId,
                votingPower: allocation.votingPower,
                lastUpdate: allocation.lastUpdate,
                lastAllocationMaker: allocation.lastAllocationMaker,
                allocations: allocation.allocations.map((alloc: Allocation) => [alloc.token.toText(), BigInt(alloc.basisPoints)])
            }));

            // console.log('Processed neuron allocations:', fetchedNeuronAllocations.value);
        } catch (error) {
            console.error('Error fetching neuron allocations:', error);
            fetchedNeuronAllocations.value = [];
        }
    }
    const adminGetUserAllocation = async (principal: Principal) => {
        // console.log('taco.store: adminGetUserAllocation() - Starting fetch for principal:', principal.toString());
        try {
            // Create auth client
            const authClient = await getAuthClient();

            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                console.error('User not authenticated');
                return null;
            }

            // Get authenticated identity
            const identity = await authClient.getIdentity();

            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            let canisterId = daoBackendCanisterId();

            const actor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId,
            });

            const result = await actor.admin_getUserAllocation(principal);
            // console.log('taco.store: adminGetUserAllocation() - Raw response:', result);

            return result;
        } catch (error: any) {
            console.error('taco.store: adminGetUserAllocation() - Error:', error);
            throw error;
        }
    }
    const updateSystemParameter = async (paramName: string, value: bigint): Promise<boolean> => {
        // console.log('TacoStore: updateSystemParameter called with', paramName, value);
        try {
            appLoadingOn();

            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Get the identity
            const identity = await authClient.getIdentity();
            
            // Create an agent with the identity
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });


            let canisterId = daoBackendCanisterId();


            // Create treasury actor with authenticated identity
            const backend = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId
            });

            const result = await backend.updateSystemParameter(paramName, value) as SystemParameterResult;
            
            if ('ok' in result) {
                addToast({
                    id: Date.now(),
                    code: 'success',
                    title: 'Success',
                    icon: 'fa-solid fa-check',
                    message: 'System parameter updated successfully'
                });
                await refreshTimerStatus();
                return true;
            } else {
                const errorMessage = 'Failed to update system parameter: ' + JSON.stringify(result.err);
                console.error(errorMessage);
                addToast({
                    id: Date.now(),
                    code: 'error',
                    title: 'Error',
                    icon: 'fa-solid fa-triangle-exclamation',
                    message: errorMessage
                });
                return false;
            }
        } catch (error: any) {
            console.error('Error updating system parameter:', error);
            addToast({
                id: Date.now(),
                code: 'error',
                title: 'Error',
                icon: 'fa-solid fa-triangle-exclamation',
                message: 'Error updating system parameter: ' + (error.message || String(error))
            });
            return false;
        } finally {
            appLoadingOff();
        }
    }
    const updateSnapshotInterval = async (intervalNS: bigint): Promise<boolean> => {
        // console.log('TacoStore: updateSnapshotInterval called with', intervalNS);
        try {
            appLoadingOn();

            // create auth client
            const authClient = await getAuthClient();
            
            // Check if user is authenticated
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Get the identity
            const identity = await authClient.getIdentity();
            
            // Create an agent with the identity
            
            // Create an agent with the identity
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });


            let canisterId = daoBackendCanisterId();


            // Create treasury actor with authenticated identity
            const backend = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId
            });

            // Create update config with just the snapshot interval
            //const updateConfig: UpdateConfig = {
            //    snapshotIntervalNS: [intervalNS]
            //};

            const result = await backend.updateSystemParameter({ SnapshotInterval: intervalNS }) as SystemParameterResult;
            
            if ('ok' in result) {
                addToast({
                    id: Date.now(),
                    code: 'success',
                    title: 'Success',
                    icon: 'fa-solid fa-check',
                    message: 'Snapshot interval updated successfully'
                });
                await refreshTimerStatus();
                return true;
            } else {
                const errorMessage = 'Failed to update snapshot interval: ' + JSON.stringify(result.err);
                console.error(errorMessage);
                addToast({
                    id: Date.now(),
                    code: 'error',
                    title: 'Error',
                    icon: 'fa-solid fa-triangle-exclamation',
                    message: errorMessage
                });
                return false;
            }
        } catch (error: any) {
            console.error('Error updating snapshot interval:', error);
            addToast({
                id: Date.now(),
                code: 'error',
                title: 'Error',
                icon: 'fa-solid fa-triangle-exclamation',
                message: 'Error updating snapshot interval: ' + (error.message || String(error))
            });
            return false;
        } finally {
            appLoadingOff();
        }
    }

    // Treasury Log Methods
    const getTreasuryLogs = async (count: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.getLogs(BigInt(count));
        } catch (error: any) {
            console.error('Error fetching treasury logs:', error);
            throw error;
        }
    }
    const getTreasuryLogsByContext = async (context: string, count: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.getLogsByContext(context, BigInt(count));
        } catch (error: any) {
            console.error('Error fetching treasury logs by context:', error);
            throw error;
        }
    }
    const getTreasuryLogsByLevel = async (level: any, count: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.getLogsByLevel(level, BigInt(count));
        } catch (error: any) {
            console.error('Error fetching treasury logs by level:', error);
            throw error;
        }
    }
    const clearTreasuryLogs = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.clearLogs();
        } catch (error: any) {
            console.error('Error clearing treasury logs:', error);
            throw error;
        }
    }

    // price failsafe system methods
    const listTriggerConditions = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.listTriggerConditions();
        } catch (error: any) {
            console.error('Error listing trigger conditions:', error);
            throw error;
        }
    }
    const addTriggerCondition = async (
        name: string,
        direction: string,
        percentage: number,
        timeWindowNS: bigint,
        applicableTokens: Principal[]
    ) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.addTriggerCondition(
                name,
                direction === 'Up' ? { Up: null } : { Down: null },
                percentage,
                timeWindowNS,
                applicableTokens
            );
        } catch (error: any) {
            console.error('Error adding trigger condition:', error);
            throw error;
        }
    }
    const setTriggerConditionActive = async (conditionId: number, isActive: boolean) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.setTriggerConditionActive(BigInt(conditionId), isActive);
        } catch (error: any) {
            console.error('Error setting trigger condition active:', error);
            throw error;
        }
    }
    const removeTriggerCondition = async (conditionId: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.removeTriggerCondition(BigInt(conditionId));
        } catch (error: any) {
            console.error('Error removing trigger condition:', error);
            throw error;
        }
    }
    const getPriceAlerts = async (offset: number, limit: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.getPriceAlerts(BigInt(offset), BigInt(limit));
        } catch (error: any) {
            console.error('Error getting price alerts:', error);
            throw error;
        }
    }
    const clearPriceAlerts = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.clearPriceAlerts();
        } catch (error: any) {
            console.error('Error clearing price alerts:', error);
            throw error;
        }
    }

    // trading pause management functions
    const listTradingPauses = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.listTradingPauses();
        } catch (error: any) {
            console.error('Error listing trading pauses:', error);
            throw error;
        }
    }
    const getTradingPauseInfo = async (token: Principal) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.getTradingPauseInfo(token);
        } catch (error: any) {
            console.error('Error getting trading pause info:', error);
            throw error;
        }
    }
    const unpauseTokenFromTrading = async (token: Principal) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.unpauseTokenFromTrading(token);
        } catch (error: any) {
            console.error('Error unpausing token from trading:', error);
            throw error;
        }
    }
    const pauseTokenFromTradingManual = async (token: Principal, reason: string) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.pauseTokenFromTradingManual(token, reason);
        } catch (error: any) {
            console.error('Error pausing token from trading:', error);
            throw error;
        }
    }
    const clearAllTradingPauses = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.clearAllTradingPauses();
        } catch (error: any) {
            console.error('Error clearing all trading pauses:', error);
            throw error;
        }
    }
    const getTokenPriceHistory = async (tokens: Principal[]) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.getTokenPriceHistory(tokens);
            if ('ok' in result) {
                return result.ok;
            } else {
                console.error('Error getting token price history:', result.err);
                return [];
            }
        } catch (error: any) {
            console.error('Error getting token price history:', error);
            throw error;
        }
    }
    const getPortfolioHistory = async (limit: number = 1000) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const dao = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId()
            });

            const result = await dao.getHistoricBalanceAndAllocation(BigInt(limit));
            return result;
        } catch (error: any) {
            console.error('Error getting portfolio history:', error);
            throw error;
        }
    }
    const getTreasuryPortfolioHistory = async (limit: number = 1000) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.getPortfolioHistory(BigInt(limit));
            if ('ok' in result) {
                return result.ok;
            } else {
                console.error('Error getting treasury portfolio history:', result.err);
                return { snapshots: [], totalCount: BigInt(0) };
            }
        } catch (error: any) {
            console.error('Error getting treasury portfolio history:', error);
            return { snapshots: [], totalCount: BigInt(0) };
        }
    }
    const takeManualPortfolioSnapshot = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.takeManualPortfolioSnapshot();
            if ('ok' in result) {
                // console.log('Manual portfolio snapshot taken:', result.ok);
                return result.ok;
            } else {
                console.error('Error taking manual portfolio snapshot:', result.err);
                throw new Error('Failed to take manual portfolio snapshot');
            }
        } catch (error: any) {
            console.error('Error taking manual portfolio snapshot:', error);
            throw error;
        }
    }

    // portfolio circuit breaker
    const listPortfolioCircuitBreakerConditions = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.listPortfolioCircuitBreakerConditions();
            return result;
        } catch (error: any) {
            console.error('Error listing portfolio circuit breaker conditions:', error);
            throw error;
        }
    }
    const addPortfolioCircuitBreakerCondition = async (
        name: string,
        direction: string,
        percentage: number,
        timeWindowNS: bigint,
        valueType: string
    ) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const directionVariant = direction === 'Up' ? { Up: null } : { Down: null };
            const valueTypeVariant = valueType === 'ICP' ? { ICP: null } : { USD: null };
            
            const result = await treasury.addPortfolioCircuitBreakerCondition(
                name,
                directionVariant,
                percentage,
                timeWindowNS,
                valueTypeVariant
            );
            
            if ('ok' in result) {
                // console.log('Portfolio circuit breaker condition added:', result.ok);
                return result.ok;
            } else {
                console.error('Error adding portfolio circuit breaker condition:', result.err);
                throw new Error('Failed to add portfolio circuit breaker condition');
            }
        } catch (error: any) {
            console.error('Error adding portfolio circuit breaker condition:', error);
            throw error;
        }
    }
    const setPortfolioCircuitBreakerConditionActive = async (conditionId: number, isActive: boolean) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.setPortfolioCircuitBreakerConditionActive(BigInt(conditionId), isActive);
            
            if ('ok' in result) {
                // console.log('Portfolio circuit breaker condition active status changed:', result.ok);
                return result.ok;
            } else {
                console.error('Error setting portfolio circuit breaker condition active:', result.err);
                throw new Error('Failed to set portfolio circuit breaker condition active');
            }
        } catch (error: any) {
            console.error('Error setting portfolio circuit breaker condition active:', error);
            throw error;
        }
    }
    const removePortfolioCircuitBreakerCondition = async (conditionId: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.removePortfolioCircuitBreakerCondition(BigInt(conditionId));
            
            if ('ok' in result) {
                // console.log('Portfolio circuit breaker condition removed:', result.ok);
                return result.ok;
            } else {
                console.error('Error removing portfolio circuit breaker condition:', result.err);
                throw new Error('Failed to remove portfolio circuit breaker condition');
            }
        } catch (error: any) {
            console.error('Error removing portfolio circuit breaker condition:', error);
            throw error;
        }
    }
    const getPortfolioCircuitBreakerLogs = async (offset: number, limit: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.getPortfolioCircuitBreakerLogs(BigInt(offset), BigInt(limit));
            return result;
        } catch (error: any) {
            console.error('Error getting portfolio circuit breaker logs:', error);
            throw error;
        }
    }
    const clearPortfolioCircuitBreakerLogs = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await treasury.clearPortfolioCircuitBreakerLogs();
            
            if ('ok' in result) {
                // console.log('Portfolio circuit breaker logs cleared:', result.ok);
                return result.ok;
            } else {
                console.error('Error clearing portfolio circuit breaker logs:', result.err);
                throw new Error('Failed to clear portfolio circuit breaker logs');
            }
        } catch (error: any) {
            console.error('Error clearing portfolio circuit breaker logs:', error);
            throw error;
        }
    }

    // neuron snapshots
    const getNeuronSnapshotStatus = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.get_neuron_snapshot_status();
        } catch (error: any) {
            console.error('Error getting neuron snapshot status:', error);
            throw error;
        }
    }
    const getNeuronSnapshotsInfo = async (start: number, length: number) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.get_neuron_snapshots_info(BigInt(start), BigInt(length));
        } catch (error: any) {
            console.error('Error getting neuron snapshots info:', error);
            throw error;
        }
    }
    const getNeuronSnapshotInfo = async (snapshotId: bigint) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.get_neuron_snapshot_info(snapshotId);
        } catch (error: any) {
            console.error('Error getting neuron snapshot info:', error);
            throw error;
        }
    }
    const getCumulativeValuesAtSnapshot = async (snapshotId: bigint | null) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.getCumulativeValuesAtSnapshot(snapshotId ? [snapshotId] : []);
        } catch (error: any) {
            console.error('Error getting cumulative values at snapshot:', error);
            throw error;
        }
    }
    const getNeuronDataForDAO = async (snapshotId: bigint, start: number, limit: number) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.getNeuronDataForDAO(snapshotId, BigInt(start), BigInt(limit));
        } catch (error: any) {
            console.error('Error getting neuron data for DAO:', error);
            throw error;
        }
    }
    const takeNeuronSnapshot = async () => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.take_neuron_snapshot();
        } catch (error: any) {
            console.error('Error taking neuron snapshot:', error);
            throw error;
        }
    }
    const getMaxNeuronSnapshots = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            return await neuronSnapshot.getMaxNeuronSnapshots();
        } catch (error: any) {
            console.error('Error getting max neuron snapshots:', error);
            throw error;
        }
    }
    const setMaxNeuronSnapshots = async (maxSnapshots: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const neuronSnapshot = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
                agent,
                canisterId: neuronSnapshotCanisterId()
            });

            await neuronSnapshot.setMaxNeuronSnapshots(BigInt(maxSnapshots));
            // console.log('Successfully set max neuron snapshots to:', maxSnapshots);
            return true;
        } catch (error: any) {
            console.error('Error setting max neuron snapshots:', error);
            throw error;
        }
    }
    const getMaxPriceHistoryEntries = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await treasury.getMaxPriceHistoryEntries();
        } catch (error: any) {
            console.error('Error getting max price history entries:', error);
            throw error;
        }
    }
    const getMaxPortfolioSnapshots = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            return await (treasury as any).getMaxPortfolioSnapshots();
        } catch (error: any) {
            console.error('Error getting max portfolio snapshots:', error);
            throw error;
        }
    }
    const updateMaxPortfolioSnapshots = async (newLimit: number) => {
        try {
            const authClient = await getAuthClient();
            
            if (!await authClient.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const identity = await authClient.getIdentity();
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const result = await (treasury as any).updateMaxPortfolioSnapshots(BigInt(newLimit));
            if ('ok' in result) {
                // console.log('Successfully updated max portfolio snapshots:', result.ok);
                return result.ok;
            } else {
                console.error('Error updating max portfolio snapshots:', result.err);
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error updating max portfolio snapshots:', error);
            throw error;
        }
    }

    // forum system methods
    const sneedForumCanisterId = () => {
        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_NEURONSNAPSHOT_IC || 'mcigm-4aaaa-aaaad-qhlkq-cai';
                break;
            case "staging":
                return  process.env.CANISTER_ID_NEURONSNAPSHOT_STAGING || 'mcigm-4aaaa-aaaad-qhlkq-cai'; // nrtf2-wiaaa-aaaad-aankq-cai << real staging
                break;
        }        
        return 'mcigm-4aaaa-aaaad-qhlkq-cai'; 
    }
    const tacoSnsRootCanisterId = () => {
        // TACO DAO SNS root canister ID
        return 'lacdn-3iaaa-aaaaq-aae3a-cai';
    }
    const getAllForums = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const forums = await forumActor.get_forums();
            fetchedForums.value = forums;
            // console.log('Fetched forums:', forums);
            return forums;
        } catch (error: any) {
            console.error('Error getting forums:', error);
            throw error;
        }
    }
    const findTacoForum = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            // Direct lookup using SNS root canister ID (much more efficient!)
            const tacoSnsRoot = Principal.fromText(tacoSnsRootCanisterId());
            const tacoForum = await forumActor.get_forum_by_sns_root(tacoSnsRoot);
            
            if (tacoForum && tacoForum.length > 0) {
                const forum = tacoForum[0]!;
                tacoForumId.value = forum.id;
                // console.log('Found TACO forum via direct lookup:', forum);
                return forum;
            } else {
                // console.log('TACO forum not found for SNS root canister ID:', tacoSnsRoot.toString());
                return null;
            }
        } catch (error: any) {
            console.error('Error finding TACO forum:', error);
            throw error;
        }
    }
    const getProposalsTopic = async (forumId: bigint) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const proposalsTopicMapping = await forumActor.get_proposals_topic(forumId);
            
            if (proposalsTopicMapping.length > 0) {
                const mapping = proposalsTopicMapping[0]!;
                proposalsTopicId.value = mapping.proposals_topic_id;
                // console.log('Found proposals topic:', mapping);
                return mapping;
            } else {
                // console.log('Proposals topic not found for forum:', forumId);
                return null;
            }
        } catch (error: any) {
            console.error('Error getting proposals topic:', error);
            throw error;
        }
    }
    const getProposalsTopicDirect = async () => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            // Direct lookup using SNS root canister ID - super efficient!
            const tacoSnsRoot = Principal.fromText(tacoSnsRootCanisterId());
            const proposalsTopicMapping = await forumActor.get_proposals_topic_by_sns_root(tacoSnsRoot);
            
            if (proposalsTopicMapping && proposalsTopicMapping.length > 0) {
                const mapping = proposalsTopicMapping[0]!;
                proposalsTopicId.value = mapping.proposals_topic_id;
                // console.log('Found proposals topic via direct SNS lookup:', mapping);
                return mapping;
            } else {
                // console.log('Proposals topic not found for SNS root canister ID:', tacoSnsRoot.toString());
                return null;
            }
        } catch (error: any) {
            console.error('Error getting proposals topic via direct lookup:', error);
            throw error;
        }
    }
    const getThreadsByTopic = async (topicId: bigint) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const threads = await forumActor.get_threads_by_topic(topicId);
            fetchedProposalsThreads.value = threads;
            // console.log('Fetched threads for topic:', topicId, threads);
            return threads;
        } catch (error: any) {
            console.error('Error getting threads by topic:', error);
            throw error;
        }
    }
    const getPostsByThread = async (threadId: bigint) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const posts = await forumActor.get_posts_by_thread(threadId);
            fetchedThreadPosts.value = posts;
            // console.log('Fetched posts for thread:', threadId, posts);
            return posts;
        } catch (error: any) {
            console.error('Error getting posts by thread:', error);
            throw error;
        }
    }
    const getProposalsThreads = async () => {
        try {
            // console.log('🔍 Starting getProposalsThreads... (OPTIMIZED VERSION)');
            
            // Skip the forum lookup and go directly to proposals topic via SNS root!
            // console.log('🔍 Step 1: Getting proposals topic via direct SNS root lookup...');
            const proposalsMapping = await getProposalsTopicDirect();
            if (!proposalsMapping) {
                // console.log('❌ Proposals topic not found via direct lookup');
                throw new Error('Proposals topic not found');
            }
            // console.log('✅ Found proposals topic with ID:', proposalsMapping.proposals_topic_id.toString());

            // Get all threads in the proposals topic
            // console.log('🔍 Step 2: Getting threads for topic ID:', proposalsMapping.proposals_topic_id.toString());
            const threads = await getThreadsByTopic(proposalsMapping.proposals_topic_id);
            // console.log('✅ Found', threads.length, 'threads');
            return threads;
        } catch (error: any) {
            console.error('❌ Error getting proposals threads:', error);
            throw error;
        }
    }
    const getThread = async (threadId: bigint) => {
        try {
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const thread = await forumActor.get_thread(threadId);
            // console.log('Fetched thread:', threadId, thread);
            return thread;
        } catch (error: any) {
            console.error('Error getting thread:', error);
            throw error;
        }
    }
    const getProposalThread = async (proposalId: bigint) => {
        try {
            // console.log('🔍 Looking up thread for proposal ID:', proposalId.toString());
            
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const tacoSnsRoot = Principal.fromText(tacoSnsRootCanisterId());
            const proposalThreadMapping = await forumActor.get_proposal_thread(tacoSnsRoot, proposalId);
            
            if (proposalThreadMapping && proposalThreadMapping.length > 0) {
                const mapping = proposalThreadMapping[0]!;
                // console.log('✅ Found existing thread mapping:', mapping);
                
                // Now get the actual thread details
                const thread = await forumActor.get_thread(mapping.thread_id);
                if (thread && thread.length > 0) {
                    // console.log('✅ Found thread details:', thread[0]);
                    return {
                        mapping,
                        thread: thread[0],
                        exists: true
                    };
                }
            }
            
            // console.log('❌ No thread found for proposal:', proposalId.toString());
            return {
                mapping: null,
                thread: null,
                exists: false
            };
        } catch (error: any) {
            console.error('Error getting proposal thread:', error);
            throw error;
        }
    }
    const createProposalThread = async (proposalId: bigint) => {
        try {
            // console.log('🔧 Creating thread for proposal ID:', proposalId.toString());
            
            if (!userLoggedIn.value) {
                throw new Error('Must be logged in to create proposal threads');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const tacoSnsRoot = Principal.fromText(tacoSnsRootCanisterId());
            const result = await forumActor.create_proposal_thread_with_auto_setup({
                sns_root_canister_id: tacoSnsRoot,
                proposal_id: proposalId
            });
            
            if ('ok' in result) {
                // console.log('✅ Successfully created proposal thread with ID:', result.ok);
                return {
                    success: true,
                    threadId: result.ok
                };
            } else {
                console.error('❌ Failed to create proposal thread:', result.err);
                throw new Error(`Failed to create thread: ${JSON.stringify(result.err)}`);
            }
        } catch (error: any) {
            console.error('Error creating proposal thread:', error);
            throw error;
        }
    }
    const createPost = async (threadId: bigint, body: string, replyToPostId?: bigint, title?: string) => {
        try {
            // console.log('🔧 Creating post for thread ID:', threadId.toString());
            
            if (!userLoggedIn.value) {
                throw new Error('Must be logged in to create posts');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const result = await forumActor.create_post(
                threadId,
                replyToPostId ? [replyToPostId] : [],
                title ? [title] : [],
                body
            );
            
            if ('ok' in result) {
                // console.log('✅ Successfully created post with ID:', result.ok);
                return {
                    success: true,
                    postId: result.ok
                };
            } else {
                console.error('❌ Failed to create post:', result.err);
                throw new Error(`Failed to create post: ${JSON.stringify(result.err)}`);
            }
        } catch (error: any) {
            console.error('Error creating post:', error);
            throw error;
        }
    }
    const voteOnPost = async (postId: bigint, voteType: 'upvote' | 'downvote') => {
        try {
            // console.log('🗳️ Voting on post ID:', postId.toString(), 'vote type:', voteType);
            
            if (!userLoggedIn.value) {
                throw new Error('Must be logged in to vote');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const voteTypeVariant = voteType === 'upvote' ? { upvote: null } : { downvote: null };
            const result = await forumActor.vote_on_post(postId, voteTypeVariant);
            
            if ('ok' in result) {
                // console.log('✅ Successfully voted on post');
                return {
                    success: true
                };
            } else {
                console.error('❌ Failed to vote on post:', result.err);
                throw new Error(`Failed to vote: ${JSON.stringify(result.err)}`);
            }
        } catch (error: any) {
            console.error('Error voting on post:', error);
            throw error;
        }
    }
    const retractVote = async (postId: bigint) => {
        try {
            // console.log('🔄 Retracting vote on post ID:', postId.toString());
            
            if (!userLoggedIn.value) {
                throw new Error('Must be logged in to retract vote');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const result = await forumActor.retract_vote(postId);
            
            if ('ok' in result) {
                // console.log('✅ Successfully retracted vote');
                return {
                    success: true
                };
            } else {
                console.error('❌ Failed to retract vote:', result.err);
                throw new Error(`Failed to retract vote: ${JSON.stringify(result.err)}`);
            }
        } catch (error: any) {
            console.error('Error retracting vote:', error);
            throw error;
        }
    }
    const getPostVotes = async (postId: bigint) => {
        try {
            // console.log('📊 Getting votes for post ID:', postId.toString());
            
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
                agent,
                canisterId: sneedForumCanisterId()
            });

            const votes = await forumActor.get_post_votes(postId);
            // console.log('✅ Retrieved votes for post:', votes);
            return votes;
        } catch (error: any) {
            console.error('Error getting post votes:', error);
            throw error;
        }
    }
    const toggleThreadMenu = () => {

        // log
        // console.log('toggleThreadMenu', threadMenuOpen.value)

        // toggle thread menu
        threadMenuOpen.value = !threadMenuOpen.value
        
    }

    // taco dao proposal methods
    const tacoSnsGovernanceCanisterId = () => {
        // TACO DAO SNS governance canister ID
        return 'lhdfz-wqaaa-aaaaq-aae3q-cai';
    }
    const fetchTacoProposalsInternal = async (beforeProposal: bigint | null = null, limit: number = 20) => {
        // console.log('🔍 Fetching TACO DAO proposals...', beforeProposal ? `before ID ${beforeProposal}` : 'from latest');
        // console.log('🔗 Using SNS governance canister:', tacoSnsGovernanceCanisterId());
        
        const agent = await createAgent({
            identity: new AnonymousIdentity(),
            host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
            fetchRootKey: process.env.DFX_NETWORK === "local",
        });

        const governanceActor = Actor.createActor(snsGovernanceIDL, {
            agent,
            canisterId: tacoSnsGovernanceCanisterId()
        });

        // Create request for list_proposals
        const request = {
            include_reward_status: [], // Include all reward statuses
            before_proposal: beforeProposal ? [{ id: beforeProposal }] : [], // Pagination support
            limit: limit,
            exclude_type: [], // Don't exclude any types
            include_topics: [], // Include all topics
            include_status: [], // Include all statuses
        };

        // console.log('📞 Calling list_proposals with request:', request);
        const response = await governanceActor.list_proposals(request) as any;
        // console.log('📦 Raw response from list_proposals:', response);
        
        // Check if response has proposals directly (sometimes the structure is different)
        let proposals;
        if (response && response.proposals) {
            proposals = response.proposals;
            // console.log('✅ Found proposals directly in response');
        } else if (response && response.Ok && response.Ok.proposals) {
            proposals = response.Ok.proposals;
            // console.log('✅ Found proposals in response.Ok');
        } else if (Array.isArray(response)) {
            proposals = response;
            // console.log('✅ Response is array of proposals');
        } else {
            console.error('❌ Unexpected response structure:', response);
            throw new Error(`Unexpected response structure: ${JSON.stringify(response)}`);
        }
        
        // console.log('✅ Fetched', proposals.length, 'TACO DAO proposals');
        
        // Transform the raw proposal data into our TacoProposal format
        const transformedProposals: TacoProposal[] = proposals.map((proposalData: any) => {
            // Extract data from array-wrapped fields
            const proposal = proposalData.proposal && proposalData.proposal[0] ? proposalData.proposal[0] : null;
            const tally = proposalData.latest_tally && proposalData.latest_tally[0] ? proposalData.latest_tally[0] : null;
            const id = proposalData.id && proposalData.id[0] ? proposalData.id[0] : null;
            const proposer = proposalData.proposer && proposalData.proposer[0] ? proposalData.proposer[0] : null;
            const topic = proposalData.topic && proposalData.topic[0] ? proposalData.topic[0] : null;
            
            // Determine status based on timestamps
            let status: 'Open' | 'Adopted' | 'Rejected' | 'Failed' | 'Executed' = 'Open';
            if (proposalData.failed_timestamp_seconds > 0) {
                status = 'Failed';
            } else if (proposalData.executed_timestamp_seconds > 0) {
                status = 'Executed';
            } else if (proposalData.decided_timestamp_seconds > 0) {
                // Check if it was adopted or rejected based on voting
                if (tally && tally.yes > tally.no) {
                    status = 'Adopted';
                } else {
                    status = 'Rejected';
                }
            }
            
            return {
                id: id?.id || BigInt(0),
                title: proposal?.title || 'Untitled Proposal',
                summary: proposal?.summary || '',
                url: proposal?.url || '',
                status,
                createdAt: new Date(Number(proposalData.proposal_creation_timestamp_seconds) * 1000),
                decidedAt: proposalData.decided_timestamp_seconds > 0 
                    ? new Date(Number(proposalData.decided_timestamp_seconds) * 1000) 
                    : undefined,
                executedAt: proposalData.executed_timestamp_seconds > 0 
                    ? new Date(Number(proposalData.executed_timestamp_seconds) * 1000) 
                    : undefined,
                proposer: proposer ? uint8ArrayToHex(proposer.id) : undefined,
                yesVotes: tally?.yes || BigInt(0),
                noVotes: tally?.no || BigInt(0),
                totalVotes: tally?.total || BigInt(0),
                topic: topic || 'Untitled Proposal'
            };
        });
        
        // Sort by creation date (newest first)
        transformedProposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return {
            proposals: transformedProposals,
            hasMore: proposals.length === limit, // If we got exactly the limit, there might be more
            lastId: transformedProposals.length > 0 ? transformedProposals[transformedProposals.length - 1].id : null
        };
    }
    const fetchTacoProposals = async (limit: number = 20) => {
        try {
            proposalsLoading.value = true;
            
            const result = await fetchTacoProposalsInternal(null, limit);
            
            fetchedTacoProposals.value = result.proposals;
            proposalsHasMore.value = result.hasMore;
            proposalsLastId.value = result.lastId;
            
            // console.log('✅ Successfully loaded', result.proposals.length, 'proposals');
            return result.proposals;
        } catch (error: any) {
            console.error('❌ Error fetching TACO DAO proposals:', error);
            console.error('❌ Error details:', error.message, error.stack);
            throw error;
        } finally {
            proposalsLoading.value = false;
        }
    }
    const loadMoreTacoProposals = async (limit: number = 20) => {
        if (!proposalsHasMore.value || proposalsLoadingMore.value || !proposalsLastId.value) {
            return [];
        }

        try {
            proposalsLoadingMore.value = true;
            
            const result = await fetchTacoProposalsInternal(proposalsLastId.value, limit);
            
            // Append new proposals to existing ones
            fetchedTacoProposals.value = [...fetchedTacoProposals.value, ...result.proposals];
            proposalsHasMore.value = result.hasMore;
            proposalsLastId.value = result.lastId;
            
            // console.log('✅ Successfully loaded', result.proposals.length, 'more proposals');
            return result.proposals;
        } catch (error: any) {
            console.error('❌ Error loading more TACO DAO proposals:', error);
            throw error;
        } finally {
            proposalsLoadingMore.value = false;
        }
    }

    // naming system methods
    const appSneedDaoCanisterId = () => {
        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_APP_SNEEDDAO_BACKEND_IC || 'g7s5u-tqaaa-aaaad-qhktq-cai'; // Replace with actual IC canister ID
                break;
            case "staging":
                return process.env.CANISTER_ID_APP_SNEEDDAO_BACKEND_STAGING || 'g7s5u-tqaaa-aaaad-qhktq-cai'; // Replace with actual staging ID
                break;
        }        
        return 'g7s5u-tqaaa-aaaad-qhktq-cai'; // Replace with actual local/default ID
    }

    // uint8 array to hex
    const uint8ArrayToHex = (arr: Uint8Array | number[]): string => {
        return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // create neuron key
    const createNeuronKey = (snsRoot: Principal, neuronId: Uint8Array | number[]): string => {
        return `${snsRoot.toString()}:${uint8ArrayToHex(neuronId)}`;
    }

    // load all names
    const loadAllNames = async () => {
        // console.log('🔍 loadAllNames() called');
        
        if (namesLoading.value) {
            // console.log('⏳ Names already loading, skipping...');
            return; // Already loading
        }
        
        try {
            // console.log('🚀 Starting to load all names...');
            namesLoading.value = true;
            
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const canisterId = appSneedDaoCanisterId();
            // console.log('🔗 Connecting to app_sneeddao_backend canister:', canisterId);
            // console.log('🌐 DFX_NETWORK:', process.env.DFX_NETWORK);
            
            const appSneedDaoActor = Actor.createActor<AppSneedDaoService>(appSneedDaoIDL, {
                agent,
                canisterId: canisterId
            });

            // Load all principal names and neuron names in parallel
            // console.log('📞 Making API calls to get_all_principal_names() and get_all_neuron_names()...');
            const [principalNames, neuronNames] = await Promise.all([
                appSneedDaoActor.get_all_principal_names(),
                appSneedDaoActor.get_all_neuron_names()
            ]);
            // console.log('📦 Received data - principalNames:', principalNames.length, 'neuronNames:', neuronNames.length);

            // Clear and populate principal names cache
            namesCache.value.principals.clear();
            principalNames.forEach(([principal, [name, verified]]) => {
                namesCache.value.principals.set(principal.toString(), { name, verified });
            });

            // Clear and populate neuron names cache
            namesCache.value.neurons.clear();
            neuronNames.forEach(([neuronKey, [name, verified]]) => {
                const mapKey = createNeuronKey(neuronKey.sns_root_canister_id, neuronKey.neuron_id.id);
                namesCache.value.neurons.set(mapKey, { name, verified });
            });

            namesCache.value.lastLoaded = Date.now();
            
            // console.log(`✅ Loaded ${principalNames.length} principal names and ${neuronNames.length} neuron names`);
            
        } catch (error: any) {
            console.error('Error loading names:', error);
            // Don't throw - this is non-blocking
        } finally {
            namesLoading.value = false;
        }
    }

    // get principal name
    const getPrincipalDisplayName = (principal: Principal | string): string => {
        const principalStr = typeof principal === 'string' ? principal : principal.toString();
        const cachedName = namesCache.value.principals.get(principalStr);
        
        if (cachedName) {
            return cachedName.verified ? `✓ ${cachedName.name}` : cachedName.name;
        }
        
        // Fallback to truncated principal
        const cleaned = principalStr.replace(/-/g, '');
        return cleaned.length > 5 ? 
            '…' + cleaned.substring(cleaned.length - 5) :
            cleaned;
    }

    // get neuron name
    const getNeuronDisplayName = (snsRoot: Principal, neuronId: Uint8Array | number[]): string => {
        const mapKey = createNeuronKey(snsRoot, neuronId);
        const cachedName = namesCache.value.neurons.get(mapKey);
        
        if (cachedName) {
            return cachedName.verified ? `✓ ${cachedName.name}` : cachedName.name;
        }
        
        // return empty string if no match found
        return '';
    }

    // get principal name
    const setPrincipalName = async (name: string) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in to set names');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const appSneedDaoActor = Actor.createActor<AppSneedDaoService>(appSneedDaoIDL, {
                agent,
                canisterId: appSneedDaoCanisterId()
            });

            const result = await appSneedDaoActor.set_principal_name(name);
            
            if ('ok' in result) {
                // console.log('✅ Principal name set successfully:', result.ok);
                
                // Update cache immediately
                const userPrincipalStr = userPrincipal.value;
                namesCache.value.principals.set(userPrincipalStr, { name, verified: false });
                
                return result.ok;
            } else {
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error setting principal name:', error);
            throw error;
        }
    }

    // set neuron name
    const setNeuronName = async (snsRoot: Principal, neuronId: Uint8Array | number[], name: string) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in to set names');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const appSneedDaoActor = Actor.createActor<AppSneedDaoService>(appSneedDaoIDL, {
                agent,
                canisterId: appSneedDaoCanisterId()
            });

            // Convert number[] to Uint8Array if needed
            const neuronIdUint8 = neuronId instanceof Uint8Array ? neuronId : new Uint8Array(neuronId);
            
            const result = await appSneedDaoActor.set_neuron_name(snsRoot, { id: neuronIdUint8 }, name);
            
            if ('ok' in result) {
                // console.log('✅ Neuron name set successfully:', result.ok);
                
                // Update cache immediately
                const mapKey = createNeuronKey(snsRoot, neuronId);
                namesCache.value.neurons.set(mapKey, { name, verified: false });
                
                return result.ok;
            } else {
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error setting neuron name:', error);
            throw error;
        }
    }

    // get user neurons
    const getUserNeurons = async () => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const appSneedDaoActor = Actor.createActor<AppSneedDaoService>(appSneedDaoIDL, {
                agent,
                canisterId: appSneedDaoCanisterId()
            });

            const result = await appSneedDaoActor.get_user_neurons();
            
            if ('ok' in result) {
                return result.ok;
            } else {
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error getting user neurons:', error);
            throw error;
        }
    }

    // # RETURN #
    return {
        // state
        darkModeToggled,
        appLoading,
        userLoggedIn,
        userPrincipal,
        userLedgerAccountId,
        icpPriceUsd,
        btcPriceUsd,
        tacoPriceUsd,
        tacoPriceIcp,
        portfolioTokenPricesInUsd,
        portfolioTokenPricesInIcp,
        totalPortfolioValueInUsd,
        totalPortfolioValueInIcp,
        lastPriceUpdate,
        truncatedPrincipal,
        fetchedTokenDetails,
        fetchedAggregateAllocation,
        fetchedVotingPowerMetrics,
        fetchedUserAllocation,
        backendError,
        backendErrorIcon,
        backendErrorIconColor,
        backendErrorText,
        toasts,
        userAcceptedHotkeyTutorial,
        userAcceptedReportsDisclaimer,
        openChatSeenStoreValue,
        timerHealth,
        snapshotStatus,
        systemLogs,
        tradingLogs,
        rebalanceConfig,
        fetchedVoterDetails,
        fetchedNeuronAllocations,
        fetchedTradingStatus,
        totalTreasuryValueInUsd,
        snsTreasuryTacoValueInUsd,
        snsTreasuryIcpValueInUsd,
        tacoForumId,
        proposalsTopicId,
        fetchedForums,
        fetchedProposalsThreads,
        fetchedThreadPosts,
        fetchedTacoProposals,
        proposalsLoading,
        proposalsLoadingMore,
        proposalsHasMore,
        namesCache,
        namesLoading,
        threadMenuOpen,
        // actions
        changeRoute,
        toggleDarkMode,
        appLoadingOn,
        appLoadingOff,
        iidLogIn,
        iidLogOut,
        fetchCryptoPrices,
        checkIfLoggedIn,
        icrc1Metadata,
        fetchTokenDetails,
        fetchAggregateAllocation,
        fetchVotingPowerMetrics,
        fetchUserAllocation,
        refreshUserVotingPower,
        updateAllocation,
        followAllocation,
        unfollowAllocation,
        addToast,
        acceptHotkeyTutorial,
        removeToast,
        refreshTimerStatus,
        triggerManualSnapshot,
        restartSnapshotTimer,
        restartTreasurySyncs,
        recoverPoolBalances,
        triggerManualSync,
        fetchSystemLogs,
        startRebalancing,
        stopRebalancing,
        getSystemParameters,
        getRebalanceConfig,
        updateRebalanceConfig,
        executeTradingCycle,
        pauseToken,
        unpauseToken,
        fetchVoterDetails,
        fetchNeuronAllocations,
        adminGetUserAllocation,
        updateSystemParameter,
        updateSnapshotInterval,
        getTradingStatus,
        setOpenChatSeenStoreValue,
        getTreasuryLogs,
        getTreasuryLogsByContext,
        getTreasuryLogsByLevel,
        clearTreasuryLogs,
        icrc1BalanceOf,
        fetchTotalTreasuryValueInUsd,
        acceptReportsDisclaimer,
        listTriggerConditions,
        addTriggerCondition,
        setTriggerConditionActive,
        removeTriggerCondition,
        getPriceAlerts,
        clearPriceAlerts,
        listTradingPauses,
        getTradingPauseInfo,
        unpauseTokenFromTrading,
        pauseTokenFromTradingManual,
        clearAllTradingPauses,
        getTokenPriceHistory,
        getPortfolioHistory,
        getTreasuryPortfolioHistory,
        takeManualPortfolioSnapshot,
        listPortfolioCircuitBreakerConditions,
        addPortfolioCircuitBreakerCondition,
        setPortfolioCircuitBreakerConditionActive,
        removePortfolioCircuitBreakerCondition,
        getPortfolioCircuitBreakerLogs,
        clearPortfolioCircuitBreakerLogs,
        getNeuronSnapshotStatus,
        getNeuronSnapshotsInfo,
        getNeuronSnapshotInfo,
        getCumulativeValuesAtSnapshot,
        getNeuronDataForDAO,
        takeNeuronSnapshot,
        getMaxNeuronSnapshots,
        setMaxNeuronSnapshots,
        getMaxPriceHistoryEntries,
        getMaxPortfolioSnapshots,
        updateMaxPortfolioSnapshots,
        getAllForums,
        findTacoForum,
        getProposalsTopic,
        getProposalsTopicDirect,
        getThreadsByTopic,
        getPostsByThread,
        getProposalsThreads,
        getThread,
        getProposalThread,
        createProposalThread,
        createPost,
        voteOnPost,
        retractVote,
        getPostVotes,
        fetchTacoProposals,
        loadMoreTacoProposals,
        loadAllNames,
        getPrincipalDisplayName,
        getNeuronDisplayName,
        setPrincipalName,
        setNeuronName,
        getUserNeurons,
        toggleThreadMenu,
    }
})
