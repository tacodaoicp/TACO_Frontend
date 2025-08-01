import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AdminFunction = { 'removeToken' : null } |
  { 'setTest' : null } |
  { 'startRebalancing' : null } |
  { 'getLogs' : null } |
  { 'removeAdmin' : null } |
  { 'stopToken' : null } |
  { 'unpauseToken' : null } |
  { 'updateSystemParameter' : null } |
  { 'updateTreasuryConfig' : null } |
  { 'updateSpamParameters' : null } |
  { 'addToken' : null } |
  { 'addAdmin' : null } |
  { 'stopRebalancing' : null } |
  { 'recoverPoolBalances' : null } |
  { 'setTacoAddress' : null } |
  { 'clearLogs' : null } |
  { 'createAuction' : null } |
  { 'updateMintingVaultConfig' : null } |
  { 'pauseToken' : null } |
  { 'updateSystemState' : null } |
  { 'endAuctionPanic' : null };
export interface AdminPermission {
  'function' : AdminFunction,
  'expiresAt' : bigint,
  'grantedBy' : Principal,
}
export interface Allocation { 'token' : Principal, 'basisPoints' : bigint }
export type AuthorizationError = { 'NotAllowed' : null } |
  { 'NotAdmin' : null } |
  { 'UnexpectedError' : string };
export interface ContinuousDAO {
  'addAdmin' : ActorMethod<[Principal], Result_1>,
  'addToken' : ActorMethod<[Principal, TokenType], Result_1>,
  'admin_getNeuronAllocations' : ActorMethod<
    [],
    Array<[Uint8Array | number[], NeuronAllocation]>
  >,
  'admin_getUserAllocation' : ActorMethod<[Principal], [] | [UserState]>,
  'admin_getUserAllocations' : ActorMethod<[], Array<[Principal, UserState]>>,
  'admin_recalculateAllVotingPower' : ActorMethod<[bigint], undefined>,
  'clearLogs' : ActorMethod<[], undefined>,
  'followAllocation' : ActorMethod<[Principal], Result_5>,
  'getAdminPermissions' : ActorMethod<
    [],
    Array<[Principal, Array<AdminPermission>]>
  >,
  'getAggregateAllocation' : ActorMethod<[], Array<[Principal, bigint]>>,
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
  'getUserAllocation' : ActorMethod<[], [] | [UserState]>,
  'grantAdminPermission' : ActorMethod<
    [Principal, AdminFunction, bigint],
    Result_1
  >,
  'hasAdminPermission' : ActorMethod<[Principal, AdminFunction], boolean>,
  'pauseToken' : ActorMethod<[Principal], Result_1>,
  'refreshUserVotingPower' : ActorMethod<[], Result_6>,
  'removeAdmin' : ActorMethod<[Principal], Result_1>,
  'removeFollower' : ActorMethod<[Principal], Result_5>,
  'removeToken' : ActorMethod<[Principal], Result_1>,
  'setTacoAddress' : ActorMethod<[Principal], undefined>,
  'set_sns_governance_canister_id' : ActorMethod<[Principal], undefined>,
  'syncTokenDetailsFromTreasury' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
    Result_4
  >,
  'unfollowAllocation' : ActorMethod<[Principal], Result_3>,
  'unpauseToken' : ActorMethod<[Principal], Result_1>,
  'updateAllocation' : ActorMethod<[Array<Allocation>], Result_2>,
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
  'updateSystemParameter' : ActorMethod<[SystemParameter], Result_1>,
  'updateSystemState' : ActorMethod<[SystemState], Result_1>,
  'updateTreasuryConfig' : ActorMethod<
    [UpdateConfig, [] | [boolean]],
    Result_1
  >,
  'votingPowerMetrics' : ActorMethod<[], Result>,
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
export interface NeuronVP {
  'votingPower' : bigint,
  'neuronId' : Uint8Array | number[],
}
export interface PricePoint {
  'usdPrice' : number,
  'time' : bigint,
  'icpPrice' : bigint,
}
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
export type Result_2 = { 'ok' : string } |
  { 'err' : UpdateError };
export type Result_3 = { 'ok' : string } |
  { 'err' : UnfollowError };
export type Result_4 = { 'ok' : string } |
  { 'err' : SyncError };
export type Result_5 = { 'ok' : string } |
  { 'err' : FollowError };
export type Result_6 = {
    'ok' : {
      'aggregateUpdated' : boolean,
      'oldVotingPower' : bigint,
      'neuronsUpdated' : bigint,
      'newVotingPower' : bigint,
    }
  } |
  { 'err' : RefreshError };
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
      'allocation' : Array<Allocation>,
      'allocationMaker' : Principal,
    }
  >,
  'allocations' : Array<Allocation>,
  'lastAllocationUpdate' : bigint,
  'neurons' : Array<NeuronVP>,
}
export interface _SERVICE extends ContinuousDAO {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
