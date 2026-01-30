import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AdminActionRecord {
  'id' : bigint,
  'admin' : Principal,
  'errorMessage' : [] | [string],
  'actionType' : AdminActionType,
  'timestamp' : bigint,
  'success' : boolean,
  'reason' : string,
}
export type AdminActionType = {
    'TokenAdd' : {
      'token' : Principal,
      'viaGovernance' : boolean,
      'tokenType' : TokenType,
    }
  } |
  { 'AdminAdd' : { 'newAdmin' : Principal } } |
  { 'TokenUnpause' : { 'token' : Principal } } |
  {
    'AdminPermissionGrant' : {
      'durationDays' : bigint,
      'function' : string,
      'targetAdmin' : Principal,
    }
  } |
  { 'CanisterStart' : null } |
  { 'TokenPause' : { 'token' : Principal } } |
  { 'AdminRemove' : { 'removedAdmin' : Principal } } |
  {
    'SystemStateChange' : { 'oldState' : SystemState, 'newState' : SystemState }
  } |
  {
    'ParameterUpdate' : {
      'oldValue' : string,
      'parameter' : SystemParameter,
      'newValue' : string,
    }
  } |
  { 'TokenRemove' : { 'token' : Principal } } |
  { 'TokenDelete' : { 'token' : Principal } } |
  { 'CanisterStop' : null };
export interface AdminActionsSinceResponse {
  'totalCount' : bigint,
  'actions' : Array<AdminActionRecord>,
}
export type AdminFunction = { 'removeToken' : null } |
  { 'setTest' : null } |
  { 'manageBannedWords' : null } |
  { 'startRebalancing' : null } |
  { 'getLogs' : null } |
  { 'removeAdmin' : null } |
  { 'stopToken' : null } |
  { 'backfillPerformanceData' : null } |
  { 'getNeuronUpdates' : null } |
  { 'unpauseToken' : null } |
  { 'updateSystemParameter' : null } |
  { 'updateTreasuryConfig' : null } |
  { 'getFollowActions' : null } |
  { 'updateSpamParameters' : null } |
  { 'addToken' : null } |
  { 'getAdminActions' : null } |
  { 'addAdmin' : null } |
  { 'stopRebalancing' : null } |
  { 'deleteToken' : null } |
  { 'recoverPoolBalances' : null } |
  { 'setTacoAddress' : null } |
  { 'clearLogs' : null } |
  { 'createAuction' : null } |
  { 'getVotingPowerChanges' : null } |
  { 'updateMintingVaultConfig' : null } |
  { 'getAllocationChanges' : null } |
  { 'pauseToken' : null } |
  { 'updateSystemState' : null } |
  { 'endAuctionPanic' : null };
export interface AdminPermission {
  'function' : AdminFunction,
  'expiresAt' : bigint,
  'grantedBy' : Principal,
}
export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export type AllocationChangeType = {
    'FollowAction' : { 'followedUser' : Principal }
  } |
  { 'UserUpdate' : { 'userInitiated' : boolean } } |
  { 'SystemRebalance' : null } |
  { 'VotingPowerChange' : null };
export interface AllocationChangesSinceResponse {
  'totalCount' : bigint,
  'changes' : Array<PastAllocationRecord>,
}
export interface AllocationStats {
  'neuronsWithAllocations' : bigint,
  'recentUpdatesCount' : bigint,
  'totalUserVotingPower' : bigint,
  'mostRecentUpdateTime' : bigint,
  'totalNeuronVotingPower' : bigint,
  'usersWithAllocations' : bigint,
}
export type AuthorizationError = { 'NotAllowed' : null } |
  { 'NotAdmin' : null } |
  { 'UnexpectedError' : string };
export interface BackfillResult {
  'startTime' : bigint,
  'neuronsProcessed' : bigint,
  'periodsCreated' : bigint,
  'totalNeuronRewards' : bigint,
  'endTime' : bigint,
  'errors' : Array<string>,
}
export interface ContinuousDAO {
  'addAdmin' : ActorMethod<[Principal, [] | [string]], Result_1>,
  'addBannedWords' : ActorMethod<[Array<string>], Result_1>,
  'addToken' : ActorMethod<[Principal, TokenType], Result_1>,
  'addTokenWithReason' : ActorMethod<[Principal, TokenType, string], Result_1>,
  'admin_addPenalizedNeuron' : ActorMethod<
    [Uint8Array | number[], bigint],
    Result_20
  >,
  'admin_backfillNeuronAllocationRecords' : ActorMethod<[], Result_19>,
  'admin_backfillPerformanceData' : ActorMethod<
    [[] | [bigint], [] | [bigint], [] | [bigint], [] | [boolean]],
    Result_18
  >,
  'admin_clearAllPastPrices' : ActorMethod<[], Result_1>,
  'admin_generateTestData' : ActorMethod<[[] | [TestDataConfig]], Result_17>,
  'admin_getAllActiveNeuronIds' : ActorMethod<[], Array<Uint8Array | number[]>>,
  'admin_getNeuronAllocations' : ActorMethod<
    [],
    Array<[Uint8Array | number[], NeuronAllocation]>
  >,
  'admin_getUserAllocation' : ActorMethod<[Principal], [] | [UserState]>,
  'admin_getUserAllocations' : ActorMethod<[], Array<[Principal, UserState]>>,
  'admin_recalculateAllVotingPower' : ActorMethod<[bigint], undefined>,
  'admin_removePenalizedNeuron' : ActorMethod<
    [Uint8Array | number[]],
    Result_16
  >,
  'admin_setPenalizedNeurons' : ActorMethod<
    [Array<[Uint8Array | number[], bigint]>],
    Result_15
  >,
  'clearLogs' : ActorMethod<[], undefined>,
  'deleteToken' : ActorMethod<[Principal, string], Result_1>,
  'followAllocation' : ActorMethod<[Principal], Result_6>,
  'getActiveDecisionMakers' : ActorMethod<
    [],
    Array<[Uint8Array | number[], Array<Principal>]>
  >,
  'getAdminActionsSince' : ActorMethod<[bigint, bigint], Result_14>,
  'getAdminPermissions' : ActorMethod<
    [],
    Array<[Principal, Array<AdminPermission>]>
  >,
  'getAggregateAllocation' : ActorMethod<[], Array<[Principal, bigint]>>,
  'getAllNeuronOwners' : ActorMethod<
    [],
    Array<[Uint8Array | number[], Array<Principal>]>
  >,
  'getAllocationChangesSince' : ActorMethod<[bigint, bigint], Result_13>,
  'getAllocationStats' : ActorMethod<[], AllocationStats>,
  'getBackfillStatus' : ActorMethod<
    [],
    {
      'neuronsChecked' : bigint,
      'totalNeuronsWithAllocations' : bigint,
      'neuronsToBackfill' : bigint,
      'lastRunTime' : bigint,
      'lastResult' : [] | [
        { 'skipped' : bigint, 'errors' : bigint, 'archived' : bigint }
      ],
      'isRunning' : boolean,
    }
  >,
  'getBannedWords' : ActorMethod<[], Result_12>,
  'getFollowActionsSince' : ActorMethod<[bigint, bigint], Result_11>,
  'getFollowersWithNeuronCounts' : ActorMethod<[], Array<[Principal, bigint]>>,
  'getHistoricBalanceAndAllocation' : ActorMethod<
    [bigint],
    Array<[bigint, HistoricBalanceAllocation]>
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  'getNeuronAllocation' : ActorMethod<
    [Uint8Array | number[]],
    [] | [NeuronAllocation]
  >,
  'getNeuronAllocationChangesSince' : ActorMethod<[bigint, bigint], Result_10>,
  'getNeuronAllocations' : ActorMethod<
    [bigint, bigint],
    {
      'total' : bigint,
      'hasMore' : boolean,
      'neurons' : Array<[Uint8Array | number[], NeuronAllocation]>,
    }
  >,
  'getNeuronUpdatesSince' : ActorMethod<[bigint, bigint], Result_9>,
  'getPenalizedNeurons' : ActorMethod<
    [],
    Array<[Uint8Array | number[], bigint]>
  >,
  'getPenalizedNeuronsCount' : ActorMethod<[], bigint>,
  'getSnapshotInfo' : ActorMethod<
    [],
    [] | [
      {
        'totalVotingPower' : bigint,
        'lastSnapshotTime' : bigint,
        'lastSnapshotId' : bigint,
      }
    ]
  >,
  'getSystemParameters' : ActorMethod<[], Array<SystemParameter>>,
  'getTokenDetails' : ActorMethod<[], Array<[Principal, TokenDetails]>>,
  'getTokenDetailsWithoutPastPrices' : ActorMethod<
    [],
    Array<PublicTokenDetailsEntry>
  >,
  'getUserAllocation' : ActorMethod<[], [] | [UserState]>,
  'getUserNeurons' : ActorMethod<[Principal], Array<NeuronVP>>,
  'getUserRegisteredTokens' : ActorMethod<[], Array<Principal>>,
  'getUsersFollowerInfo' : ActorMethod<[Array<Principal>], Array<FollowerInfo>>,
  'getVotingPowerChangesSince' : ActorMethod<[bigint, bigint], Result_8>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  'grantAdminPermission' : ActorMethod<
    [Principal, AdminFunction, bigint],
    Result_1
  >,
  'hasAdminPermission' : ActorMethod<[Principal, AdminFunction], boolean>,
  'pauseToken' : ActorMethod<[Principal, string], Result_1>,
  'refreshUserVotingPower' : ActorMethod<[], Result_7>,
  'registerUserToken' : ActorMethod<[Principal], Result_3>,
  'removeAdmin' : ActorMethod<[Principal, [] | [string]], Result_1>,
  'removeBannedWords' : ActorMethod<[Array<string>], Result_1>,
  'removeFollower' : ActorMethod<[Principal], Result_6>,
  'removeToken' : ActorMethod<[Principal, string], Result_1>,
  'setTacoAddress' : ActorMethod<[Principal], undefined>,
  'set_sns_governance_canister_id' : ActorMethod<[Principal], undefined>,
  'syncTokenDetailsFromTreasury' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
    Result_5
  >,
  'unfollowAllocation' : ActorMethod<[Principal], Result_4>,
  'unpauseToken' : ActorMethod<[Principal, string], Result_1>,
  'unregisterUserToken' : ActorMethod<[Principal], Result_3>,
  'updateAllocation' : ActorMethod<
    [Array<Allocation>, [] | [string]],
    Result_2
  >,
  /**
   * / * Update Minting Vault configuration
   * /  *
   * /  * Allows configuration of premium rates, update intervals, and enabling/disabling swapping
   * /  * Only callable by admins with the updateMintingVaultConfig permission.
   */
  'updateMintingVaultConfig' : ActorMethod<[UpdateConfig__1], Result_1>,
  'updateSpamParameters' : ActorMethod<
    [
      {
        'timeWindowSpamCheck' : [] | [bigint],
        'allowedCalls' : [] | [bigint],
        'allowedSilentWarnings' : [] | [bigint],
      },
    ],
    Result_1
  >,
  'updateSystemParameter' : ActorMethod<
    [SystemParameter, [] | [string]],
    Result_1
  >,
  'updateSystemState' : ActorMethod<[SystemState, string], Result_1>,
  /**
   * / * Update treasury rebalance configuration
   * /  *
   * /  * Allows configuration of trading intervals, sizes, and safety limits
   * /  * Only callable by admins with the updateTreasuryConfig permission.
   */
  'updateTreasuryConfig' : ActorMethod<
    [UpdateConfig, [] | [boolean], [] | [string]],
    Result_1
  >,
  'votingPowerMetrics' : ActorMethod<[], Result>,
}
export interface FollowActionsSinceResponse {
  'totalCount' : bigint,
  'unfollows' : Array<UnfollowRecord>,
  'follows' : Array<FollowRecord>,
}
export type FollowError = { 'FollowLimitReached' : null } |
  { 'FollowerNoAllocationYetMade' : null } |
  { 'NotAllowed' : null } |
  { 'AlreadyFollowing' : null } |
  { 'FollowerNotFound' : null } |
  { 'FollowUnfollowLimitReached' : null } |
  { 'NotAdmin' : null } |
  { 'FolloweeNotFound' : null } |
  { 'FolloweeIsSelf' : null } |
  { 'UnexpectedError' : string } |
  { 'FolloweeLimitReached' : null } |
  { 'FolloweeNoAllocationYetMade' : null } |
  { 'SystemInactive' : null };
export interface FollowRecord {
  'followed' : Principal,
  'follower' : Principal,
  'since' : bigint,
}
export interface FollowerInfo {
  'canBeFollowed' : boolean,
  'followerCount' : bigint,
}
export interface HistoricBalanceAllocation {
  'allocations' : Array<[Principal, bigint]>,
  'totalWorthInICP' : bigint,
  'totalWorthInUSD' : number,
  'balances' : Array<[Principal, bigint]>,
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
export interface NeuronAllocation {
  'votingPower' : bigint,
  'lastUpdate' : bigint,
  'lastAllocationMaker' : Principal,
  'allocations' : Array<Allocation>,
}
export interface NeuronAllocationChangeRecord {
  'maker' : Principal,
  'oldAllocations' : Array<Allocation>,
  'changeType' : AllocationChangeType,
  'votingPower' : bigint,
  'newAllocations' : Array<Allocation>,
  'timestamp' : bigint,
  'neuronId' : Uint8Array | number[],
  'penaltyMultiplier' : [] | [bigint],
  'reason' : [] | [string],
}
export interface NeuronAllocationChangesSinceResponse {
  'totalCount' : bigint,
  'changes' : Array<NeuronAllocationChangeRecord>,
}
export interface NeuronRecord {
  'votingPower' : bigint,
  'users' : Array<Principal>,
  'neuronId' : Uint8Array | number[],
}
export interface NeuronUpdatesSinceResponse {
  'totalCount' : bigint,
  'neurons' : Array<NeuronRecord>,
}
export interface NeuronVP {
  'votingPower' : bigint,
  'neuronId' : Uint8Array | number[],
}
export interface PastAllocationRecord {
  'to' : bigint,
  'from' : bigint,
  'user' : Principal,
  'allocation' : Array<Allocation>,
  'allocationMaker' : Principal,
}
export interface PricePoint {
  'usdPrice' : number,
  'time' : bigint,
  'icpPrice' : bigint,
}
export interface PublicTokenDetails {
  'lastTimeSynced' : bigint,
  'balance' : bigint,
  'isPaused' : boolean,
  'Active' : boolean,
  'epochAdded' : bigint,
  'priceInICP' : bigint,
  'priceInUSD' : number,
  'tokenTransferFee' : bigint,
  'tokenDecimals' : bigint,
  'tokenSymbol' : string,
  'tokenName' : string,
  'pausedDueToSyncFailure' : boolean,
  'tokenType' : TokenType,
}
export type PublicTokenDetailsEntry = [Principal, PublicTokenDetails];
export type RefreshError = { 'NotAllowed' : null } |
  { 'NoNeuronsFound' : null } |
  { 'SnsGovernanceError' : string } |
  { 'UnexpectedError' : string } |
  { 'SystemInactive' : null };
export type Result = {
    'ok' : {
      'principalCount' : bigint,
      'totalVotingPower' : bigint,
      'allocatedVotingPower' : bigint,
      'totalVotingPowerByHotkeySetters' : bigint,
      'neuronCount' : bigint,
    }
  } |
  { 'err' : AuthorizationError };
export type Result_1 = { 'ok' : string } |
  { 'err' : AuthorizationError };
export type Result_10 = { 'ok' : NeuronAllocationChangesSinceResponse } |
  { 'err' : AuthorizationError };
export type Result_11 = { 'ok' : FollowActionsSinceResponse } |
  { 'err' : AuthorizationError };
export type Result_12 = { 'ok' : Array<string> } |
  { 'err' : AuthorizationError };
export type Result_13 = { 'ok' : AllocationChangesSinceResponse } |
  { 'err' : AuthorizationError };
export type Result_14 = { 'ok' : AdminActionsSinceResponse } |
  { 'err' : AuthorizationError };
export type Result_15 = { 'ok' : bigint } |
  { 'err' : AuthorizationError };
export type Result_16 = { 'ok' : boolean } |
  { 'err' : AuthorizationError };
export type Result_17 = { 'ok' : TestDataResult } |
  { 'err' : string };
export type Result_18 = { 'ok' : BackfillResult } |
  { 'err' : AuthorizationError };
export type Result_19 = {
    'ok' : { 'skipped' : bigint, 'errors' : bigint, 'archived' : bigint }
  } |
  { 'err' : AuthorizationError };
export type Result_2 = { 'ok' : string } |
  { 'err' : UpdateError };
export type Result_20 = { 'ok' : null } |
  { 'err' : AuthorizationError };
export type Result_3 = { 'ok' : string } |
  { 'err' : TokenRegistrationError };
export type Result_4 = { 'ok' : string } |
  { 'err' : UnfollowError };
export type Result_5 = { 'ok' : string } |
  { 'err' : SyncError };
export type Result_6 = { 'ok' : string } |
  { 'err' : FollowError };
export type Result_7 = {
    'ok' : {
      'aggregateUpdated' : boolean,
      'oldVotingPower' : bigint,
      'neuronsUpdated' : bigint,
      'newVotingPower' : bigint,
    }
  } |
  { 'err' : RefreshError };
export type Result_8 = { 'ok' : VotingPowerChangesSinceResponse } |
  { 'err' : AuthorizationError };
export type Result_9 = { 'ok' : NeuronUpdatesSinceResponse } |
  { 'err' : AuthorizationError };
export type SyncError = { 'NotTreasury' : null } |
  { 'UnexpectedError' : string };
export type SystemParameter = { 'MaxFollowers' : bigint } |
  { 'MaxAllocationsPerDay' : bigint } |
  { 'MaxTotalUpdates' : bigint } |
  { 'MaxPastAllocations' : bigint } |
  { 'SnapshotInterval' : bigint } |
  { 'FollowDepth' : bigint } |
  { 'MaxFollowed' : bigint } |
  { 'LogAdmin' : Principal } |
  { 'AllocationWindow' : bigint } |
  { 'MaxFollowUnfollowActionsPerDay' : bigint };
export type SystemState = { 'Paused' : null } |
  { 'Active' : null } |
  { 'Emergency' : null };
export interface TestDataConfig {
  'allocationFrequencyDays' : bigint,
  'priceFrequencyDays' : bigint,
  'daysBack' : bigint,
}
export interface TestDataResult {
  'neuronsProcessed' : bigint,
  'tokensProcessed' : bigint,
  'errors' : Array<string>,
  'allocationsCreated' : bigint,
  'pricesCreated' : bigint,
}
export interface TokenDetails {
  'lastTimeSynced' : bigint,
  'balance' : bigint,
  'isPaused' : boolean,
  'Active' : boolean,
  'epochAdded' : bigint,
  'priceInICP' : bigint,
  'priceInUSD' : number,
  'tokenTransferFee' : bigint,
  'tokenDecimals' : bigint,
  'pastPrices' : Array<PricePoint>,
  'tokenSymbol' : string,
  'tokenName' : string,
  'pausedDueToSyncFailure' : boolean,
  'tokenType' : TokenType,
}
export type TokenRegistrationError = { 'TokenAlreadyRegistered' : null } |
  { 'NotAllowed' : null } |
  { 'TokenNotFound' : null } |
  { 'TokenNotRegistered' : null } |
  { 'UnexpectedError' : string } |
  { 'MaxTokensReached' : null } |
  { 'SystemInactive' : null };
export type TokenType = { 'ICP' : null } |
  { 'ICRC3' : null } |
  { 'ICRC12' : null };
export type UnfollowError = { 'NotAllowed' : null } |
  { 'FollowerNotFound' : null } |
  { 'FollowUnfollowLimitReached' : null } |
  { 'NotAdmin' : null } |
  { 'FolloweeNotFound' : null } |
  { 'FolloweeIsSelf' : null } |
  { 'UnexpectedError' : string } |
  { 'AlreadyUnfollowing' : null } |
  { 'SystemInactive' : null };
export interface UnfollowRecord {
  'followed' : Principal,
  'follower' : Principal,
  'until' : bigint,
}
export interface UpdateConfig {
  'maxPriceHistoryEntries' : [] | [bigint],
  'priceUpdateIntervalNS' : [] | [bigint],
  'tokenSyncTimeoutNS' : [] | [bigint],
  'maxSlippageBasisPoints' : [] | [bigint],
  'shortSyncIntervalNS' : [] | [bigint],
  'rebalanceIntervalNS' : [] | [bigint],
  'maxTradesStored' : [] | [bigint],
  'maxTradeValueICP' : [] | [bigint],
  'minTradeValueICP' : [] | [bigint],
  'minAllocationDiffBasisPoints' : [] | [bigint],
  'portfolioRebalancePeriodNS' : [] | [bigint],
  'longSyncIntervalNS' : [] | [bigint],
  'maxTradeAttemptsPerInterval' : [] | [bigint],
  'maxKongswapAttempts' : [] | [bigint],
}
export interface UpdateConfig__1 {
  'balanceUpdateInterval' : [] | [bigint],
  'maxSlippageBasisPoints' : [] | [bigint],
  'blockCleanupInterval' : [] | [bigint],
  'minSwapValueUSD' : [] | [number],
  'PRICE_HISTORY_WINDOW' : [] | [bigint],
  'maxPremium' : [] | [number],
  'swappingEnabled' : [] | [boolean],
  'minPremium' : [] | [number],
}
export type UpdateError = { 'NotAllowed' : null } |
  { 'UnexpectedError' : string } |
  { 'InvalidAllocation' : null } |
  { 'NoVotingPower' : null } |
  { 'SystemInactive' : null };
export interface UserState {
  'lastVotingPowerUpdate' : bigint,
  'votingPower' : bigint,
  'allocationFollows' : Array<{ 'since' : bigint, 'follow' : Principal }>,
  'lastAllocationMaker' : Principal,
  'allocationFollowedBy' : Array<{ 'since' : bigint, 'follow' : Principal }>,
  'followUnfollowActions' : Array<bigint>,
  'pastAllocations' : Array<
    {
      'to' : bigint,
      'from' : bigint,
      'note' : [] | [string],
      'allocation' : Array<Allocation>,
      'allocationMaker' : Principal,
    }
  >,
  'allocations' : Array<Allocation>,
  'lastAllocationUpdate' : bigint,
  'neurons' : Array<NeuronVP>,
}
export interface UserVotingPowerRecord {
  'lastVotingPowerUpdate' : bigint,
  'votingPower' : bigint,
  'user' : Principal,
  'neurons' : Array<NeuronVP>,
}
export interface VotingPowerChangesSinceResponse {
  'totalCount' : bigint,
  'users' : Array<UserVotingPowerRecord>,
}
export interface _SERVICE extends ContinuousDAO {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
