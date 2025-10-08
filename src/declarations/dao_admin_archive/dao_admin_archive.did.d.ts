import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AdminActionBlockData {
  'id' : bigint,
  'admin' : Principal,
  'errorMessage' : [] | [string],
  'actionType' : AdminActionVariant,
  'canister' : AdminCanisterSource,
  'timestamp' : bigint,
  'success' : boolean,
  'reason' : string,
}
export type AdminActionVariant = { 'StopRebalancing' : null } |
  {
    'TokenAdd' : {
      'token' : Principal,
      'viaGovernance' : boolean,
      'tokenType' : TokenType,
    }
  } |
  {
    'UpdatePortfolioCircuitBreaker' : {
      'newCondition' : string,
      'conditionId' : bigint,
      'oldCondition' : string,
    }
  } |
  { 'AdminAdd' : { 'newAdmin' : Principal } } |
  { 'ClearAllTradingPauses' : null } |
  { 'UnpauseToken' : { 'token' : Principal } } |
  { 'ExecuteTradingCycle' : null } |
  { 'PauseTokenManual' : { 'token' : Principal, 'pauseType' : string } } |
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
  {
    'SetPortfolioCircuitBreakerActive' : {
      'conditionId' : bigint,
      'isActive' : boolean,
    }
  } |
  { 'StartRebalancing' : null } |
  { 'AdminRemove' : { 'removedAdmin' : Principal } } |
  {
    'SystemStateChange' : { 'oldState' : SystemState, 'newState' : SystemState }
  } |
  { 'SetTestMode' : { 'isTestMode' : boolean } } |
  { 'ClearPortfolioCircuitBreakerLogs' : null } |
  {
    'AddPortfolioCircuitBreaker' : {
      'conditionId' : bigint,
      'conditionType' : string,
      'details' : string,
    }
  } |
  {
    'ParameterUpdate' : {
      'oldValue' : string,
      'parameter' : SystemParameter,
      'newValue' : string,
    }
  } |
  {
    'UpdateTriggerCondition' : {
      'newCondition' : string,
      'conditionId' : bigint,
      'oldCondition' : string,
    }
  } |
  { 'TokenRemove' : { 'token' : Principal } } |
  { 'RemoveTriggerCondition' : { 'conditionId' : bigint } } |
  { 'TakeManualSnapshot' : null } |
  {
    'UpdatePausedTokenThreshold' : {
      'newThreshold' : bigint,
      'oldThreshold' : bigint,
    }
  } |
  { 'UpdateRebalanceConfig' : { 'newConfig' : string, 'oldConfig' : string } } |
  { 'StartPortfolioSnapshots' : null } |
  {
    'UpdatePortfolioSnapshotInterval' : {
      'newIntervalNS' : bigint,
      'oldIntervalNS' : bigint,
    }
  } |
  { 'StopPortfolioSnapshots' : null } |
  {
    'AddTriggerCondition' : {
      'conditionId' : bigint,
      'conditionType' : string,
      'details' : string,
    }
  } |
  { 'RemovePortfolioCircuitBreaker' : { 'conditionId' : bigint } } |
  {
    'SetTriggerConditionActive' : {
      'conditionId' : bigint,
      'isActive' : boolean,
    }
  } |
  {
    'UpdateMaxPortfolioSnapshots' : { 'oldLimit' : bigint, 'newLimit' : bigint }
  } |
  { 'ResetRebalanceState' : null } |
  { 'ClearSystemLogs' : null } |
  { 'ClearPriceAlerts' : null } |
  { 'TokenDelete' : { 'token' : Principal } } |
  { 'CanisterStop' : null };
export type AdminCanisterSource = { 'DAO_backend' : null } |
  { 'Treasury' : null };
export type ArchiveError = { 'StorageFull' : null } |
  { 'SystemError' : string } |
  { 'NotAuthorized' : null } |
  { 'InvalidData' : null } |
  { 'BlockNotFound' : null } |
  { 'InvalidBlockType' : null } |
  { 'InvalidTimeRange' : null };
export interface ArchiveStatus {
  'supportedBlockTypes' : Array<string>,
  'newestBlock' : [] | [bigint],
  'storageUsed' : bigint,
  'oldestBlock' : [] | [bigint],
  'totalBlocks' : bigint,
  'lastArchiveTime' : bigint,
}
export interface ArchivedBlock {
  'args' : GetBlocksArgs,
  'callback' : [Principal, string],
}
export interface Block { 'id' : bigint, 'block' : Value }
export interface BlockType { 'url' : string, 'block_type' : string }
export interface DAOAdminArchive {
  'archiveAdminAction' : ActorMethod<[AdminActionBlockData], Result_3>,
  'getAdminActionsByAdmin' : ActorMethod<[Principal, bigint], Result_2>,
  'getAdminActionsByCanister' : ActorMethod<
    [AdminCanisterSource, bigint],
    Result_2
  >,
  'getArchiveStats' : ActorMethod<[], ArchiveStatus>,
  'getArchiveStatus' : ActorMethod<[], Result_1>,
  'getBatchImportStatus' : ActorMethod<
    [],
    { 'intervalSeconds' : bigint, 'isRunning' : boolean }
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getTimerStatus' : ActorMethod<[], TimerStatus>,
  'get_canister_cycles' : ActorMethod<[], { 'cycles' : bigint }>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'importDAOAdminActions' : ActorMethod<[], Result>,
  'importTreasuryAdminActions' : ActorMethod<[], Result>,
  'resetImportTimestamps' : ActorMethod<[], Result>,
  'runManualBatchImport' : ActorMethod<[], Result>,
  'setMaxInnerLoopIterations' : ActorMethod<[bigint], Result>,
  'startBatchImportSystem' : ActorMethod<[], Result>,
  'stopAllTimers' : ActorMethod<[], Result>,
  'stopBatchImportSystem' : ActorMethod<[], Result>,
}
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export interface GetArchivesArgs { 'from' : [] | [Principal] }
export type GetArchivesResult = Array<
  { 'end' : bigint, 'canister_id' : Principal, 'start' : bigint }
>;
export type GetBlocksArgs = Array<{ 'start' : bigint, 'length' : bigint }>;
export interface GetBlocksResult {
  'log_length' : bigint,
  'blocks' : Array<Block>,
  'archived_blocks' : Array<ArchivedBlock>,
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
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : ArchiveStatus } |
  { 'err' : ArchiveError };
export type Result_2 = { 'ok' : Array<AdminActionBlockData> } |
  { 'err' : ArchiveError };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : ArchiveError };
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
export interface TimerStatus {
  'innerLoopRunning' : boolean,
  'middleLoopCurrentState' : string,
  'middleLoopStartTime' : bigint,
  'outerLoopLastRun' : bigint,
  'outerLoopRunning' : boolean,
  'innerLoopCurrentType' : string,
  'innerLoopCurrentBatch' : bigint,
  'middleLoopTotalRuns' : bigint,
  'outerLoopIntervalSeconds' : bigint,
  'innerLoopStartTime' : bigint,
  'middleLoopNextScheduled' : bigint,
  'outerLoopTotalRuns' : bigint,
  'middleLoopLastRun' : bigint,
  'middleLoopRunning' : boolean,
  'innerLoopLastRun' : bigint,
  'innerLoopNextScheduled' : bigint,
  'innerLoopTotalBatches' : bigint,
}
export type TokenType = { 'ICP' : null } |
  { 'ICRC3' : null } |
  { 'ICRC12' : null };
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export interface _SERVICE extends DAOAdminArchive {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
