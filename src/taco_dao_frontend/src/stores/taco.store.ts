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
import { idlFactory as alarmIDL, _SERVICE as AlarmService } from "../../../declarations/alarm/alarm.did.js"
import { idlFactory as rewardsIDL } from "../../../declarations/rewards/rewards.did.js"
import { Principal } from '@dfinity/principal'
import { AccountIdentifier } from '@dfinity/ledger-icp'
import { SnsGovernanceCanister, SnsNeuronPermissionType } from '@dfinity/sns'
import { canisterId as iiCanisterId } from "../../../declarations/internet_identity/index.js"
import type { Result_1, UserState } from "../../../declarations/dao_backend/DAO_backend.did.d"
import { IDL } from '@dfinity/candid'

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
    lastRebalanceAttempt: bigint;
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
        longSync: {
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

// Alarm interfaces
export interface AlarmCanisterActor {

    // System Health
    performSystemHealthCheckManual(): Promise<{ ok: string } | { err: string }>
    getEnhancedAlarmSystemStatus(): Promise<{ ok: any } | { err: string }>
    getMonitoringStatus(): Promise<{ ok: any } | { err: string }>

    // Admin Management
    addAdmin(admin: Principal, permissions: Array<{ Admin: null }>): Promise<{ ok: string } | { err: string }>

    // Contact Management
    addContact(name: string, contactType: { Email: string } | { SMS: string }): Promise<{ ok: number } | { err: string }>
    getContacts(): Promise<{ ok: any[] } | { err: string }>
    updateContactStatus(contactId: number, active: boolean): Promise<{ ok: string } | { err: string }>
    removeContact(contactId: number): Promise<{ ok: number } | { err: string }>
    sendTestSMS(contactIds: number[]): Promise<{ ok: string } | { err: string }>
    sendTestEmail(contactIds: number[]): Promise<{ ok: string } | { err: string }>

    // Alarm Management
    getPendingAlarms(): Promise<{ ok: any[] } | { err: string }>
    acknowledgeAlarm(alarmId: number): Promise<{ ok: string } | { err: string }>
    getSystemErrors(limit: number[]): Promise<{ ok: any[] } | { err: string }>
    getInternalErrors(limit?: number): Promise<any[]>
    resolveSystemErrorById(errorId: number): Promise<{ ok: string } | { err: string }>

    // Monitoring Configuration
    setCheckInterval(minutes: number): Promise<{ ok: string } | { err: string }>
    startMonitoring(): Promise<{ ok: string } | { err: string }>
    stopMonitoring(): Promise<{ ok: string } | { err: string }>

    // Canister Monitoring
    addMonitoredCanister(
        canisterId: Principal,
        name: string,
        isSNSControlled: boolean,
        snsRootCanisterId: Principal[],
        minimumCycles: bigint,
        cyclesAlertLevel: { Level1Immediate: null } | { Level2DelayedSMS: null },
        timersAlertLevel: { Level1Immediate: null } | { Level2DelayedSMS: null },
        statusAlertLevel: { Level1Immediate: null } | { Level2DelayedSMS: null }
    ): Promise<{ ok: number } | { err: string }>

    getMonitoredCanisters(): Promise<{ ok: any[] } | { err: string }>
    removeMonitoredCanister(configId: number): Promise<{ ok: string } | { err: string }>
    updateMonitoredCanisterStatus(configId: number, enabled: boolean): Promise<{ ok: string } | { err: string }>
    startCanisterMonitoring(): Promise<{ ok: string } | { err: string }>
    stopCanisterMonitoring(): Promise<{ ok: string } | { err: string }>
    getCanisterHealthStatus(): Promise<{ ok: any[] } | { err: string }>

    // Queue Management
    getQueueStatus(): Promise<{ ok: any } | { err: string }>
    clearQueues(): Promise<{ ok: string } | { err: string }>

    // Sent Message History
    getSentMessages(limit: number[]): Promise<{ ok: any[] } | { err: string }>
    getSentSMSMessages(limit: number[]): Promise<{ ok: any[] } | { err: string }>
    getSentEmailMessages(limit: number[]): Promise<{ ok: any[] } | { err: string }>

    // Configuration Functions
    setCanisterMonitoringInterval(minutes: number): Promise<{ ok: string } | { err: string }>
    setLevel2SMSCheckInterval(minutes: number): Promise<{ ok: string } | { err: string }>
    getConfigurationIntervals(): Promise<{ ok: any } | { err: string }>

    // Admin Action Logs
    getAdminActionLogs(limit: number[]): Promise<{ ok: any[] } | { err: string }>

}

///////////////////
// GNSF Registry //
///////////////////

export interface GNSFunctionInfo {
    functionId: bigint
    displayName: string
    description: string
    parameterTypes: any[]  // IDL types
    requiresReason: boolean
    additionalParams?: {  // Additional parameters beyond reason
        name: string
        type: any  // IDL type
        displayName?: string  // For UI display
    }[]
}

// Registry of admin functions that can be called via GNSF proposals
// Function IDs start at 4000
export const GNSF_REGISTRY: Record<string, GNSFunctionInfo> = {
    'stopRebalancing': {
        functionId: BigInt(3003),
        displayName: 'Stop Trading Bot',
        description: 'Stops the automated trading and rebalancing system',
        parameterTypes: [IDL.Opt(IDL.Text)],
        requiresReason: true
    },
    'startRebalancing': {
        functionId: BigInt(3004),
        displayName: 'Start Trading Bot',
        description: 'Starts the automated trading and rebalancing system',
        parameterTypes: [IDL.Opt(IDL.Text)],
        requiresReason: true
    },
    'executeTradingCycle': {
        functionId: BigInt(3005),
        displayName: 'Execute Trading Cycle',
        description: 'Manually executes one trading cycle immediately',
        parameterTypes: [IDL.Opt(IDL.Text)],
        requiresReason: true
    },
    'takeManualPortfolioSnapshot': {
        functionId: BigInt(3006),
        displayName: 'Take Portfolio Snapshot',
        description: 'Manually captures the current state of all portfolio positions',
        parameterTypes: [IDL.Opt(IDL.Text)],
        requiresReason: true
    },
    'pauseToken': {
        functionId: BigInt(3007),
        displayName: 'Pause Token',
        description: 'Pauses a token from being traded by the treasury',
        parameterTypes: [IDL.Principal, IDL.Text],
        requiresReason: true,
        additionalParams: [{
            name: 'tokenPrincipal',
            type: IDL.Principal,
            displayName: 'Token'
        }]
    },
    'unpauseToken': {
        functionId: BigInt(3008),
        displayName: 'Unpause Token',
        description: 'Resumes trading for a previously paused token',
        parameterTypes: [IDL.Principal, IDL.Text],
        requiresReason: true,
        additionalParams: [{
            name: 'tokenPrincipal',
            type: IDL.Principal,
            displayName: 'Token'
        }]
    },
    'updateRebalanceConfig': {
        functionId: BigInt(3009),
        displayName: 'Update Rebalance Configuration',
        description: 'Updates trading bot configuration parameters',
        parameterTypes: [
            IDL.Record({
                longSyncIntervalNS: IDL.Opt(IDL.Nat),
                maxKongswapAttempts: IDL.Opt(IDL.Nat),
                maxPriceHistoryEntries: IDL.Opt(IDL.Nat),
                maxSlippageBasisPoints: IDL.Opt(IDL.Nat),
                maxTradeAttemptsPerInterval: IDL.Opt(IDL.Nat),
                maxTradeValueICP: IDL.Opt(IDL.Nat),
                maxTradesStored: IDL.Opt(IDL.Nat),
                minTradeValueICP: IDL.Opt(IDL.Nat),
                portfolioRebalancePeriodNS: IDL.Opt(IDL.Nat),
                priceUpdateIntervalNS: IDL.Opt(IDL.Nat),
                rebalanceIntervalNS: IDL.Opt(IDL.Nat),
                shortSyncIntervalNS: IDL.Opt(IDL.Nat),
                tokenSyncTimeoutNS: IDL.Opt(IDL.Nat)
            }),
            IDL.Opt(IDL.Bool),
            IDL.Opt(IDL.Text)
        ],
        requiresReason: true,
        additionalParams: [{
            name: 'updateConfig',
            type: IDL.Record({
                longSyncIntervalNS: IDL.Opt(IDL.Nat),
                maxKongswapAttempts: IDL.Opt(IDL.Nat),
                maxPriceHistoryEntries: IDL.Opt(IDL.Nat),
                maxSlippageBasisPoints: IDL.Opt(IDL.Nat),
                maxTradeAttemptsPerInterval: IDL.Opt(IDL.Nat),
                maxTradeValueICP: IDL.Opt(IDL.Nat),
                maxTradesStored: IDL.Opt(IDL.Nat),
                minTradeValueICP: IDL.Opt(IDL.Nat),
                portfolioRebalancePeriodNS: IDL.Opt(IDL.Nat),
                priceUpdateIntervalNS: IDL.Opt(IDL.Nat),
                rebalanceIntervalNS: IDL.Opt(IDL.Nat),
                shortSyncIntervalNS: IDL.Opt(IDL.Nat),
                tokenSyncTimeoutNS: IDL.Opt(IDL.Nat)
            }),
            displayName: 'Configuration Updates'
        }, {
            name: 'rebalanceStateNew',
            type: IDL.Opt(IDL.Bool),
            displayName: 'Rebalance State'
        }]
    },
    'updateMaxPortfolioSnapshots': {
        functionId: BigInt(3010),
        displayName: 'Update Max Portfolio Snapshots',
        description: 'Updates the maximum number of portfolio snapshots to store',
        parameterTypes: [IDL.Nat, IDL.Opt(IDL.Text)],
        requiresReason: true,
        additionalParams: [{
            name: 'newLimit',
            type: IDL.Nat,
            displayName: 'New Limit'
        }]
    },
    'updateSystemParameter': {
        functionId: BigInt(3011),
        displayName: 'Update System Parameter',
        description: 'Updates a single DAO system parameter',
        parameterTypes: [
            IDL.Variant({
                'AllocationWindow': IDL.Nat,
                'FollowDepth': IDL.Nat,
                'LogAdmin': IDL.Principal,
                'MaxAllocationsPerDay': IDL.Int,
                'MaxFollowUnfollowActionsPerDay': IDL.Nat,
                'MaxFollowed': IDL.Nat,
                'MaxFollowers': IDL.Nat,
                'MaxPastAllocations': IDL.Nat,
                'MaxTotalUpdates': IDL.Nat,
                'SnapshotInterval': IDL.Nat
            }),
            IDL.Opt(IDL.Text)
        ],
        requiresReason: true,
        additionalParams: [{
            name: 'systemParameter',
            type: IDL.Variant({
                'AllocationWindow': IDL.Nat,
                'FollowDepth': IDL.Nat,
                'LogAdmin': IDL.Principal,
                'MaxAllocationsPerDay': IDL.Int,
                'MaxFollowUnfollowActionsPerDay': IDL.Nat,
                'MaxFollowed': IDL.Nat,
                'MaxFollowers': IDL.Nat,
                'MaxPastAllocations': IDL.Nat,
                'MaxTotalUpdates': IDL.Nat,
                'SnapshotInterval': IDL.Nat
            }),
            displayName: 'Parameter'
        }]
    },
    'startPortfolioSnapshots': {
        functionId: BigInt(3012),
        displayName: 'Start Portfolio Snapshots',
        description: 'Starts automatic portfolio snapshot collection',
        parameterTypes: [IDL.Opt(IDL.Text)],
        requiresReason: true
    },
    'stopPortfolioSnapshots': {
        functionId: BigInt(3013),
        displayName: 'Stop Portfolio Snapshots',
        description: 'Stops automatic portfolio snapshot collection',
        parameterTypes: [IDL.Opt(IDL.Text)],
        requiresReason: true
    },
    'updatePortfolioSnapshotInterval': {
        functionId: BigInt(3014),
        displayName: 'Update Portfolio Snapshot Interval',
        description: 'Updates the interval between automatic portfolio snapshots',
        parameterTypes: [IDL.Nat, IDL.Opt(IDL.Text)],
        requiresReason: true,
        additionalParams: [{
            name: 'intervalMinutes',
            type: IDL.Nat,
            displayName: 'Interval (minutes)'
        }]
    },
    'takeNeuronSnapshot': {
        functionId: BigInt(3015),
        displayName: 'Take Neuron Snapshot',
        description: 'Manually captures a snapshot of all neuron voting power data',
        parameterTypes: [],
        requiresReason: false  // No parameters - the neuron snapshot function takes no args
    }
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
    // const tacoWizardOpen = ref(false)
    const tacoWizardOpen = ref(false)

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
    const dkpPriceUsd = useStorage('dkpPriceUsd', 0)
    const lastPriceUpdate = useStorage('lastPriceUpdate', 0)

    // dao
    const fetchedTokenDetails = ref<TrustedTokenEntry[]>([])
    const fetchedTokenDetailsWithPastPrices = ref<TrustedTokenEntry[]>([])
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
    const snsTreasuryDkpValueInUsd = ref(0)
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
            longSync: {
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

    // alarm
    let alarmActor: AlarmCanisterActor | null = null

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
            root.style.setProperty("--orange-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--orange-to-brown", "#934a17") // brown
            root.style.setProperty("--orange-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--orange-to-light-brown", "#c16d33") // light brown
            root.style.setProperty("--light-brown-to-white", "#ffffff") // white
            root.style.setProperty("--light-brown-to-yellow", "#FEC800") // yellow
            root.style.setProperty("--light-brown-to-orange", "#FED66C") // orange
            root.style.setProperty("--light-brown-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--light-brown-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--dark-brown-to-light-orange", "#feeac1") // light orange
            root.style.setProperty("--dark-brown-to-orange", "#FED66C") // orange
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
            root.style.setProperty("--green-to-success-green", "#B7CD02") // green
            root.style.setProperty("--dark-green-to-light-green", "#B4C2E9") // light green
            root.style.setProperty("--success-green-to-success-green-hover", "#19B229") // success green hover
            root.style.setProperty("--success-green-hover-to-success-green", "#179F25") // success green
            root.style.setProperty("--success-green-hover-to-light-green", "#7CDC86") // light green
            root.style.setProperty("--dark-green-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--blue-to-light-blue", "#B4C2E9") // light blue
            root.style.setProperty("--brown-to-white", "#ffffff") // white
            root.style.setProperty("--brown-to-orange", "#FED66C") // orange
            root.style.setProperty("--brown-to-dark-orange", "#DA8D28") // dark orange
            root.style.setProperty("--brown-to-dark-brown", "#512100") // dark brown
            root.style.setProperty("--brown-to-green", "#934a17") // brown
            root.style.setProperty("--dark-brown-to-white", "#ffffff") // white
            root.style.setProperty("--dark-brown-to-brown", "#934A17") // brown
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
            root.style.setProperty("--orange-to-dark-orange", "#FED66C") // orange
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
            root.style.setProperty("--dark-brown-to-orange", "#512100") // dark brown
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
            root.style.setProperty("--green-to-success-green", "#19B229") // success green
            root.style.setProperty("--blue-to-light-blue", "#546595") // blue
            root.style.setProperty("--brown-to-white", "#934a17") // brown
            root.style.setProperty("--brown-to-orange", "#934a17") // brown
            root.style.setProperty("--brown-to-dark-orange", "#934a17") // brown
            root.style.setProperty("--brown-to-dark-brown", "#934A17") // brown
            root.style.setProperty("--brown-to-green", "#B7CD02") // green
            root.style.setProperty("--dark-brown-to-white", "#512100") // dark brown
            root.style.setProperty("--dark-brown-to-brown", "#512100") // dark brown
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
    const toggleTacoWizard = () => {
        tacoWizardOpen.value = !tacoWizardOpen.value
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
                            : `http://${iiCanisterId}.localhost:4943/`,
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

            // Load names cache in background (non-blocking)
            // console.log('🔍 Triggering loadAllNames() from iidLogIn - after successful login');
            loadAllNames().catch(console.error)

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

            // clear cached auth client instance to force fresh instance on next login
            authClientInstance = null

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
    const nachosCanisterId = () => {

        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_NACHOS_IC || 'rctxc-zqaaa-aaaan-qz6na-cai';
                break;
            case "staging":
                return  process.env.CANISTER_ID_NACHOS_STAGING || 'rctxc-zqaaa-aaaan-qz6na-caitptia-syaaa-aaaai-atieq-cai';
                break;
        }        
        return 'rctxc-zqaaa-aaaan-qz6na-cai'; // local canisterId
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
    const rewardsCanisterId = () => {

        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_REWARDS_IC || 'dkgdg-saaaa-aaaan-qz5ma-cai';
                break;
            case "staging":
                return  process.env.CANISTER_ID_REWARDS_STAGING || 'cjkka-gyaaa-aaaan-qz5kq-cai';
                break;
        }        
        return 'cjkka-gyaaa-aaaan-qz5kq-cai'; // local canisterId
    }
    const portfolioArchiveCanisterId = () => {
        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_IC || 'bl7x7-wiaaa-aaaan-qz5bq-cai';
            case "staging":
                return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_STAGING || 'lrekt-uaaaa-aaaan-qz4ya-cai';
        }        
        return 'lrekt-uaaaa-aaaan-qz4ya-cai'; // local canisterId
    }
    const alarmCanisterId = () => {
        switch (process.env.DFX_NETWORK) {
            case "ic":
                return process.env.CANISTER_ID_ALARM_IC || 'b2cwp-6qaaa-aaaad-qhn6a-cai'
            case "staging":
                return process.env.CANISTER_ID_ALARM_STAGING || 'b2cwp-6qaaa-aaaad-qhn6a-cai'
        }        
        return 'b2cwp-6qaaa-aaaad-qhn6a-cai' // if not ic or staging, use local (all the same for now)
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

            // try coingecko standard endpoint for icp, btc, and dkp
            try {

                // log
                // console.log('taco.store: fetching new crypto prices - coingecko standard endpoint')

                // fetch
                const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=internet-computer,bitcoin,draggin-karma-points')
                
                // if not ok, throw error
                if (!response.ok) throw new Error(`HTTP ${response.status}`)

                // parse response
                const data = await response.json()
                
                // log
                // console.log('taco.store: fetchCryptoPrices() - coingecko standard endpoint data:', data)

                // Find the specific coins in the array
                const icpData = data.find((coin: { id: string }) => coin.id === 'internet-computer')
                const btcData = data.find((coin: { id: string }) => coin.id === 'bitcoin')
                const dkpData = data.find((coin: { id: string }) => coin.id === 'draggin-karma-points')

                // Set the prices
                icpPriceUsd.value = icpData?.current_price || 0
                btcPriceUsd.value = btcData?.current_price || 0
                dkpPriceUsd.value = dkpData?.current_price || 0

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

        // if total treasury value in usd is already set, return
        if (totalTreasuryValueInUsd.value > 0) {
            return true
        }

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

        /////////////////////////////////////
        // fetch total DKP in the treasury //
        /////////////////////////////////////

        // log
        // console.log('taco.store: fetchTotalTreasuryValueInUsd() - fetching total DKP in the treasury')

        // call icp ledger balance for sns treasury icp balance
        const snsTreasuryDkpBalance = await icrc1BalanceOf(
            'zfcdd-tqaaa-aaaaq-aaaga-cai', // ICP ledger canister ID
            Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai'),
            // hexToUint8Array('df86d44b4cf253518395a3213fbb6b256a27e60fb590c1b27211be9011709fdc')
        )

        // log
        // console.log('treasury dkp balance:', snsTreasuryDkpBalance)

        /////////////////
        // format data //
        /////////////////

        // convert balances to numbers
        const tacoBalance = snsTreasuryTacoBalance ? Number(snsTreasuryTacoBalance) : 0
        const icpBalance = snsTreasuryIcpBalance ? Number(snsTreasuryIcpBalance) : 0
        const dkpBalance = snsTreasuryDkpBalance ? Number(snsTreasuryDkpBalance) : 0

        // convert to proper units (ICP has 8 decimals, TACO has 8 decimals)
        const tacoBalanceNormalized = tacoBalance / Math.pow(10, 8)
        const icpBalanceNormalized = icpBalance / Math.pow(10, 8)
        const dkpBalanceNormalized = dkpBalance / Math.pow(10, 8)

        // convert to USD using current prices
        const tacoValueUsd = tacoBalanceNormalized * tacoPriceUsd.value

        // log
        // console.log('taco value in usd: %c$' + tacoValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // convert to USD using current prices
        const icpValueUsd = icpBalanceNormalized * icpPriceUsd.value

        // log
        // console.log('icp value in usd: %c$' + icpValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // convert to USD using current prices
        const dkpValueUsd = dkpBalanceNormalized * dkpPriceUsd.value

        // log
        // console.log('dkp value in usd: %c$' + dkpValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // calculate total treasury value in usd
        const totalValue = tacoValueUsd + icpValueUsd + dkpValueUsd

        // log total value
        // console.log('total treasury value: %c$' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'color: green; font-weight: bold;')

        // set sns treasury taco value in usd
        snsTreasuryTacoValueInUsd.value = tacoValueUsd

        // set sns treasury icp value in usd
        snsTreasuryIcpValueInUsd.value = icpValueUsd

        // set sns treasury dkp value in usd
        snsTreasuryDkpValueInUsd.value = dkpValueUsd

        // set total treasury value in usd
        totalTreasuryValueInUsd.value = totalValue

        // return
        return

    }

    // dao backend
    const fetchTokenDetails = async () => {

        // turn on loading
        appLoadingOn()

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
            const tokenDetails = await actor.getTokenDetailsWithoutPastPrices()

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

        } finally {

            // turn off loading
            appLoadingOff()

        }

    }
    const fetchTokenDetailsWithPastPrices = async () => {

        // turn on loading
        appLoadingOn()

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
            fetchedTokenDetailsWithPastPrices.value = tokenDetails

            // return
            return            

        } catch (error) {

            // log error
            console.error('error fetching token details from dao backend:', error)

            // return
            return false

        } finally {

            // turn off loading
            appLoadingOff()

        }

    }    
    // ready flag
    const hasTokenDetails = computed(() => fetchedTokenDetails.value.length > 0)
    // single-flight
    let inflightTokenDetails: Promise<void> | null = null
    const ensureTokenDetails = async () => {
        if (hasTokenDetails.value) return
        if (inflightTokenDetails) return inflightTokenDetails
        inflightTokenDetails = (async () => {
            try { await fetchTokenDetails() } finally { inflightTokenDetails = null }
        })()
        return inflightTokenDetails
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
                    
                    // // show error toast
                    // addToast({
                    //     id: Date.now(),
                    //     code: 'voting-power-error',
                    //     title: 'Voting Power Refresh Failed',
                    //     icon: 'fa-solid fa-exclamation-triangle',
                    //     message: `${errorMsg}`
                    // })
                    
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

            // // show error toast
            // addToast({
            //     id: Date.now(),
            //     code: 'voting-power-error',
            //     title: 'Voting Power Refresh Failed',
            //     icon: 'fa-solid fa-exclamation-triangle',
            //     message: `${error}`
            // })

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

            // Get treasury status, long sync timer, and token details in parallel
            const [tradingStatusResult, longSyncTimerResult, tokenDetailsResult] = await Promise.all([
                treasuryActor.getTradingStatus() as Promise<TradingStatusResult>,
                (treasuryActor as any).getLongSyncTimerStatus?.() as Promise<any> || Promise.resolve(null),
                daoActor.getTokenDetails() as Promise<TrustedTokenEntry[]>
            ]);
            //console.log('refreshTimerStatus: Received trading status:', tradingStatusResult);
            //console.log('refreshTimerStatus: Received long sync timer:', longSyncTimerResult);
            //console.log('refreshTimerStatus: Received token details:', tokenDetailsResult);

            // Update token details
            fetchedTokenDetails.value = tokenDetailsResult;

            if ('ok' in tradingStatusResult && tradingStatusResult.ok) {
                const { metrics, executedTrades, rebalanceStatus } = tradingStatusResult.ok;
                
                // Extract long sync info from timer status
                let longSyncActive = false;
                let longSyncLastRun = null;
                if (longSyncTimerResult) {
                    const timerStatus = longSyncTimerResult;
                    longSyncActive = timerStatus.isRunning || false;
                    longSyncLastRun = timerStatus.lastRunTime ? BigInt(timerStatus.lastRunTime) : null;
                }
                
                timerHealth.value.treasury = {
                    shortSync: {
                        active: true,
                        lastSync: BigInt(metrics.lastUpdate)
                    },
                    longSync: {
                        active: longSyncActive,
                        lastSync: longSyncLastRun
                    },
                    rebalanceStatus: 'Idle' in rebalanceStatus ? 'Idle' 
                        : 'Trading' in rebalanceStatus ? 'Trading'
                        : 'Failed',
                    rebalanceError: 'Failed' in rebalanceStatus ? rebalanceStatus.Failed : undefined,
                    tradingMetrics: {
                        lastRebalanceAttempt: BigInt(metrics.lastRebalanceAttempt),
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
    const startRebalancing = async (reason?: string) => {
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

            const result = await actor.startRebalancing(reason ? [reason] : []) as RebalanceResult;
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
    const stopRebalancing = async (reason?: string) => {
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

            const result = await actor.stopRebalancing(reason ? [reason] : []) as RebalanceResult;
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
    const updateRebalanceConfig = async (updates: UpdateConfig, reason?: string) => {
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

            const result = await treasury.updateRebalanceConfig(updates, [], reason ? [reason] : []);
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

            // Use anonymous identity for public query (no authentication required)
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";

            // Create an agent with anonymous identity
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create treasury actor
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

            // Use anonymous identity for public query (no authentication required)
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";

            // Create an agent with anonymous identity
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
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
    const executeTradingCycle = async (reason?: string) => {
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

            await treasury.admin_executeTradingCycle(reason ? [reason] : []);
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

            const result = await actor.pauseToken(principal, reason) as Result_1;
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

            const result = await actor.unpauseToken(principal, reason) as Result_1;
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
    const updateSystemParameter = async (param: any, reason?: string): Promise<boolean> => {
        // console.log('TacoStore: updateSystemParameter called with', param, reason);
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


            // Create DAO backend actor with authenticated identity
            const backend = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId
            });

            const result = await backend.updateSystemParameter(param, reason ? [reason] : []) as SystemParameterResult;
            
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
    const updateSnapshotInterval = async (intervalNS: bigint, reason?: string): Promise<boolean> => {
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

            const result = await backend.updateSystemParameter({ SnapshotInterval: intervalNS }, reason ? [reason] : []) as SystemParameterResult;
            
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
    const unpauseTokenFromTrading = async (token: Principal, reason?: string) => {
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

            return await treasury.unpauseTokenFromTrading(token, reason ? [reason] : []);
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
    const clearAllTradingPauses = async (reason?: string) => {
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

            return await treasury.clearAllTradingPauses(reason ? [reason] : []);
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
    const takeManualPortfolioSnapshot = async (reason?: string) => {
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

            const result = await treasury.takeManualPortfolioSnapshot(reason ? [reason] : []);
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

    // Portfolio snapshot status and management
    const getPortfolioSnapshotStatus = async () => {
        try {
            const host = process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app";
            const agent = await createAgent({
                identity: new AnonymousIdentity(),
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const treasury = Actor.createActor<TreasuryService>(treasuryIDL, {
                agent,
                canisterId: treasuryCanisterId()
            });

            const status = await treasury.getPortfolioSnapshotStatus();
            return {
                status: status.status,
                intervalMinutes: Number(status.intervalMinutes),
                lastSnapshotTime: Number(status.lastSnapshotTime)
            };
        } catch (error: any) {
            console.error('Error getting portfolio snapshot status:', error);
            return {
                status: { Stopped: null },
                intervalMinutes: 60,
                lastSnapshotTime: 0
            };
        }
    }

    const startPortfolioSnapshots = async (reason?: string) => {
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

            const result = await treasury.startPortfolioSnapshots(reason ? [reason] : []);
            if ('ok' in result) {
                return true;
            } else {
                console.error('Error starting portfolio snapshots:', result.err);
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error starting portfolio snapshots:', error);
            throw error;
        }
    }

    const stopPortfolioSnapshots = async (reason?: string) => {
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

            const result = await treasury.stopPortfolioSnapshots(reason ? [reason] : []);
            if ('ok' in result) {
                return true;
            } else {
                console.error('Error stopping portfolio snapshots:', result.err);
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error stopping portfolio snapshots:', error);
            throw error;
        }
    }

    const updatePortfolioSnapshotInterval = async (intervalMinutes: number, reason?: string) => {
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

            const result = await treasury.updatePortfolioSnapshotInterval(BigInt(intervalMinutes), reason ? [reason] : []);
            if ('ok' in result) {
                return true;
            } else {
                console.error('Error updating portfolio snapshot interval:', result.err);
                throw new Error(result.err);
            }
        } catch (error: any) {
            console.error('Error updating portfolio snapshot interval:', error);
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
    const updateMaxPortfolioSnapshots = async (newLimit: number, reason?: string) => {
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

            const result = await (treasury as any).updateMaxPortfolioSnapshots(BigInt(newLimit), reason ? [reason] : []);
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

    // TACO Neuron methods for staking
    const getTacoNeurons = async () => {
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

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            const neuronsResult = await snsGov.list_neurons({
                of_principal: [Principal.fromText(userPrincipal.value)],
                limit: 1000,
                start_page_at: []
            }) as any;

            return neuronsResult.neurons || [];
        } catch (error: any) {
            console.error('Error getting TACO neurons:', error);
            throw error;
        }
    }

    const createSnsGovernanceActor = async (agent: any, canisterId: string) => {
        // Import the full SNS governance IDL that includes permissions
        const { idlFactory } = await import('../../../declarations/sns_governance');
        
        return Actor.createActor(idlFactory, {
            agent,
            canisterId
        });
    }

    // Determine neuron relationship to user
    const getNeuronRelationship = (neuron: any, userPrincipalStr: string) => {
        const userPrincipal = Principal.fromText(userPrincipalStr);
        
        let isOwner = false;
        let isHotkey = false;
        
        // Check permissions for the user's principal
        if (neuron.permissions && Array.isArray(neuron.permissions)) {
            for (const permission of neuron.permissions) {
                if (permission.principal && permission.principal.length > 0) {
                    const permissionPrincipal = permission.principal[0];
                    
                    // Check if this permission is for the current user
                    if (permissionPrincipal.toText() === userPrincipal.toText()) {
                        const permissionTypes = permission.permission_type || [];
                        
                        // Check for owner permissions (typically includes permission type 1)
                        // Owner usually has multiple permissions including 1 (configure), 2 (disburse), 3 (vote), 4 (submit proposal)
                        if (permissionTypes.includes(1) || permissionTypes.includes(2)) {
                            isOwner = true;
                        }
                        
                        // Check for hotkey permissions [4, 3] or [3, 4] (vote and submit proposal)
                        const hasVote = permissionTypes.includes(3);
                        const hasSubmitProposal = permissionTypes.includes(4);
                        if (hasVote && hasSubmitProposal && !isOwner) {
                            isHotkey = true;
                        }
                    }
                }
            }
        }
        
        return { isOwner, isHotkey };
    }

    // Helper function to format dissolve state
    const formatDissolveState = (dissolveState: any) => {
        if (!dissolveState || dissolveState.length === 0) {
            return { type: 'none', display: 'Not dissolving', seconds: 0 };
        }
        
        const state = dissolveState[0];
        if (state.DissolveDelaySeconds !== undefined) {
            const seconds = Number(state.DissolveDelaySeconds);
            const days = Math.floor(seconds / (24 * 60 * 60));
            const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
            const minutes = Math.floor((seconds % (60 * 60)) / 60);
            
            let display = '';
            if (days > 0) display += `${days}d `;
            if (hours > 0) display += `${hours}h `;
            if (minutes > 0) display += `${minutes}m`;
            if (!display) display = `${seconds}s`;
            
            return { type: 'delay', display: display.trim(), seconds };
        }
        
        if (state.WhenDissolvedTimestampSeconds !== undefined) {
            const timestamp = Number(state.WhenDissolvedTimestampSeconds) * 1000; // Convert to milliseconds
            const dissolveDate = new Date(timestamp);
            const now = new Date();
            
            if (dissolveDate <= now) {
                return { type: 'dissolved', display: 'Dissolved', seconds: 0 };
            } else {
                const remainingMs = dissolveDate.getTime() - now.getTime();
                const remainingSeconds = Math.floor(remainingMs / 1000);
                const days = Math.floor(remainingSeconds / (24 * 60 * 60));
                const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
                
                let display = '';
                if (days > 0) display += `${days}d `;
                if (hours > 0) display += `${hours}h`;
                
                return { type: 'dissolving', display: `Dissolving in ${display.trim()}`, seconds: remainingSeconds };
            }
        }
        
        return { type: 'unknown', display: 'Unknown', seconds: 0 };
    };

    // Helper function to calculate neuron age
    const calculateNeuronAge = (createdTimestamp: number, agingSinceTimestamp: number) => {
        const now = Math.floor(Date.now() / 1000)
        const aging = Number(agingSinceTimestamp)
        // prefer creation age for display; fallback to aging_since only if creation is missing/invalid
        const base = (Number.isFinite(createdTimestamp) && createdTimestamp > 0 && createdTimestamp <= now)
            ? createdTimestamp
            : (Number.isFinite(aging) && aging > 0 && aging <= now ? aging : now)
        const ageSeconds = Math.max(0, now - base)
        const days = Math.floor(ageSeconds / (24 * 60 * 60))
        const hours = Math.floor((ageSeconds % (24 * 60 * 60)) / (60 * 60))
        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h`
        return '< 1h'
    }

    // Format neuron for display with relationship info and detailed stats
    const formatNeuronForDisplay = (neuron: any) => {
        const neuronId = neuron.id && neuron.id.length > 0 ? neuron.id[0].id : null;
        const neuronIdHex = neuronId ? Array.from(neuronId as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('') : 'Unknown';
        const relationship = getNeuronRelationship(neuron, userPrincipal.value);
        
        // Parse dissolve state
        const dissolveInfo = formatDissolveState(neuron.dissolve_state);
        
        // Calculate age
        const createdRaw = neuron.created_timestamp_seconds
        const agingRaw = neuron.aging_since_timestamp_seconds
        const createdTimestamp = Array.isArray(createdRaw) ? Number((createdRaw[0] ?? 0n)) : Number(createdRaw ?? 0)
        const agingSinceTimestamp = Array.isArray(agingRaw) ? Number((agingRaw[0] ?? BigInt(createdTimestamp))) : Number(agingRaw ?? createdTimestamp)
        const ageDisplay = calculateNeuronAge(createdTimestamp, agingSinceTimestamp)
        
        // Parse other stats
        const stakedMaturity = Number(neuron.staked_maturity_e8s_equivalent || 0);
        const neuronFees = Number(neuron.neuron_fees_e8s || 0);
        const autoStakeMaturity = neuron.auto_stake_maturity && neuron.auto_stake_maturity.length > 0 ? neuron.auto_stake_maturity[0] : false;
        
        // Parse permissions
        const permissions = (neuron.permissions || []).map((permission: any) => {
            const principal = permission.principal && permission.principal.length > 0 ? permission.principal[0] : null;
            const permissionTypes = permission.permission_type || [];
            
            // Map permission types to readable names
            const permissionNames = permissionTypes.map((type: number) => {
                switch (type) {
                    case 1: return 'Configure';
                    case 2: return 'Disburse';
                    case 3: return 'Vote';
                    case 4: return 'Submit Proposal';
                    case 5: return 'Split';
                    case 6: return 'Merge Maturity';
                    case 7: return 'Disburse Maturity';
                    case 8: return 'Stake Maturity';
                    case 9: return 'Manage Voting Permission';
                    default: return `Unknown (${type})`;
                }
            });
            
            return {
                principal: principal ? principal.toText() : 'Unknown',
                principalShort: principal ? `${principal.toText().substring(0, 8)}...${principal.toText().slice(-6)}` : 'Unknown',
                permissionTypes,
                permissionNames,
                isCurrentUser: principal ? principal.toText() === userPrincipal.value : false
            };
        });
        
        // Parse followings - handle both legacy followees and new topic_followees
        const followings: any[] = [];
        
        // Parse followings for neuron
        
        // Legacy followees structure (function_id based)
        if (neuron.followees && neuron.followees.length > 0) {
            neuron.followees.forEach((followee: any) => {
            const functionId = followee[0]; // The function ID (governance function)
            const followeeList = followee[1]?.followees || [];
            
                // Map function IDs to topic names
                const getTopicFromFunctionId = (id: number) => {
                switch (id) {
                        case 0: return 'AllFunctions';
                    case 1: return 'Motion';
                    case 2: return 'ManageNervousSystemParameters';
                    case 3: return 'UpgradeRootToVersion';
                    case 4: return 'ExecuteGenericNervousSystemFunction';
                    case 5: return 'ManageDappCanisterSettings';
                    case 6: return 'TransferSnsTreasuryFunds';
                    case 7: return 'RegisterDappCanisters';
                    case 8: return 'DeregisterDappCanisters';
                        default: return `Function${id}`;
                }
            };
            
            const followedNeurons = followeeList.map((followedNeuron: any) => {
                const neuronId = followedNeuron.id;
                const neuronIdHex = neuronId ? Array.from(neuronId as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('') : 'Unknown';
                return {
                    id: neuronId,
                    idHex: neuronIdHex,
                        idShort: neuronIdHex !== 'Unknown' ? `${neuronIdHex.substring(0, 8)}...` : 'Unknown',
                        alias: null
                };
            });
            
                followings.push({
                    topicId: getTopicFromFunctionId(functionId),
                functionId,
                    functionName: getTopicFromFunctionId(functionId),
                followedNeurons,
                followedCount: followedNeurons.length
                });
            });
        }
        
        // New topic_followees structure (topic based)
        if (neuron.topic_followees && neuron.topic_followees.length > 0) {
            const topicFolloweesWrapper = neuron.topic_followees[0];
            if (topicFolloweesWrapper && topicFolloweesWrapper.topic_id_to_followees) {
                const topicFollowees = topicFolloweesWrapper.topic_id_to_followees;
                
                topicFollowees.forEach((topicEntry: any) => {
                    const topicId = topicEntry[0]; // Topic ID (int32)
                    const followeesForTopic = topicEntry[1]; // FolloweesForTopic

                    // Prefer the canonical topic variant from canister response, fall back to id mapping
                    const getTopicName = (f: any, id: number) => {
                        try {
                            if (f?.topic && Array.isArray(f.topic) && f.topic.length > 0) {
                                const variant = f.topic[0];
                                const keys = Object.keys(variant);
                                if (keys.length === 1) return keys[0];
                            }
                        } catch (_) {}
                        // Fallback mapping aligned to DID order
                        const topicMap: Record<number, string> = {
                            0: 'DaoCommunitySettings',
                            1: 'SnsFrameworkManagement',
                            2: 'DappCanisterManagement',
                            3: 'ApplicationBusinessLogic',
                            4: 'Governance',
                            5: 'TreasuryAssetManagement',
                            6: 'CriticalDappOperations'
                        };
                        return topicMap[id] || `Topic${id}`;
                    };

                    const followedNeurons = (followeesForTopic.followees || []).map((followee: any) => {
                        const neuronId = followee.neuron_id && followee.neuron_id.length > 0 ? followee.neuron_id[0].id : null;
                        const neuronIdHex = neuronId ? Array.from(neuronId as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('') : 'Unknown';
                        return {
                            id: neuronId,
                            idHex: neuronIdHex,
                            idShort: neuronIdHex !== 'Unknown' ? `${neuronIdHex.substring(0, 8)}...` : 'Unknown',
                            alias: followee.alias && followee.alias.length > 0 ? followee.alias[0] : null
                        };
                    });
                    
                    const topicName = getTopicName(followeesForTopic, topicId);
                    
                    followings.push({
                        topicId: topicName,
                        functionId: topicId,
                        functionName: topicName,
                        followedNeurons,
                        followedCount: followedNeurons.length
                    });
                });
            }
        }
        
        // Get custom name from cache if available
        const tacoSnsRoot = Principal.fromText('lacdn-3iaaa-aaaaq-aae3a-cai'); // TACO SNS Root (not governance)
        const customName = neuronId ? getNeuronDisplayName(tacoSnsRoot, neuronId) : '';
        

        
        const displayName = customName || `Neuron ${neuronIdHex.substring(0, 8)}...`

        const neuronData = {
            id: neuronId,
            idHex: neuronIdHex,
            stake: neuron.cached_neuron_stake_e8s,
            maturity: neuron.maturity_e8s_equivalent,
            stakedMaturity,
            neuronFees,
            votingPowerMultiplier: neuron.voting_power_percentage_multiplier,
            displayName: displayName,
            isOwner: relationship.isOwner,
            isHotkey: relationship.isHotkey,
            relationship: relationship.isOwner ? 'owned' : relationship.isHotkey ? 'hotkeyed' : 'unknown',
            
            // Detailed stats for expanded view
            dissolveState: dissolveInfo,
            age: ageDisplay,
            ageSeconds: (() => {
                const now = Math.floor(Date.now() / 1000)
                const aging = Number(agingSinceTimestamp)
                const base = (Number.isFinite(createdTimestamp) && createdTimestamp > 0 && createdTimestamp <= now)
                    ? createdTimestamp
                    : (Number.isFinite(aging) && aging > 0 && aging <= now ? aging : now)
                return Math.max(0, now - base)
            })(),
            createdDate: new Date(createdTimestamp * 1000),
            autoStakeMaturity,
            followeesCount: neuron.followees ? neuron.followees.length : 0,
            permissionsCount: neuron.permissions ? neuron.permissions.length : 0,
            
            // Detailed permissions and followings
            permissions,
            followings
        };
        
        // Final followings parsed successfully
        
        return neuronData;
    }

    // Categorize neurons into owned and hotkeyed
    const categorizeNeurons = (neurons: any[]) => {
        const formatted = neurons.map(neuron => formatNeuronForDisplay(neuron));
        
        return {
            owned: formatted.filter(neuron => neuron.isOwner),
            hotkeyed: formatted.filter(neuron => neuron.isHotkey && !neuron.isOwner),
            all: formatted
        };
    }

    // Create rewards actor
    const createRewardsActor = async () => {
        const canisterId = rewardsCanisterId()
        if (!canisterId) {
            throw new Error('Rewards canister ID not found')
        }

        const authClient = await AuthClient.create({
            idleOptions: { disableIdle: true }
        })
        const identity = await authClient.getIdentity()
        const host = process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app'

        const agent = await createAgent({
            identity,
            host,
            fetchRootKey: process.env.DFX_NETWORK === 'local',
        })

        return Actor.createActor(rewardsIDL, {
            agent,
            canisterId
        })
    }

    // Format neuron ID for map key
    const formatNeuronIdForMap = (neuronId: Uint8Array): string => {
        try {
            return Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join('')
        } catch (error) {
            return 'unknown'
        }
    }

    // Load neuron reward balances
    const loadNeuronRewardBalances = async (neurons: any[]): Promise<Map<string, number>> => {
        if (!userLoggedIn.value || neurons.length === 0) {
            return new Map()
        }

        try {
            const rewardsActor = await createRewardsActor()
            
            // Extract neuron IDs (Uint8Array format) for the API call with proper validation
            const neuronIdBlobs: Uint8Array[] = []
            
            neurons.forEach(neuron => {
                // Handle different neuron formats
                let neuronIdBlob = null
                
                // Check if it's a categorized neuron (has id as Uint8Array directly)
                if (neuron && neuron.id && neuron.id instanceof Uint8Array) {
                    neuronIdBlob = neuron.id
                }
                // Check if it's a raw neuron (has id as array with objects)
                else if (neuron && neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                    const neuronIdObj = neuron.id[0]
                    if (neuronIdObj && neuronIdObj.id) {
                        neuronIdBlob = neuronIdObj.id
                    }
                }
                
                if (!neuronIdBlob) {
                    console.warn('Invalid neuron structure - no valid ID found:', neuron)
                    return
                }
                
                // Ensure it's a valid Uint8Array
                if (!(neuronIdBlob instanceof Uint8Array) && !Array.isArray(neuronIdBlob)) {
                    console.warn('Invalid neuron ID format (not Uint8Array or Array):', neuronIdBlob)
                    return
                }
                
                // Convert to Uint8Array if it's a regular array
                const validBlob = neuronIdBlob instanceof Uint8Array ? neuronIdBlob : new Uint8Array(neuronIdBlob)
                
                if (validBlob.length === 0) {
                    console.warn('Empty neuron ID blob')
                    return
                }
                
                neuronIdBlobs.push(validBlob)
            })

            if (neuronIdBlobs.length === 0) {
                console.warn('No valid neuron IDs found after filtering')
                return new Map()
            }

            // console.log(`Requesting balances for ${neuronIdBlobs.length} neurons`)

            // Use getNeuronRewardBalances instead of getAllNeuronRewardBalances (admin-only)
            const balances = await rewardsActor.getNeuronRewardBalances(neuronIdBlobs) as [Uint8Array, bigint][]
            
            // Convert to map using hex IDs as keys
            const neuronBalances = new Map<string, number>()
            for (const [neuronId, balance] of balances) {
                const neuronIdHex = formatNeuronIdForMap(neuronId)
                neuronBalances.set(neuronIdHex, Number(balance))
            }

            // console.log(`Successfully loaded ${neuronBalances.size} neuron balances`)
            return neuronBalances

        } catch (error) {
            console.error('Error loading neuron balances:', error)
            return new Map()
        }
    }

    // Claim rewards for specific neurons
    const claimNeuronRewards = async (neuronIds: Uint8Array[]): Promise<boolean> => {
        if (!userLoggedIn.value || !userPrincipal.value) {
            throw new Error('User must be logged in')
        }

        try {
            const rewardsActor = await createRewardsActor()
            
            // Build ICRC1 Account object using user's principal
            const account = {
                owner: Principal.fromText(userPrincipal.value),
                subaccount: [] // Empty subaccount
            }
            
            // Call withdraw with account and neuron IDs
            const result = await rewardsActor.withdraw(account, neuronIds) as any
            
            if ('Ok' in result) {
                const transactionId = result.Ok
                addToast({
                    id: Date.now(),
                    code: 'rewards-claimed',
                    title: 'Rewards Claimed!',
                    icon: 'fa-solid fa-check',
                    message: `Successfully claimed rewards!`
                })
                return true
            } else {
                // Handle ICRC1 transfer errors
                const error = result.Err
                let errorMessage = 'Failed to claim rewards'
                
                if ('InsufficientFunds' in error) {
                    errorMessage = `Insufficient funds: Balance is ${error.InsufficientFunds.balance}`
                } else if ('BadFee' in error) {
                    errorMessage = `Bad fee: Expected ${error.BadFee.expected_fee}`
                } else if ('GenericError' in error) {
                    errorMessage = `Error ${error.GenericError.error_code}: ${error.GenericError.message}`
                } else {
                    errorMessage = `Claim failed: ${JSON.stringify(error)}`
                }
                
                addToast({
                    id: Date.now() + 1,
                    code: 'rewards-claim-failed',
                    title: 'Claim Failed',
                    icon: 'fa-solid fa-exclamation-triangle',
                    message: errorMessage
                })
                return false
            }
        } catch (error: any) {
            console.error('Error claiming rewards:', error)
            addToast({
                id: Date.now() + 2,
                code: 'rewards-claim-error',
                title: 'Claim Error',
                icon: 'fa-solid fa-exclamation-triangle',
                message: 'Failed to claim rewards: ' + error.message
            })
            return false
        }
    }

    // Claim all available rewards
    const claimAllNeuronRewards = async (neurons: any[]): Promise<boolean> => {
        if (!userLoggedIn.value || neurons.length === 0) {
            return false
        }

        try {
            // Get all neuron IDs that have rewards
            const neuronBalances = await loadNeuronRewardBalances(neurons)
            const claimableNeuronIds: Uint8Array[] = []

            for (const neuron of neurons) {
                // Handle both raw and categorized neuron formats
                let neuronIdBlob = null
                let neuronIdHex = null
                
                if (neuron.id instanceof Uint8Array) {
                    // Categorized neuron format
                    neuronIdBlob = neuron.id
                    neuronIdHex = neuron.idHex || formatNeuronIdForMap(neuron.id)
                } else if (neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                    // Raw neuron format
                    neuronIdBlob = neuron.id[0].id
                    neuronIdHex = formatNeuronIdForMap(neuron.id[0].id)
                }
                
                if (neuronIdBlob && neuronIdHex) {
                    const balance = neuronBalances.get(neuronIdHex) || 0
                    if (balance > 0) {
                        claimableNeuronIds.push(neuronIdBlob)
                    }
                }
            }

            if (claimableNeuronIds.length === 0) {
                addToast({
                    id: Date.now(),
                    code: 'no-rewards',
                    title: 'No Rewards',
                    icon: 'fa-solid fa-info-circle',
                    message: 'No rewards available to claim'
                })
                return false
            }

            return await claimNeuronRewards(claimableNeuronIds)

        } catch (error: any) {
            console.error('Error claiming all rewards:', error)
            addToast({
                id: Date.now() + 1,
                code: 'claim-all-error',
                title: 'Claim Error',
                icon: 'fa-solid fa-exclamation-triangle',
                message: 'Failed to claim all rewards: ' + error.message
            })
            return false
        }
    }

    // Set dissolve timestamp for a neuron (dissolve period setting)
    const setDissolveTimestamp = async (neuronId: Uint8Array, dissolveTimestampSeconds: bigint) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Setting dissolve timestamp for neuron:', {
            //     neuronId: Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''),
            //     dissolveTimestamp: dissolveTimestampSeconds.toString(),
            //     dissolveDate: new Date(Number(dissolveTimestampSeconds) * 1000)
            // });

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the manage neuron request for SetDissolveTimestamp
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    Configure: {
                        operation: [{
                            SetDissolveTimestamp: {
                                dissolve_timestamp_seconds: dissolveTimestampSeconds
                            }
                        }]
                    }
                }]
            };

            // console.log('SetDissolveTimestamp request:', JSON.stringify(manageNeuronRequest, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() : value, 2));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('SetDissolveTimestamp result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`SetDissolveTimestamp failed: ${JSON.stringify(command)}`);
                }
                if (command.Configure) {
                    // console.log('Dissolve timestamp set successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error setting dissolve timestamp:', error);
            throw error;
        }
    }

    // start dissolving for a neuron
    const startDissolving = async (neuronId: Uint8Array) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Starting dissolving for neuron:', Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''));

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the manage neuron request for StartDissolving
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    Configure: {
                        operation: [{
                            StartDissolving: {}
                        }]
                    }
                }]
            };

            // console.log('StartDissolving request:', JSON.stringify(manageNeuronRequest));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('StartDissolving result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`StartDissolving failed: ${JSON.stringify(command)}`);
                }
                if (command.Configure) {
                    // console.log('Dissolving started successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error starting dissolving:', error);
            throw error;
        }
    }

    // Stop dissolving for a neuron
    const stopDissolving = async (neuronId: Uint8Array) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Stopping dissolving for neuron:', Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''));

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the manage neuron request for StopDissolving
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    Configure: {
                        operation: [{
                            StopDissolving: {}
                        }]
                    }
                }]
            };

            // console.log('StopDissolving request:', JSON.stringify(manageNeuronRequest));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('StopDissolving result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`StopDissolving failed: ${JSON.stringify(command)}`);
                }
                if (command.Configure) {
                    // console.log('Dissolving stopped successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error stopping dissolving:', error);
            throw error;
        }
    }

    // Disburse neuron funds
    const disburseNeuron = async (neuronId: Uint8Array) => {

        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // turn app loading on
            appLoadingOn()

            if (!(neuronId instanceof Uint8Array) || neuronId.length === 0) {
                throw new Error('invalid neuron id: Uint8Array required')
            }

            // console.log('Disbursing neuron:', Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''));

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the disburse command
            const disburseCommand: any = {};
            // always disburse to the current user's primary account
            const owner = [Principal.fromText(userPrincipal.value)]
            disburseCommand.to_account = [{ owner, subaccount: [] }]

            // Prepare the manage neuron request for Disburse
            const manageNeuronRequest = {
                // candid blob prefers Uint8Array
                subaccount: neuronId,
                command: [{
                    Disburse: {
                        to_account: disburseCommand.to_account,
                        amount: []
                    }
                }]
            };

            // console.log('Disburse request:', JSON.stringify(manageNeuronRequest, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() : value, 2));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('Disburse result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`Disburse failed: ${JSON.stringify(command)}`);
                }
                if (command.Disburse) {
                    // console.log('Neuron disbursed successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error disbursing neuron:', error);
            throw error;
        } finally {

            // turn app loading off
            appLoadingOff()

        }
        
    }

    // Add neuron permissions
    const addNeuronPermissions = async (neuronId: Uint8Array, principalId: string, permissionTypes: number[]) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Adding neuron permissions:', {
            //     neuronId: Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''),
            //     principalId,
            //     permissionTypes
            // });

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the manage neuron request for AddNeuronPermissions
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    AddNeuronPermissions: {
                        principal_id: [Principal.fromText(principalId)],
                        permissions_to_add: [{
                            permissions: permissionTypes
                        }]
                    }
                }]
            };

            // console.log('AddNeuronPermissions request:', JSON.stringify(manageNeuronRequest, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() : value, 2));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('AddNeuronPermissions result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`AddNeuronPermissions failed: ${JSON.stringify(command)}`);
                }
                if (command.AddNeuronPermission !== undefined) {
                    // console.log('Neuron permissions added successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error adding neuron permissions:', error);
            throw error;
        }
    }

    // Remove neuron permissions
    const removeNeuronPermissions = async (neuronId: Uint8Array, principalId: string, permissionTypes: number[]) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Removing neuron permissions:', {
            //     neuronId: Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''),
            //     principalId,
            //     permissionTypes
            // });

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the manage neuron request for RemoveNeuronPermissions
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    RemoveNeuronPermissions: {
                        principal_id: [Principal.fromText(principalId)],
                        permissions_to_remove: [{
                            permissions: permissionTypes
                        }]
                    }
                }]
            };

            // console.log('RemoveNeuronPermissions request:', JSON.stringify(manageNeuronRequest, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() : value, 2));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('RemoveNeuronPermissions result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`RemoveNeuronPermissions failed: ${JSON.stringify(command)}`);
                }
                if (command.RemoveNeuronPermission !== undefined) {
                    // console.log('Neuron permissions removed successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error removing neuron permissions:', error);
            throw error;
        }
    }

    // Get grantable permissions from nervous system parameters
    const getGrantablePermissions = async (): Promise<number[]> => {
        try {
            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Get nervous system parameters
            const params = await snsGov.get_nervous_system_parameters(null) as any;
            
            // console.log('SNS Nervous System Parameters:', params);
            
            if (params.neuron_grantable_permissions && params.neuron_grantable_permissions.length > 0) {
                const grantablePermissions = params.neuron_grantable_permissions[0];
                console.log('Grantable permissions from SNS:', grantablePermissions.permissions);
                return grantablePermissions.permissions || [];
            }
            
            // console.log('No grantable permissions specified in SNS parameters, using defaults');
            
            // Default permissions if not specified - use all available SNS types
            return [
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_CONFIGURE_DISSOLVE_STATE,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_PRINCIPALS,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SUBMIT_PROPOSAL,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_VOTE,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SPLIT,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MERGE_MATURITY,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE_MATURITY,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_STAKE_MATURITY,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_VOTING_PERMISSION
            ];
        } catch (error: any) {
            console.error('Error getting grantable permissions:', error);
            // Return default permissions on error - use all available SNS types
            return [
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_CONFIGURE_DISSOLVE_STATE,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_PRINCIPALS,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SUBMIT_PROPOSAL,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_VOTE,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SPLIT,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MERGE_MATURITY,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE_MATURITY,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_STAKE_MATURITY,
                SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_VOTING_PERMISSION
            ];
        }
    }

    // Add neuron followee for a specific topic
    const addNeuronFollowee = async (neuronId: Uint8Array, topicId: string, followeeNeuronId: Uint8Array) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Adding neuron followee:', {
            //     neuronId: Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''),
            //     topicId,
            //     followeeNeuronId: Array.from(followeeNeuronId).map(b => b.toString(16).padStart(2, '0')).join('')
            // });

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Prepare the manage neuron request for SetFollowing
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    SetFollowing: {
                        topic_following: [{
                            topic: [{ [topicId]: null }],
                            followees: [{
                                neuron_id: [{ id: Array.from(followeeNeuronId) }],
                                alias: []
                            }]
                        }]
                    }
                }]
            };

            // console.log('SetFollowing request:', JSON.stringify(manageNeuronRequest, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() : value, 2));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('SetFollowing result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`SetFollowing failed: ${JSON.stringify(command)}`);
                }
                if (command.SetFollowing !== undefined) {
                    // console.log('Neuron followee added successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error adding neuron followee:', error);
            throw error;
        }
    }

    // Remove neuron followee for a specific topic
    const removeNeuronFollowee = async (neuronId: Uint8Array, topicId: string, followeeNeuronId: Uint8Array) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Removing neuron followee:', {
            //     neuronId: Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join(''),
            //     topicId,
            //     followeeNeuronId: Array.from(followeeNeuronId).map(b => b.toString(16).padStart(2, '0')).join('')
            // });

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Get current neuron data to find existing followees for this topic
            const currentNeuronData = await getSingleNeuron(neuronId);
            
            // Find current followees for this topic
            let currentFollowees: any[] = [];
            if (currentNeuronData.topic_followees && currentNeuronData.topic_followees.length > 0) {
                const topicFollowees = currentNeuronData.topic_followees[0]?.topic_id_to_followees || [];
                
                // Map topic names to IDs (reverse of the display mapping)
                const getTopicIdFromName = (name: string): number => {
                    // Reverse mapping aligned to sns_governance.did Topic order
                    const topicMap: Record<string, number> = {
                        'DaoCommunitySettings': 0,
                        'SnsFrameworkManagement': 1,
                        'DappCanisterManagement': 2,
                        'ApplicationBusinessLogic': 3,
                        'Governance': 4,
                        'TreasuryAssetManagement': 5,
                        'CriticalDappOperations': 6
                    };
                    return topicMap[name] ?? -1;
                };
                
                const targetTopicId = getTopicIdFromName(topicId);
                const topicEntry = topicFollowees.find((entry: any) => entry[0] === targetTopicId);
                
                if (topicEntry && topicEntry[1]?.followees) {
                    currentFollowees = topicEntry[1].followees;
                }
            }
            
            // Filter out the followee we want to remove
            const followeeIdHex = Array.from(followeeNeuronId).map((b: number) => b.toString(16).padStart(2, '0')).join('');
            const updatedFollowees = currentFollowees.filter((followee: any) => {
                if (!followee.neuron_id || followee.neuron_id.length === 0) return true;
                const existingIdHex = Array.from(followee.neuron_id[0].id as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
                return existingIdHex !== followeeIdHex;
            });
            
            // console.log(`Removing followee ${followeeIdHex} from topic ${topicId}. Current: ${currentFollowees.length}, After: ${updatedFollowees.length}`);
            
            const manageNeuronRequest = {
                subaccount: Array.from(neuronId),
                command: [{
                    SetFollowing: {
                        topic_following: [{
                            topic: [{ [topicId]: null }],
                            followees: updatedFollowees
                        }]
                    }
                }]
            };

            // console.log('RemoveFollowing request:', JSON.stringify(manageNeuronRequest, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() : value, 2));

            const result = await snsGov.manage_neuron(manageNeuronRequest) as any;
            // console.log('RemoveFollowing result:', result);

            if (result.command && result.command.length > 0) {
                const command = result.command[0];
                if (command.Error) {
                    throw new Error(`RemoveFollowing failed: ${JSON.stringify(command)}`);
                }
                if (command.SetFollowing !== undefined) {
                    // console.log('Neuron followee removed successfully');
                    return true;
                }
            }

            throw new Error('Unexpected response format from manage_neuron');
        } catch (error: any) {
            console.error('Error removing neuron followee:', error);
            throw error;
        }
    }

    // Get a single neuron's fresh data from SNS governance
    const getSingleNeuron = async (neuronId: Uint8Array) => {
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

            // Create SNS Governance actor
            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            const result = await snsGov.get_neuron({ 
                neuron_id: [{ id: Array.from(neuronId) }] 
            }) as any;

            // Unwrap SNS variant shape: { result: [{ Ok: {...} }]} or { result: [{ Err: {...} }] }
            let neuronRaw: any | null = null;
            if (result?.result && Array.isArray(result.result) && result.result.length > 0) {
                const inner = result.result[0];
                if (inner?.Ok) {
                    neuronRaw = inner.Ok;
                } else if (inner?.Neuron) { // Some SDKs may return { Neuron: {...} }
                    neuronRaw = inner.Neuron;
                } else if (inner && !inner.Err) {
                    // Already the neuron object
                    neuronRaw = inner;
                } else if (inner?.Err) {
                    throw new Error(`get_neuron error: ${JSON.stringify(inner.Err)}`);
                }
            }

            if (!neuronRaw) {
                throw new Error('Neuron not found');
            }

            const neuron = neuronRaw;

            // Normalize fields for formatNeuronForDisplay
            // Ensure id is in array form
            if (neuron.id && !Array.isArray(neuron.id)) {
                neuron.id = [neuron.id];
            }

            // Ensure topic_followees matches list_neurons shape
            // Some responses may return topic_followees directly (not wrapped); wrap if needed
            if (neuron.topic_followees && !Array.isArray(neuron.topic_followees)) {
                neuron.topic_followees = [neuron.topic_followees];
            }

            // Ensure nested topic_id_to_followees is an array
            if (neuron.topic_followees && neuron.topic_followees.length > 0) {
                const wrapper = neuron.topic_followees[0];
                if (wrapper && wrapper.topic_id_to_followees && !Array.isArray(wrapper.topic_id_to_followees)) {
                    wrapper.topic_id_to_followees = Array.from(wrapper.topic_id_to_followees);
                }
            }

            // console.log('Normalized neuron data for formatting:', neuron);
            return neuron;
        } catch (error: any) {
            console.error('Error getting single neuron:', error);
            throw error;
        }
    }

    // Set dissolve period for a neuron (high-level function)
    const setNeuronDissolveDelay = async (neuronId: Uint8Array, delayMonths: number) => {
        try {
            // 1) Read DAO parameters to respect the minimum dissolve delay
            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
            
            // Get nervous system parameters
            const params = await snsGov.get_nervous_system_parameters(null) as any;
            const minToVoteSeconds = params.neuron_minimum_dissolve_delay_to_vote_seconds && 
                                   params.neuron_minimum_dissolve_delay_to_vote_seconds.length > 0 ? 
                                   params.neuron_minimum_dissolve_delay_to_vote_seconds[0] : 0n;

            // console.log('Minimum dissolve delay to vote:', minToVoteSeconds.toString(), 'seconds');

            // 2) Calculate target dissolve delay
            const desiredSeconds = BigInt(delayMonths * 30 * 24 * 60 * 60); // approx months→seconds
            const targetDelay = desiredSeconds > minToVoteSeconds ? desiredSeconds : minToVoteSeconds;
            
            // console.log('Target dissolve delay:', targetDelay.toString(), 'seconds');

            // 3) Set dissolve timestamp = now + targetDelay
            const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
            const dissolveTimestamp = nowSeconds + targetDelay;

            await setDissolveTimestamp(neuronId, dissolveTimestamp);

            // Note: No need to call stopDissolving - setting a future dissolve timestamp
            // automatically puts the neuron in a locked state that accrues age bonuses

            return {
                targetDelaySeconds: targetDelay,
                dissolveTimestamp,
                delayMonths
            };
        } catch (error: any) {
            console.error('Error setting neuron dissolve delay:', error);
            throw error;
        }
    }

    // Generate neuron subaccount using the correct SNS formula
    // SHA256(0x0c, "neuron-stake", principal-bytes, nonce-u64-be)
    const generateNeuronSubaccount = async (controller: Principal, nonce: bigint): Promise<Uint8Array> => {
        // u64 → big-endian 8 bytes using DataView (more reliable)
        const u64be = (value: bigint): Uint8Array => {
            const buffer = new ArrayBuffer(8);
            new DataView(buffer).setBigUint64(0, value);
            return new Uint8Array(buffer);
        };

        // Build the data to hash
        const chunks = [
            Uint8Array.from([0x0c]),                                    // len("neuron-stake")
            new TextEncoder().encode("neuron-stake"),                   // "neuron-stake"
            controller.toUint8Array(),                                  // controller principal bytes
            u64be(nonce),                                               // nonce as u64 big-endian
        ];
        
        // Concatenate all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const data = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            data.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Hash with SHA-256
        const digest = await crypto.subtle.digest("SHA-256", data);
        return new Uint8Array(digest);
    }

    // Find next available subaccount for neuron creation
    const findFreeSubaccount = async (): Promise<{ subaccount: Uint8Array, index: number }> => {
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

        // Use the existing SNS governance IDL
        const { idlFactory } = await import('../../../declarations/sns_governance');
        
        const governanceActor = Actor.createActor(idlFactory, {
            agent,
            canisterId: 'lhdfz-wqaaa-aaaaq-aae3q-cai'
        });

        // Try nonces starting from 0
        for (let nonce = 0n; nonce < 1000n; nonce++) {  // Reasonable upper limit
            const controllerPrincipal = Principal.fromText(userPrincipal.value);
            const subaccount = await generateNeuronSubaccount(controllerPrincipal, nonce);
            
            try {
                // Try to get neuron with this subaccount
                const getNeuronRequest = {
                    neuron_id: [{
                        id: Array.from(subaccount)
                    }]
                };
                
                const result = await governanceActor.get_neuron(getNeuronRequest) as any;
                
                // If result.result is empty/null, this subaccount is free
                if (!result.result || result.result.length === 0) {
                    return { subaccount, index: Number(nonce) };
                }
                
                // If we get an error or the neuron doesn't exist, this subaccount is free
                if (result.result[0] && 'Error' in result.result[0]) {
                    return { subaccount, index: Number(nonce) };
                }
                
            } catch (error) {
                // If there's an error calling get_neuron, assume this subaccount is free
                // console.log(`Nonce ${nonce} appears to be free (error calling get_neuron):`, error);
                return { subaccount, index: Number(nonce) };
            }
        }
        
        throw new Error('Could not find a free subaccount for neuron creation');
    }

    // Create a new neuron
    const createNeuron = async (amount: bigint) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            // console.log('Finding free subaccount for new neuron...');
            const { subaccount, index } = await findFreeSubaccount();
            const nonce = BigInt(index);
            
            const tacoTokenPrincipal = 'kknbx-zyaaa-aaaaq-aae4a-cai'; // TACO token canister
            const snsGovernancePrincipal = 'lhdfz-wqaaa-aaaaq-aae3q-cai'; // TACO SNS Governance

            // Step 1: Transfer TACO tokens to SNS Governance with the new subaccount and memo
            // console.log(`Transferring TACO tokens to new neuron subaccount (nonce: ${nonce})...`);
            // console.log(`Subaccount (hex): ${Array.from(subaccount).map(b => b.toString(16).padStart(2, '0')).join('')}`);
            // console.log(`Controller principal: ${userPrincipal.value}`);
            
            const transferResult = await transferToNeuronSubaccount(tacoTokenPrincipal, snsGovernancePrincipal, subaccount, amount, nonce);
            // console.log(`Transfer completed with block index: ${transferResult}`);

            // Step 2: Wait a moment for the transfer to be processed
            // console.log('Waiting for transfer to be processed...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

            // Step 3: Claim/refresh the neuron to create it
            // console.log('Claiming new neuron...');
            await claimOrRefreshNeuron(subaccount, nonce);

            // console.log('Neuron created successfully!');
            return { subaccount, success: true };
        } catch (error: any) {
            console.error('Error creating neuron:', error);
            throw error;
        }
    }

    // Stake TACO tokens to a neuron
    const stakeToNeuron = async (neuronId: Uint8Array, amount: bigint) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            const tacoTokenPrincipal = 'kknbx-zyaaa-aaaaq-aae4a-cai'; // TACO token canister
            const snsGovernancePrincipal = 'lhdfz-wqaaa-aaaaq-aae3q-cai'; // TACO SNS Governance

            // Step 1: Transfer TACO tokens to SNS Governance with neuron ID as subaccount
            // console.log('Transferring TACO tokens to neuron subaccount...');
            await transferToNeuronSubaccount(tacoTokenPrincipal, snsGovernancePrincipal, neuronId, amount);

            // Step 2: Claim/refresh the neuron to recognize the new stake
            // console.log('Claiming/refreshing neuron...');
            await claimOrRefreshNeuron(neuronId);

            // console.log('Staking completed successfully!');
            return true;
        } catch (error: any) {
            console.error('Error staking to neuron:', error);
            throw error;
        }
    }

    // Transfer tokens to neuron subaccount
    const transferToNeuronSubaccount = async (
        tokenPrincipal: string,
        governancePrincipal: string,
        neuronId: Uint8Array,
        amount: bigint,
        memo?: bigint  // Optional memo for neuron creation traceability
    ) => {
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        
        const agent = await createAgent({
            identity,
            host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
            fetchRootKey: process.env.DFX_NETWORK === "local",
        });

        // Create ICRC1 actor for TACO token
        const icrc1IDL = ({ IDL }: any) => {
            return IDL.Service({
                'icrc1_transfer': IDL.Func(
                    [IDL.Record({
                        'to': IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) }),
                        'fee': IDL.Opt(IDL.Nat),
                        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
                        'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
                        'created_at_time': IDL.Opt(IDL.Nat64),
                        'amount': IDL.Nat
                    })],
                    [IDL.Variant({
                        'Ok': IDL.Nat,
                        'Err': IDL.Record({
                            'InsufficientFunds': IDL.Record({ 'balance': IDL.Nat }),
                            'BadFee': IDL.Record({ 'expected_fee': IDL.Nat }),
                            'TemporarilyUnavailable': IDL.Null,
                            'GenericError': IDL.Record({ 'message': IDL.Text, 'error_code': IDL.Nat }),
                            'TooOld': IDL.Null,
                            'CreatedInFuture': IDL.Record({ 'ledger_time': IDL.Nat64 }),
                            'Duplicate': IDL.Record({ 'duplicate_of': IDL.Nat }),
                            'BadBurn': IDL.Record({ 'min_burn_amount': IDL.Nat })
                        })
                    })]
                )
            });
        };

        const tokenActor = Actor.createActor(icrc1IDL, {
            agent,
            canisterId: tokenPrincipal
        });

        // Convert neuronId to proper subaccount (32 bytes)
        const subaccount = new Uint8Array(32);
        subaccount.set(neuronId, 0);

        // Convert memo to bytes if provided
        const memoBytes = memo ? (() => {
            const buffer = new ArrayBuffer(8);
            new DataView(buffer).setBigUint64(0, memo);
            return Array.from(new Uint8Array(buffer));
        })() : [];

        const transferArgs = {
            to: {
                owner: Principal.fromText(governancePrincipal),
                subaccount: [Array.from(subaccount)]
            },
            fee: [],
            memo: memo ? [memoBytes] : [],
            from_subaccount: [],
            created_at_time: [],
            amount: amount
        };

        const result = await tokenActor.icrc1_transfer(transferArgs) as any;

        if ('Ok' in result) {
            return result.Ok;
        } else {
            throw new Error(`Transfer failed: ${JSON.stringify(result.Err)}`);
        }
    }

    // Claim or refresh neuron after staking
    const claimOrRefreshNeuron = async (neuronId: Uint8Array, memo?: bigint) => {
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        
        const agent = await createAgent({
            identity,
            host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
            fetchRootKey: process.env.DFX_NETWORK === "local",
        });

        // Use the existing SNS governance IDL
        const { idlFactory } = await import('../../../declarations/sns_governance');
        
        const governanceActor = Actor.createActor(idlFactory, {
            agent,
            canisterId: 'lhdfz-wqaaa-aaaaq-aae3q-cai'
        });

        // Convert neuronId to proper subaccount (32 bytes)
        const subaccount = new Uint8Array(32);
        subaccount.set(neuronId, 0);

        // Debug logging
        // console.log(`ClaimOrRefresh request details:`);
        // console.log(`- Subaccount: ${Array.from(subaccount).map(b => b.toString(16).padStart(2, '0')).join('')}`);
        // console.log(`- Memo: ${memo}`);
        // console.log(`- Controller: ${userPrincipal.value}`);

        // For neuron creation, we need to use MemoAndController variant
        const manageNeuronRequest = memo !== undefined ? {
            subaccount: Array.from(subaccount),
            command: [{
                ClaimOrRefresh: {
                    by: [{
                        MemoAndController: {
                            controller: [Principal.fromText(userPrincipal.value)],
                            memo: Number(memo)  // Convert BigInt to Number for IDL
                        }
                    }]
                }
            }]
        } : {
            // For existing neurons, use NeuronId variant
            subaccount: Array.from(subaccount),
            command: [{
                ClaimOrRefresh: {
                    by: [{
                        NeuronId: {}
                    }]
                }
            }]
        };

        // Convert BigInt to string for logging
        const requestForLogging = JSON.parse(JSON.stringify(manageNeuronRequest, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        // console.log('ManageNeuron request:', JSON.stringify(requestForLogging, null, 2));

        const result = await governanceActor.manage_neuron(manageNeuronRequest) as any;
        
        if (result.command && result.command.length > 0 && 'ClaimOrRefresh' in result.command[0]) {
            return result.command[0].ClaimOrRefresh;
        } else {
            throw new Error(`ClaimOrRefresh failed: ${JSON.stringify(result)}`);
        }
    }

    // Wallet methods
    const registerUserToken = async (tokenPrincipal: string) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in to register tokens');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const daoActor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId()
            });

            const result = await daoActor.registerUserToken(Principal.fromText(tokenPrincipal)) as { ok?: string; err?: any };
            
            if ('ok' in result) {
                return (result as any).ok;
            } else {
                throw new Error(JSON.stringify((result as any).err));
            }
        } catch (error: any) {
            console.error('Error registering token:', error);
            throw error;
        }
    }

    const unregisterUserToken = async (tokenPrincipal: string) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in to unregister tokens');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const daoActor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId()
            });

            const result = await daoActor.unregisterUserToken(Principal.fromText(tokenPrincipal)) as { ok?: string; err?: any };
            
            if ('ok' in result) {
                return (result as any).ok;
            } else {
                throw new Error(JSON.stringify((result as any).err));
            }
        } catch (error: any) {
            console.error('Error unregistering token:', error);
            throw error;
        }
    }

    const getUserRegisteredTokens = async (): Promise<Principal[]> => {
        try {
            if (!userLoggedIn.value) {
                return [];
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const daoActor = Actor.createActor(daoBackendIDL, {
                agent,
                canisterId: daoBackendCanisterId()
            });

            return await daoActor.getUserRegisteredTokens() as Principal[];
        } catch (error: any) {
            console.error('Error fetching user registered tokens:', error);
            return [];
        }
    }

    const fetchUserTokenBalance = async (tokenPrincipal: string, decimals: number): Promise<bigint> => {
        try {
            if (!userLoggedIn.value) {
                return 0n;
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Use ICRC1 interface for all tokens (including ICP)
            const icrc1IDL = ({ IDL }: any) => {
                return IDL.Service({
                    'icrc1_balance_of': IDL.Func(
                        [IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) })],
                        [IDL.Nat],
                        ['query']
                    ),
                });
            };

            const tokenActor = Actor.createActor(icrc1IDL, {
                agent,
                canisterId: tokenPrincipal
            });
            
            return await tokenActor.icrc1_balance_of({
                owner: Principal.fromText(userPrincipal.value),
                subaccount: []
            }) as bigint;
        } catch (error: any) {
            console.error(`Error fetching balance for token ${tokenPrincipal}:`, error);
            return 0n;
        }
    }

    const sendToken = async (
        tokenPrincipal: string,
        recipient: string,
        amount: bigint,
        fee: bigint,
        memo?: string
    ) => {
        try {
            if (!userLoggedIn.value) {
                throw new Error('User must be logged in to send tokens');
            }

            const authClient = await getAuthClient();
            const identity = authClient.getIdentity();
            
            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            // Use ICRC1 interface for all tokens (including ICP)
            const icrc1IDL = ({ IDL }: any) => {
                return IDL.Service({
                    'icrc1_transfer': IDL.Func(
                        [IDL.Record({
                            'to': IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) }),
                            'fee': IDL.Opt(IDL.Nat),
                            'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
                            'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
                            'created_at_time': IDL.Opt(IDL.Nat64),
                            'amount': IDL.Nat,
                        })],
                        [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text })],
                        []
                    ),
                });
            };

            const tokenActor = Actor.createActor(icrc1IDL, {
                agent,
                canisterId: tokenPrincipal
            });

            const result = await tokenActor.icrc1_transfer({
                to: {
                    owner: Principal.fromText(recipient),
                    subaccount: []
                },
                fee: [fee],
                memo: memo ? [new TextEncoder().encode(memo)] : [],
                from_subaccount: [],
                created_at_time: [],
                amount: amount
            }) as { Ok?: any; Err?: any };

            if ('Ok' in result) {
                return (result as any).Ok;
            } else {
                throw new Error(JSON.stringify((result as any).Err));
            }
        } catch (error: any) {
            console.error('Error sending token:', error);
            throw error;
        }
    }

    // Token metadata cache (stored in localStorage)
    const TOKEN_METADATA_CACHE_KEY = 'taco_token_metadata_cache';
    const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

    const getCachedTokenMetadata = (tokenPrincipal: string): any => {
        try {
            const cached = localStorage.getItem(TOKEN_METADATA_CACHE_KEY);
            if (!cached) return null;
            
            const cache = JSON.parse(cached);
            const tokenCache = cache[tokenPrincipal];
            
            if (!tokenCache) return null;
            
            // Check if cache is expired
            if (Date.now() - tokenCache.timestamp > CACHE_EXPIRY_MS) {
                return null;
            }
            
            // Convert fee string back to BigInt
            const metadata = {
                ...tokenCache.metadata,
                fee: tokenCache.metadata.fee ? BigInt(tokenCache.metadata.fee) : 10000n
            };
            
            return metadata;
        } catch (error) {
            console.error('Error reading token metadata cache:', error);
            return null;
        }
    };

    const setCachedTokenMetadata = (tokenPrincipal: string, metadata: any) => {
        try {
            const cached = localStorage.getItem(TOKEN_METADATA_CACHE_KEY);
            const cache = cached ? JSON.parse(cached) : {};
            
            // Convert BigInt to string for JSON serialization
            const serializableMetadata = {
                ...metadata,
                fee: metadata.fee ? metadata.fee.toString() : '10000'
            };
            
            cache[tokenPrincipal] = {
                metadata: serializableMetadata,
                timestamp: Date.now()
            };
            
            localStorage.setItem(TOKEN_METADATA_CACHE_KEY, JSON.stringify(cache));
        } catch (error) {
            console.error('Error caching token metadata:', error);
        }
    };

    const clearTokenMetadataCache = (tokenPrincipal?: string) => {
        try {
            if (tokenPrincipal) {
                // Clear cache for specific token
                const cached = localStorage.getItem(TOKEN_METADATA_CACHE_KEY);
                if (cached) {
                    const cache = JSON.parse(cached);
                    delete cache[tokenPrincipal];
                    localStorage.setItem(TOKEN_METADATA_CACHE_KEY, JSON.stringify(cache));
                }
            } else {
                // Clear all cache
                localStorage.removeItem(TOKEN_METADATA_CACHE_KEY);
            }
        } catch (error) {
            console.error('Error clearing token metadata cache:', error);
        }
    };

    const fetchTokenMetadata = async (tokenPrincipal: string): Promise<any> => {
        // Check cache first
        const cached = getCachedTokenMetadata(tokenPrincipal);
        if (cached) {
            return cached;
        }

        try {
            // Create a basic ICRC1 token actor using existing patterns
            const icrc1IDL = ({ IDL }: any) => {
                const MetadataValue = IDL.Variant({
                    'Nat': IDL.Nat,
                    'Int': IDL.Int,
                    'Text': IDL.Text,
                    'Blob': IDL.Vec(IDL.Nat8),
                });
                const SupportedStandard = IDL.Record({
                    'name': IDL.Text,
                    'url': IDL.Text,
                });
                return IDL.Service({
                    'icrc1_metadata': IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, MetadataValue))], ['query']),
                    'icrc1_name': IDL.Func([], [IDL.Text], ['query']),
                    'icrc1_symbol': IDL.Func([], [IDL.Text], ['query']),
                    'icrc1_decimals': IDL.Func([], [IDL.Nat8], ['query']),
                    'icrc1_fee': IDL.Func([], [IDL.Nat], ['query']),
                    'icrc1_supported_standards': IDL.Func([], [IDL.Vec(SupportedStandard)], ['query']),
                });
            };

            // Create agent
            const host = process.env.DFX_NETWORK === "local"
                ? getLocalHost()
                : "https://ic0.app";
                
            const authClientInst = await getAuthClient();
            const agent = await createAgent({
                identity: new AnonymousIdentity(), // Use anonymous for metadata queries
                host,
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            const tokenActor = Actor.createActor(icrc1IDL, {
                agent,
                canisterId: tokenPrincipal,
            });

            // Try to fetch individual ICRC1 properties (more reliable than metadata)
            const [name, symbol, decimals, fee, metadataResult, supportedStandardsResult] = await Promise.allSettled([
                (tokenActor as any).icrc1_name(),
                (tokenActor as any).icrc1_symbol(), 
                (tokenActor as any).icrc1_decimals(),
                (tokenActor as any).icrc1_fee(),
                (tokenActor as any).icrc1_metadata(),
                (tokenActor as any).icrc1_supported_standards()
            ]);

            // Try to extract logo from metadata
            let logo = null;
            if (metadataResult.status === 'fulfilled' && Array.isArray(metadataResult.value)) {
                const logoEntry = metadataResult.value.find(([key, _]: [string, any]) => key === 'icrc1:logo');
                if (logoEntry && logoEntry[1] && 'Text' in logoEntry[1]) {
                    logo = logoEntry[1].Text;
                }
            }

            // Extract supported standards
            let supportedStandards: string[] = ['ICRC-1']; // Always includes ICRC-1
            if (supportedStandardsResult.status === 'fulfilled' && Array.isArray(supportedStandardsResult.value)) {
                supportedStandards = supportedStandardsResult.value.map((standard: any) => standard.name);
            }

            const metadata = {
                name: name.status === 'fulfilled' ? name.value : `Token ${tokenPrincipal.slice(0, 5)}...`,
                symbol: symbol.status === 'fulfilled' ? symbol.value : 'CUSTOM',
                decimals: decimals.status === 'fulfilled' ? Number(decimals.value) : 8,
                fee: fee.status === 'fulfilled' ? fee.value : 10000n,
                logo: logo,
                supportedStandards: supportedStandards
            };

            // console.log(`Fetched real metadata for ${tokenPrincipal}:`, metadata);

            // Cache the metadata
            setCachedTokenMetadata(tokenPrincipal, metadata);
            
            return metadata;
        } catch (error) {
            console.error('Error fetching token metadata:', error);
            // Return default metadata if fetch fails
            return {
                name: `Custom Token (${tokenPrincipal.slice(0, 5)}...)`,
                symbol: 'CUSTOM',
                decimals: 8,
                fee: 10000n,
                logo: null,
                supportedStandards: ['ICRC-1'] // Default to ICRC-1 only
            };
        }
    };

    // Check if token supports ICRC2 standard
    const checkTokenSupportsICRC1 = async (tokenPrincipal: string): Promise<boolean> => {
        try {
            const metadata = await fetchTokenMetadata(tokenPrincipal);
            return metadata.supportedStandards.some((standard: string) => 
                standard.toLowerCase().includes('icrc-2') || standard.toLowerCase().includes('icrc2')
            );
        } catch (error) {
            console.error('Error checking ICRC2 support:', error);
            return false; // Default to ICRC1 if check fails
        }
    };

    // Check if token supports ICRC2 standard
    const checkTokenSupportsICRC2 = async (tokenPrincipal: string): Promise<boolean> => {
        try {
            const metadata = await fetchTokenMetadata(tokenPrincipal);
            // console.log('ASDFASDF:', metadata.supportedStandards);
            return metadata.supportedStandards.some((standard: string) => 
                standard.toLowerCase().includes('icrc-2') || standard.toLowerCase().includes('icrc2')
            );
        } catch (error) {
            console.error('Error checking ICRC2 support:', error);
            return false; // Default to ICRC1 if check fails
        }
    };

        // # ALARM MANAGEMENT FUNCTIONS #

    // Helper function to create alarm actor
    const createAlarmActor = async (useAuth: boolean = true) => {
        try {


            let identity;
            const authClient = await getAuthClient();
            
            if (await authClient.isAuthenticated()) {
                identity = authClient.getIdentity();
                if (identity.getPrincipal().isAnonymous()) {
                    userLoggedIn.value = false;
                } else{
                userLoggedIn.value = true;};
            } else {
                identity = new AnonymousIdentity();
                userLoggedIn.value = false;
            }
        if (!userLoggedIn.value) {
                throw new Error('User must be logged in');
            }

            const agent = await createAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
                fetchRootKey: process.env.DFX_NETWORK === "local",
            });

            return Actor.createActor<AlarmService>(alarmIDL, {
                agent,
                canisterId: alarmCanisterId()
            });
        } catch (error) {
            console.error('Error creating alarm actor:', error);
            throw error;
        }
    }

    const performSystemHealthCheck = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.performSystemHealthCheckManual();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('System health check completed successfully');
            return result.ok;
        } catch (error) {
            console.error('Error performing system health check:', error);
            showError(`Error performing system health check: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getEnhancedAlarmSystemStatus = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getEnhancedAlarmSystemStatus();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting enhanced alarm system status:', error);
            showError(`Error getting alarm system status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getMonitoringStatus = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getMonitoringStatus();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting monitoring status:', error);
            showError(`Error getting monitoring status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const addAlarmAdmin = async (principalId: string) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.addAdmin(Principal.fromText(principalId),[{ Admin: null }]);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Admin added successfully');
            return result.ok;
        } catch (error) {
            console.error('Error adding alarm admin:', error);
            showError(`Error adding admin: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const addAlarmContact = async (name: string, type: string, value: string) => {
        try {
            const actor = await createAlarmActor();
            const contactType = type === 'SMS' ? { SMS: value } : { Email: value };
            const result = await actor.addContact(name,contactType);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Contact added successfully');
            return result.ok;
        } catch (error) {
            console.error('Error adding alarm contact:', error);
            showError(`Error adding contact: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getAlarmContacts = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getContacts();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting alarm contacts:', error);
            showError(`Error getting contacts: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const updateContactStatus = async (contactId: number, active: boolean) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.updateContactStatus(BigInt(contactId), active);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess(`Contact ${active ? 'activated' : 'deactivated'} successfully`);
            return result.ok;
        } catch (error) {
            console.error('Error updating contact status:', error);
            showError(`Error updating contact status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const removeAlarmContact = async (contactId: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.removeContact(BigInt(contactId));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Contact removed successfully');
            return result.ok;
        } catch (error) {
            console.error('Error removing alarm contact:', error);
            showError(`Error removing contact: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const testAlarmContact = async (contactIds: number[], options?: { email?: boolean; sms?: boolean }) => {
        try {
            const actor = await createAlarmActor();
            const bigIntContactIds = contactIds.map(id => BigInt(id));
            
            const results: { sms?: any; email?: any } = {};
            
            // Default to both if no options specified
            const shouldSendSMS = options?.sms !== false;
            const shouldSendEmail = options?.email !== false;
            
            if (shouldSendSMS) {
                const smsResult = await actor.sendTestSMS(bigIntContactIds);
                if ('err' in smsResult) {
                    throw new Error(`SMS test error: ${JSON.stringify(smsResult.err)}`);
                }
                results.sms = smsResult.ok;
            }
            
            if (shouldSendEmail) {
                const emailResult = await actor.sendTestEmail(bigIntContactIds);
                if ('err' in emailResult) {
                    throw new Error(`Email test error: ${JSON.stringify(emailResult.err)}`);
                }
                results.email = emailResult.ok;
            }
            
            const messageTypes = [];
            if (shouldSendSMS) messageTypes.push('SMS');
            if (shouldSendEmail) messageTypes.push('Email');
            
            showSuccess(`Test ${messageTypes.join(' and ')} sent successfully`);
            return results;
        } catch (error) {
            console.error('Error testing alarm contact:', error);
            showError(`Error testing contact: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getPendingAlarms = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getPendingAlarms();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting pending alarms:', error);
            showError(`Error getting pending alarms: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const acknowledgeAlarm = async (alarmId: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.acknowledgeAlarm(BigInt(alarmId));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Alarm acknowledged successfully');
            return result.ok;
        } catch (error) {
            console.error('Error acknowledging alarm:', error);
            showError(`Error acknowledging alarm: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getSystemErrors = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getSystemErrors(limit ? [BigInt(limit)] : []);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting system errors:', error);
            showError(`Error getting system errors: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getInternalErrors = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getInternalErrors(limit ? [BigInt(limit)] : []);

            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }

            return result.ok;
        } catch (error) {
            console.error('Error getting internal errors:', error);
            showError(`Error getting internal errors: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const resolveSystemError = async (errorId: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.resolveSystemErrorById(BigInt(errorId));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('System error resolved successfully');
            return result.ok;
        } catch (error) {
            console.error('Error resolving system error:', error);
            showError(`Error resolving system error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const setCheckInterval = async (intervalMinutes: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.setCheckInterval(BigInt(intervalMinutes));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Check interval updated successfully');
            return result.ok;
        } catch (error) {
            console.error('Error setting check interval:', error);
            showError(`Error setting check interval: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const startMonitoring = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.startMonitoring();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Monitoring started successfully');
            return result.ok;
        } catch (error) {
            console.error('Error starting monitoring:', error);
            showError(`Error starting monitoring: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const stopMonitoring = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.stopMonitoring();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Monitoring stopped successfully');
            return result.ok;
        } catch (error) {
            console.error('Error stopping monitoring:', error);
            showError(`Error stopping monitoring: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const addMonitoredCanister = async (canisterId: string, name: string, isSNSControlled: boolean, snsRootCanisterId: string | null, minimumCycles: bigint, cyclesAlertLevel: string, timersAlertLevel: string, statusAlertLevel: string) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.addMonitoredCanister(
    Principal.fromText(canisterId),
    name,
    isSNSControlled,
    snsRootCanisterId ? [Principal.fromText(snsRootCanisterId)] : [],
    minimumCycles,
    cyclesAlertLevel === 'Level2DelayedSMS'
        ? { Level2DelayedSMS: null }
        : { Level1Immediate: null },
        timersAlertLevel === 'Level2DelayedSMS'
        ? { Level2DelayedSMS: null }
        : { Level1Immediate: null },
        statusAlertLevel === 'Level2DelayedSMS'
        ? { Level2DelayedSMS: null }
        : { Level1Immediate: null },
);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Monitored canister added successfully');
            return result.ok;
        } catch (error) {
            console.error('Error adding monitored canister:', error);
            showError(`Error adding monitored canister: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getMonitoredCanisters = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getMonitoredCanisters();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting monitored canisters:', error);
            showError(`Error getting monitored canisters: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const removeMonitoredCanister = async (configId: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.removeMonitoredCanister(BigInt(configId));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Monitored canister removed successfully');
            return result.ok;
        } catch (error) {
            console.error('Error removing monitored canister:', error);
            showError(`Error removing monitored canister: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const updateMonitoredCanisterStatus = async (configId: number, enabled: boolean) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.updateMonitoredCanisterStatus(BigInt(configId), enabled);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess(`Monitored canister ${enabled ? 'enabled' : 'disabled'} successfully`);
            return result.ok;
        } catch (error) {
            console.error('Error updating monitored canister status:', error);
            showError(`Error updating monitored canister status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const startCanisterMonitoring = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.startCanisterMonitoring();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Canister monitoring started successfully');
            return result.ok;
        } catch (error) {
            console.error('Error starting canister monitoring:', error);
            showError(`Error starting canister monitoring: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const stopCanisterMonitoring = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.stopCanisterMonitoring();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Canister monitoring stopped successfully');
            return result.ok;
        } catch (error) {
            console.error('Error stopping canister monitoring:', error);
            showError(`Error stopping canister monitoring: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getCanisterHealthStatus = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getCanisterHealthStatus();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting canister health status:', error);
            showError(`Error getting canister health status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getQueueStatus = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getQueueStatus();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting queue status:', error);
            showError(`Error getting queue status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const clearQueues = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.clearQueues();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Queues cleared successfully');
            return result.ok;
        } catch (error) {
            console.error('Error clearing queues:', error);
            showError(`Error clearing queues: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getSentMessages = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getSentMessages(limit ? [BigInt(limit)] : []);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting sent messages:', error);
            showError(`Error getting sent messages: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getSentSMSMessages = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getSentSMSMessages(limit ? [BigInt(limit)] : []);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting sent SMS messages:', error);
            showError(`Error getting sent SMS messages: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getSentEmailMessages = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getSentEmailMessages(limit ? [BigInt(limit)] : []);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting sent email messages:', error);
            showError(`Error getting sent email messages: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const setCanisterMonitoringInterval = async (intervalMinutes: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.setCanisterMonitoringInterval(BigInt(intervalMinutes));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Canister monitoring interval updated successfully');
            return result.ok;
        } catch (error) {
            console.error('Error setting canister monitoring interval:', error);
            showError(`Error setting canister monitoring interval: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const setLevel2SMSCheckInterval = async (intervalMinutes: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.setLevel2SMSCheckInterval(BigInt(intervalMinutes));
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Level 2 SMS check interval updated successfully');
            return result.ok;
        } catch (error) {
            console.error('Error setting level 2 SMS check interval:', error);
            showError(`Error setting level 2 SMS check interval: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getConfigurationIntervals = async () => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getConfigurationIntervals();
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting configuration intervals:', error);
            showError(`Error getting configuration intervals: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getAdminActionLogs = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getAdminActionLogs(limit ? [BigInt(limit)] : []);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting admin action logs:', error);
            showError(`Error getting admin action logs: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const getAlarmAcknowledgments = async (limit?: number) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.getAlarmAcknowledgments(limit ? [BigInt(limit)] : []);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            return result.ok;
        } catch (error) {
            console.error('Error getting alarm acknowledgments:', error);
            showError(`Error getting alarm acknowledgments: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const sendTestEmailSingle = async (email: string, subject: string) => {
        try {
            const actor = await createAlarmActor();
            const result = await actor.sendTestEmailSingle(email, subject);
            
            if ('err' in result) {
                throw new Error(JSON.stringify(result.err));
            }
            
            showSuccess('Test email sent successfully');
            return result.ok;
        } catch (error) {
            console.error('Error sending test email:', error);
            showError(`Error sending test email: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    const showSuccess = (message: string) => {
        addToast({
            id: Date.now(),
            code: 'success',
            title: 'Success',
            message: message,
            icon: 'fa-solid fa-check'
        });
    }

    const showError = (message: string) => {
        addToast({
            id: Date.now(),
            code: 'error',
            title: 'Error',
            message: message,
            icon: 'fa-solid fa-exclamation-triangle'
        });
    }

    // ===========================
    // NNS VOTING SYSTEM FUNCTIONS
    // ===========================

    // Create neuron snapshot actor
    const createNeuronSnapshotActor = async () => {
        const { HttpAgent } = await import('@dfinity/agent');
        const authClient = await getAuthClient();
        const identity = await authClient.getIdentity();
        const agent = new HttpAgent({
            identity,
            host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
        });

        if (process.env.DFX_NETWORK === "local") {
            await agent.fetchRootKey();
        }

        return Actor.createActor(neuronSnapshotIDL, {
            agent,
            canisterId: neuronSnapshotCanisterId()
        });
    }

    // Get votable NNS/SNS proposal pairs
    const getVotableProposals = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getVotableProposals();
            return result; // Array of [nnsId, snsId] pairs
        } catch (error) {
            console.error('Error getting votable proposals:', error);
            throw error;
        }
    }

    // Find NNS proposal ID for given SNS proposal ID
    const findNNSProposalForSNS = async (snsProposalId: bigint): Promise<bigint | null> => {
        try {
            const votableProposals = await getVotableProposals();
            const match = votableProposals.find(([nnsId, snsId]: [any, any]) => snsId === snsProposalId);
            return match ? match[0] : null;
        } catch (error) {
            console.error('Error finding NNS proposal for SNS:', error);
            return null;
        }
    }

    // Get NNS proposal details from NNS governance
    const getNNSProposal = async (nnsProposalId: bigint) => {
        try {
            const { Actor, HttpAgent } = await import('@dfinity/agent');
            const authClient = await getAuthClient();
            const identity = await authClient.getIdentity();
            const agent = new HttpAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
            });

            if (process.env.DFX_NETWORK === "local") {
                await agent.fetchRootKey();
            }

            // Import NNS governance IDL
            const { idlFactory } = await import('../../../declarations/nns_governance');
            
            const nnsGov = Actor.createActor(idlFactory, {
                agent,
                canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai' // NNS Governance canister
            });

            const result = await (nnsGov as any).get_proposal_info(nnsProposalId);
            
            // get_proposal_info returns opt ProposalInfo, so we need to handle the optional
            if (!result || (Array.isArray(result) && result.length === 0)) {
                throw new Error(`NNS proposal ${nnsProposalId} not found`);
            }
            
            // Handle both array format (from optional) and direct object format
            const proposalInfo = Array.isArray(result) ? result[0] : result;
            
            if (!proposalInfo) {
                throw new Error(`NNS proposal ${nnsProposalId} not found`);
            }
            
            
            // Format the proposal data for display
            return {
                id: proposalInfo.id?.[0]?.id || nnsProposalId,
                title: proposalInfo.proposal?.[0]?.title?.[0] || `NNS Proposal ${nnsProposalId}`,
                summary: proposalInfo.proposal?.[0]?.summary || 'No summary available',
                url: proposalInfo.proposal?.[0]?.url || '',
                topic: proposalInfo.topic,
                status: proposalInfo.status,
                latest_tally: proposalInfo.latest_tally?.[0] || null,
                proposal_timestamp_seconds: proposalInfo.proposal_timestamp_seconds,
                deadline_timestamp_seconds: proposalInfo.deadline_timestamp_seconds?.[0] || null,
                decided_timestamp_seconds: proposalInfo.decided_timestamp_seconds,
                executed_timestamp_seconds: proposalInfo.executed_timestamp_seconds,
                proposer: proposalInfo.proposer?.[0] || null,
            };
        } catch (error) {
            console.error('Error getting NNS proposal:', error);
            throw error;
        }
    }

    // Get SNS proposal details from SNS governance
    const getSNSProposal = async (snsProposalId: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getSNSProposal(snsProposalId);
            if ('ok' in result) {
                return result.ok;
            } else {
                // Fallback: fetch directly from SNS Governance if snapshot returns an error
                console.warn('Snapshot getSNSProposal err, trying SNS governance directly:', result.err);
                try {
                    const authClient = await getAuthClient();
                    const identity = authClient.getIdentity();
                    const agent = await createAgent({
                        identity,
                        host: process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app',
                        fetchRootKey: process.env.DFX_NETWORK === 'local',
                    });
                    const snsGov = await createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai');
                    const resp = await (snsGov as any).get_proposal({ proposal_id: [{ id: snsProposalId }] });
                    // Normalize GetProposalResponse -> ProposalData
                    if (resp?.result && Array.isArray(resp.result) && resp.result.length > 0) {
                        const inner = resp.result[0];
                        if (inner?.Proposal) {
                            return inner.Proposal; // ProposalData shape
                        } else if (inner?.Ok) {
                            return inner.Ok;
                        }
                    }
                    throw new Error('Failed to get SNS proposal');
                } catch (fallbackError) {
                    console.error('SNS governance fallback failed:', fallbackError);
                    throw new Error((result.err && (result.err.error_message || result.err)) || 'Failed to get SNS proposal');
                }
            }
        } catch (error) {
            console.error('Error getting SNS proposal:', error);
            throw error;
        }
    }

    // Get DAO vote tally for SNS proposal
    const getDAOVoteTally = async (snsProposalId: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getDAOVoteTally(snsProposalId);
            return result;
        } catch (error) {
            console.error('Error getting DAO vote tally:', error);
            throw error;
        }
    }

    // Submit DAO votes for SNS proposal
    const submitDAOVotes = async (snsProposalId: bigint, neuronIds: Uint8Array[], decision: 'Adopt' | 'Reject') => {
        try {
            const actor = await createNeuronSnapshotActor();
            const decisionVariant = decision === 'Adopt' ? { Adopt: null } : { Reject: null };
            const result = await (actor as any).submitDAOVotes(snsProposalId, neuronIds, decisionVariant);
            
            if ('ok' in result) {
                return result.ok;
            } else {
                throw new Error(result.err || 'Failed to submit votes');
            }
        } catch (error) {
            console.error('Error submitting DAO votes:', error);
            throw error;
        }
    }

    // Check if a neuron has voted on a proposal
    const hasNeuronVoted = async (snsProposalId: bigint, neuronId: Uint8Array) => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).hasNeuronVoted(snsProposalId, neuronId);
            return result;
        } catch (error) {
            console.error('Error checking if neuron voted:', error);
            return null;
        }
    }

    // Check if DAO has already voted on NNS proposal
    const hasDAOVoted = async (nnsProposalId: bigint): Promise<boolean> => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).hasDAOVoted(nnsProposalId);
            return result;
        } catch (error) {
            console.error('Error checking if DAO voted:', error);
            return false;
        }
    }

    // Get votable proposals with time remaining information
    const getVotableProposalsWithTimeLeft = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getVotableProposalsWithTimeLeft();
            return result;
        } catch (error) {
            console.error('Error getting votable proposals with time left:', error);
            throw error;
        }
    }

    // Get periodic timer status
    const getPeriodicTimerStatus = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getPeriodicTimerStatus();
            return result;
        } catch (error) {
            console.error('Error getting periodic timer status:', error);
            throw error;
        }
    }

    // Start periodic timer
    const startPeriodicTimer = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).startPeriodicTimer();
            return result;
        } catch (error) {
            console.error('Error starting periodic timer:', error);
            throw error;
        }
    }

    // Stop periodic timer
    const stopPeriodicTimer = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).stopPeriodicTimer();
            return result;
        } catch (error) {
            console.error('Error stopping periodic timer:', error);
            throw error;
        }
    }

    // Check if auto-processing is running
    const isAutoProcessingRunning = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).isAutoProcessingRunning();
            return result;
        } catch (error) {
            console.error('Error checking auto-processing status:', error);
            return false;
        }
    }

    // Check if auto-voting is running
    const isAutoVotingRunning = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).isAutoVotingRunning();
            return result;
        } catch (error) {
            console.error('Error checking auto-voting status:', error);
            return false;
        }
    }

    // Start auto-processing NNS proposals
    const startAutoProcessNNSProposals = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).startAutoProcessNNSProposals();
            return result;
        } catch (error) {
            console.error('Error starting auto-processing:', error);
            throw error;
        }
    }

    // Stop auto-processing NNS proposals
    const stopAutoProcessNNSProposals = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).stopAutoProcessNNSProposals();
            return result;
        } catch (error) {
            console.error('Error stopping auto-processing:', error);
            throw error;
        }
    }

    // Start auto-voting on urgent proposals
    const startAutoVoteOnUrgentProposals = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).startAutoVoteOnUrgentProposals();
            return result;
        } catch (error) {
            console.error('Error starting auto-voting:', error);
            throw error;
        }
    }

    // Stop auto-voting on urgent proposals
    const stopAutoVoteOnUrgentProposals = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).stopAutoVoteOnUrgentProposals();
            return result;
        } catch (error) {
            console.error('Error stopping auto-voting:', error);
            throw error;
        }
    }

    // Get auto-voting threshold in seconds
    const getAutoVotingThresholdSeconds = async () => {
        try {
            // console.log('Getting auto-voting threshold...');
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getAutoVotingThresholdSeconds();
            // console.log('Auto-voting threshold result:', result);
            return result;
        } catch (error) {
            console.error('Error getting auto-voting threshold:', error);
            throw error;
        }
    }

    // Get highest processed NNS proposal ID
    const getHighestProcessedNNSProposalId = async () => {
        try {
            // console.log('Getting highest processed NNS proposal ID...');
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getHighestProcessedNNSProposalId();
            // console.log('Highest processed NNS proposal ID result:', result);
            return result;
        } catch (error) {
            console.error('Error getting highest processed NNS proposal ID:', error);
            throw error;
        }
    }

    // Set auto-voting threshold in seconds
    const setAutoVotingThresholdSeconds = async (thresholdSeconds: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            await (actor as any).setAutoVotingThresholdSeconds(thresholdSeconds);
        } catch (error) {
            console.error('Error setting auto-voting threshold:', error);
            throw error;
        }
    }

    // Set highest processed NNS proposal ID
    const setHighestProcessedNNSProposalId = async (proposalId: bigint) => {
        try {
            // console.log('Setting highest processed NNS proposal ID to:', proposalId.toString());
            const actor = await createNeuronSnapshotActor();
            await (actor as any).setHighestProcessedNNSProposalId(proposalId);
            // console.log('Successfully set highest processed NNS proposal ID to:', proposalId.toString());
        } catch (error) {
            console.error('Error setting highest processed NNS proposal ID:', error);
            throw error;
        }
    }

    // Topic IDs that should be copied to SNS (matching backend TOPICS_TO_COPY)
    const TOPICS_TO_COPY = [
        5,  // TOPIC_NODE_ADMIN - Node Admin
        6,  // TOPIC_PARTICIPANT_MANAGEMENT - Participant Management  
        10, // TOPIC_NODE_PROVIDER_REWARDS - Node Provider Rewards
        14, // TOPIC_SNS_AND_COMMUNITY_FUND - SNS & Community Fund
    ];

    // Helper function to get topic name from topic ID
    const getTopicName = (topicId: number): string => {
        switch (topicId) {
            case 0: return "Unspecified";
            case 1: return "Neuron Management";
            case 2: return "Exchange Rate";
            case 3: return "Network Economics";
            case 4: return "Governance";
            case 5: return "Node Admin";
            case 6: return "Participant Management";
            case 7: return "Subnet Management";
            case 8: return "Network Canister Management";
            case 9: return "KYC";
            case 10: return "Node Provider Rewards";
            case 11: return "SNS Decentralization Sale (Deprecated)";
            case 12: return "Subnet Replica Version Management";
            case 13: return "Replica Version Management";
            case 14: return "SNS & Community Fund";
            case 15: return "API Boundary Node Management";
            default: return `Unknown Topic (${topicId})`;
        }
    };

    // Helper function to check if a topic should be copied
    const shouldVoteTopic = (topicId: number): boolean => {
        return TOPICS_TO_COPY.includes(topicId);
    };

    // Helper function to get proposal status name from status ID
    const getProposalStatusName = (statusId: number): string => {
        switch (statusId) {
            case 1: return "Open";
            case 2: return "Rejected";
            case 3: return "Adopted";
            case 4: return "Executed";
            case 5: return "Failed";
            default: return `Unknown (${statusId})`;
        }
    };

    // Helper function to check if proposal is still open for voting
    const isProposalVotable = (proposalInfo: any): boolean => {
        // Check if proposal has a deadline and if it's still in the future
        if (proposalInfo.deadline_timestamp_seconds) {
            const deadlineMs = Number(proposalInfo.deadline_timestamp_seconds) * 1000;
            const now = Date.now();
            return now < deadlineMs;
        }
        
        // Fallback: if no deadline info, check status (Open = 1)
        const statusId = Number(proposalInfo.status || 0);
        return statusId === 1;
    };

    // Get NNS proposal info directly from NNS governance
    const getNNSProposalInfo = async (proposalId: bigint) => {
        try {
            const { HttpAgent } = await import('@dfinity/agent');
            const authClient = await getAuthClient();
            const identity = await authClient.getIdentity();
            const agent = new HttpAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
            });

            if (process.env.DFX_NETWORK === "local") {
                await agent.fetchRootKey();
            }

            // Import NNS governance IDL
            const { idlFactory } = await import('../../../declarations/nns_governance');
            
            const nnsGov = Actor.createActor(idlFactory, {
                agent,
                canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai' // NNS Governance canister
            });

            const result = await (nnsGov as any).get_proposal_info(proposalId);
            
            // get_proposal_info returns opt ProposalInfo, so we need to handle the optional
            if (!result || (Array.isArray(result) && result.length === 0)) {
                return null; // Proposal not found
            }

            // Extract the proposal info from the optional wrapper
            const proposalInfo = Array.isArray(result) ? result[0] : result;
            return proposalInfo;
        } catch (error) {
            console.error('Error getting NNS proposal info:', error);
            throw error;
        }
    };

    // Copy NNS proposal to SNS
    const copyNNSProposal = async (nnsProposalId: bigint) => {
        try {
            // console.log('Copying NNS proposal:', nnsProposalId.toString());
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).copyNNSProposal(nnsProposalId);
            // console.log('Copy NNS proposal result:', result);
            return result;
        } catch (error) {
            console.error('Error copying NNS proposal:', error);
            throw error;
        }
    };

    // Check if NNS proposal is already copied
    const isNNSProposalCopied = async (nnsProposalId: bigint): Promise<bigint | null> => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).isNNSProposalCopied(nnsProposalId);
            
            // console.log(`isNNSProposalCopied(${nnsProposalId}) raw result:`, result);
            
            // Handle Motoko optional return type
            // Optional with value comes as [value], empty optional comes as []
            if (Array.isArray(result) && result.length > 0) {
                return result[0]; // Has value (copied, return SNS ID)
            } else {
                return null; // No value (not copied)
            }
        } catch (error) {
            console.error('Error checking if NNS proposal is copied:', error);
            throw error;
        }
    };

    // Remove NNS-SNS proposal mapping
    const removeCopiedNNSProposal = async (nnsProposalId: bigint) => {
        try {
            // console.log('Removing NNS-SNS proposal mapping for NNS proposal:', nnsProposalId.toString());
            const actor = await createNeuronSnapshotActor();
            await (actor as any).removeCopiedNNSProposal(nnsProposalId);
            // console.log('Successfully removed NNS-SNS proposal mapping for:', nnsProposalId.toString());
        } catch (error) {
            console.error('Error removing NNS-SNS proposal mapping:', error);
            throw error;
        }
    };

    // Check if TACO DAO neuron has voted on NNS proposal
    const hasNeuronVotedOnNNSProposal = async (proposalId: bigint, neuronId: bigint): Promise<boolean> => {
        try {
            const { HttpAgent } = await import('@dfinity/agent');
            const authClient = await getAuthClient();
            const identity = await authClient.getIdentity();
            const agent = new HttpAgent({
                identity,
                host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
            });

            if (process.env.DFX_NETWORK === "local") {
                await agent.fetchRootKey();
            }

            // Import NNS governance IDL
            const { idlFactory } = await import('../../../declarations/nns_governance');
            
            const nnsGov = Actor.createActor(idlFactory, {
                agent,
                canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai' // NNS Governance canister
            });

            // Get the proposal info which includes ballots
            const result = await (nnsGov as any).get_proposal_info(proposalId);
            
            if (!result || (Array.isArray(result) && result.length === 0)) {
                return false; // Proposal not found, assume not voted
            }

            // Extract the proposal info from the optional wrapper
            const proposalInfo = Array.isArray(result) ? result[0] : result;
            
            // Check if our neuron has voted by looking at the ballots
            if (proposalInfo.ballots) {
                // ballots is a Map-like structure where keys are neuron IDs
                for (const [ballotNeuronId, ballot] of proposalInfo.ballots) {
                    if (ballotNeuronId === neuronId) {
                        // Found our neuron in the ballots, check if it has actually voted
                        // vote field: 0 = Unspecified, 1 = Yes, 2 = No
                        return ballot.vote !== undefined && ballot.vote !== 0;
                    }
                }
            }
            
            return false; // Neuron not found in ballots or hasn't voted
        } catch (error) {
            console.error('Error checking if neuron voted on NNS proposal:', error);
            return false; // Assume not voted on error
        }
    };

    // Get periodic timer interval in seconds
    const getPeriodicTimerIntervalSeconds = async () => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getPeriodicTimerIntervalSeconds();
            return result;
        } catch (error) {
            console.error('Error getting periodic timer interval:', error);
            throw error;
        }
    }

    // Set periodic timer interval in seconds
    const setPeriodicTimerIntervalSeconds = async (intervalSeconds: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            await (actor as any).setPeriodicTimerIntervalSeconds(intervalSeconds);
        } catch (error) {
            console.error('Error setting periodic timer interval:', error);
            throw error;
        }
    }

    // Vote on NNS proposal (force vote)
    const voteOnNNSProposal = async (snsProposalId: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).voteOnNNSProposal(snsProposalId);
            return result;
        } catch (error) {
            console.error('Error voting on NNS proposal:', error);
            throw error;
        }
    }

    // Get proposer subaccount
    const getProposerSubaccount = async () => {
        try {
            // console.log('Getting proposer subaccount...');
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getProposerSubaccount();
            // console.log('Proposer subaccount result:', result);
            return result;
        } catch (error) {
            console.error('Error getting proposer subaccount:', error);
            throw error;
        }
    }

    // Set proposer subaccount
    const setProposerSubaccount = async (subaccount: Uint8Array) => {
        try {
            const actor = await createNeuronSnapshotActor();
            await (actor as any).setProposerSubaccount(subaccount);
        } catch (error) {
            console.error('Error setting proposer subaccount:', error);
            throw error;
        }
    }

    // Get TACO DAO neuron ID
    const getTacoDAONeuronId = async () => {
        try {
            // console.log('Getting TACO DAO neuron ID...');
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getTacoDAONeuronId();
            // console.log('TACO DAO neuron ID result:', result);
            return result;
        } catch (error) {
            console.error('Error getting TACO DAO neuron ID:', error);
            throw error;
        }
    }

    // Set TACO DAO neuron ID
    const setTacoDAONeuronId = async (neuronId: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            await (actor as any).setTacoDAONeuronId(neuronId);
        } catch (error) {
            console.error('Error setting TACO DAO neuron ID:', error);
            throw error;
        }
    }

    // Get user's TACO neurons for voting (reuse existing function)
    const getUserVotingNeurons = async () => {
        return await getTacoNeurons();
    }

    // Format NNS proposal link
    const formatNNSProposalLink = (nnsProposalId: bigint): string => {
        return `https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=${nnsProposalId}`;
    }

    // Format SNS proposal for display (similar to TACO proposals)
    const formatSNSProposalForDisplay = (proposal: any) => {
        
        // Extract data from SNS proposal structure (arrays for optional fields)
        const proposalId = proposal.id?.[0]?.id || 0n;
        const proposalData = proposal.proposal?.[0];
        const latestTally = proposal.latest_tally?.[0];
        const proposerData = proposal.proposer?.[0];
        
        // Use payload_text_rendering as the summary if available, otherwise proposal summary
        let summary = 'No summary available';
        if (proposal.payload_text_rendering?.[0]) {
            summary = proposal.payload_text_rendering[0];
        } else if (proposalData?.summary) {
            summary = proposalData.summary;
        }
        
        return {
            id: proposalId,
            title: proposalData?.title || `SNS Proposal ${proposalId}`,
            summary: summary,
            url: proposalData?.url || '',
            status: getProposalStatus(proposal),
            createdAt: new Date(Number(proposal.proposal_creation_timestamp_seconds) * 1000),
            decidedAt: proposal.decided_timestamp_seconds > 0n ? 
                new Date(Number(proposal.decided_timestamp_seconds) * 1000) : undefined,
            executedAt: proposal.executed_timestamp_seconds > 0n ? 
                new Date(Number(proposal.executed_timestamp_seconds) * 1000) : undefined,
            proposer: proposerData?.id ? uint8ArrayToHex(proposerData.id) : undefined,
            yesVotes: latestTally?.yes || 0n,
            noVotes: latestTally?.no || 0n,
            totalVotes: latestTally?.total || 0n,
            topic: getProposalTopic(proposal)
        };
    }

    // Get proposal status from SNS proposal data
    const getProposalStatus = (proposal: any): string => {
        if (proposal.executed_timestamp_seconds > 0n) return 'Executed';
        if (proposal.failed_timestamp_seconds > 0n) return 'Failed';
        if (proposal.decided_timestamp_seconds > 0n) {
            // Check if it was adopted or rejected based on votes
            const latestTally = proposal.latest_tally?.[0];
            const yes = Number(latestTally?.yes || 0n);
            const no = Number(latestTally?.no || 0n);
            return yes > no ? 'Adopted' : 'Rejected';
        }
        return 'Open';
    }

    // Get proposal topic from SNS proposal data
    const getProposalTopic = (proposal: any) => {
        // Extract topic from the action if available
        const proposalData = proposal.proposal?.[0];
        if (proposalData?.action) {
            const actionKeys = Object.keys(proposalData.action);
            if (actionKeys.length > 0) {
                return { [actionKeys[0]]: null };
            }
        }
        return { Motion: null }; // Default to Motion for copied proposals
    }

    // Get SNS proposal ID for a given NNS proposal ID
    const getSNSProposalIdForNNS = async (nnsProposalId: bigint) => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getSNSProposalIdForNNS(nnsProposalId);
            return result;
        } catch (error) {
            console.error('Error getting SNS proposal ID for NNS proposal:', error);
            throw error;
        }
    }

    // Get default vote behavior
    const getDefaultVoteBehavior = async () => {
        try {
            // console.log('Getting default vote behavior...');
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).getDefaultVoteBehavior();
            // console.log('Default vote behavior result:', result);
            return result;
        } catch (error) {
            console.error('Error getting default vote behavior:', error);
            throw error;
        }
    }

    // Set default vote behavior
    const setDefaultVoteBehavior = async (behavior: any) => {
        try {
            const actor = await createNeuronSnapshotActor();
            const result = await (actor as any).setDefaultVoteBehavior(behavior);
            return result;
        } catch (error) {
            console.error('Error setting default vote behavior:', error);
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
        fetchedTokenDetailsWithPastPrices,
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
        snsTreasuryDkpValueInUsd,
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
        hasTokenDetails,
        tacoWizardOpen,
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
        fetchTokenDetailsWithPastPrices,
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
        getTacoNeurons,
        formatNeuronForDisplay,
        categorizeNeurons,
        loadNeuronRewardBalances,
        claimNeuronRewards,
        claimAllNeuronRewards,
        formatNeuronIdForMap,
        stakeToNeuron,
        createNeuron,
        setNeuronDissolveDelay,
        startDissolving,
        stopDissolving,
        disburseNeuron,
        getGrantablePermissions,
        addNeuronPermissions,
        removeNeuronPermissions,
        addNeuronFollowee,
        removeNeuronFollowee,
        getSingleNeuron,
        toggleThreadMenu,
        ensureTokenDetails,
        checkTokenSupportsICRC2,
        toggleTacoWizard,

        //Wallet functions
        getUserRegisteredTokens,
        registerUserToken,
        unregisterUserToken,
        sendToken,
        fetchUserTokenBalance,
        clearTokenMetadataCache,
        fetchTokenMetadata,

        // Canister ID functions
        daoBackendCanisterId,
        treasuryCanisterId,
        neuronSnapshotCanisterId,
        rewardsCanisterId,
        portfolioArchiveCanisterId,
        
        // Router
        router,
        alarmCanisterId,
        
        // Portfolio snapshot management
        getPortfolioSnapshotStatus,
        startPortfolioSnapshots,
        stopPortfolioSnapshots,
        updatePortfolioSnapshotInterval,

        // Alarm management functions
        createAlarmActor,
        performSystemHealthCheck,
        getEnhancedAlarmSystemStatus,
        getMonitoringStatus,
        addAlarmAdmin,
        addAlarmContact,
        getAlarmContacts,
        updateContactStatus,
        removeAlarmContact,
        testAlarmContact,
        getPendingAlarms,
        acknowledgeAlarm,
        getSystemErrors,
        getInternalErrors,
        resolveSystemError,
        setCheckInterval,
        startMonitoring,
        stopMonitoring,
        addMonitoredCanister,
        getMonitoredCanisters,
        removeMonitoredCanister,
        updateMonitoredCanisterStatus,
        startCanisterMonitoring,
        stopCanisterMonitoring,
        getCanisterHealthStatus,
        getQueueStatus,
        clearQueues,
        getSentMessages,
        getSentSMSMessages,
        getSentEmailMessages,
        setCanisterMonitoringInterval,
        setLevel2SMSCheckInterval,
        getConfigurationIntervals,
        getAdminActionLogs,
        getAlarmAcknowledgments,
        sendTestEmailSingle,
        showSuccess,
        showError,

        // NNS Voting System
        getVotableProposals,
        findNNSProposalForSNS,
        getNNSProposal,
        getSNSProposal,
        getDAOVoteTally,
        submitDAOVotes,
        hasNeuronVoted,
        hasDAOVoted,
        getUserVotingNeurons,
        formatNNSProposalLink,
        formatSNSProposalForDisplay,
        getProposalStatus,
        getProposalTopic,
        uint8ArrayToHex,
        formatTokenAmount,
        // New NNS automation functions
        getVotableProposalsWithTimeLeft,
        getPeriodicTimerStatus,
        startPeriodicTimer,
        stopPeriodicTimer,
        isAutoProcessingRunning,
        isAutoVotingRunning,
        startAutoProcessNNSProposals,
        stopAutoProcessNNSProposals,
        startAutoVoteOnUrgentProposals,
        stopAutoVoteOnUrgentProposals,
        getAutoVotingThresholdSeconds,
        setAutoVotingThresholdSeconds,
        getHighestProcessedNNSProposalId,
        setHighestProcessedNNSProposalId,
        getTopicName,
        shouldVoteTopic,
        getProposalStatusName,
        isProposalVotable,
        getNNSProposalInfo,
        copyNNSProposal,
        isNNSProposalCopied,
        removeCopiedNNSProposal,
        hasNeuronVotedOnNNSProposal,
        getPeriodicTimerIntervalSeconds,
        setPeriodicTimerIntervalSeconds,
        voteOnNNSProposal,
        getProposerSubaccount,
        setProposerSubaccount,
        getTacoDAONeuronId,
        setTacoDAONeuronId,
        getSNSProposalIdForNNS,
        getDefaultVoteBehavior,
        setDefaultVoteBehavior,
    }
})
