import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AdminAction = { 'Pause' : null } |
  { 'DiscoverPool' : null } |
  { 'Unpause' : null } |
  { 'UpdateConfig' : null } |
  { 'RecoverFunds' : null } |
  { 'RetryPending' : null } |
  { 'SetPoolId' : null };
export interface AdminActionRecord {
  'action' : AdminAction,
  'timestamp' : bigint,
  'details' : string,
  'caller' : Principal,
  'success' : boolean,
}
export type ClaimPath = { 'TimerSweep' : null } |
  { 'ManualClaim' : null } |
  { 'FrontendClaim' : null } |
  { 'WebhookClaim' : null } |
  { 'CoinbaseWebhook' : null };
export type ClaimResult = {
    'BelowMinimum' : { 'balance' : bigint, 'minimum' : bigint }
  } |
  { 'AlreadyProcessing' : null } |
  { 'NoDeposit' : null } |
  { 'SwapFailed' : string } |
  { 'NotAuthorized' : null } |
  {
    'Success' : { 'tacoAmount' : bigint, 'txId' : bigint, 'orderId' : bigint }
  } |
  { 'SystemPaused' : null } |
  { 'RateLimited' : null };
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'upgrade' : [] | [boolean],
  'status_code' : number,
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
export type NachosClaimResult = {
    'BelowMinimum' : { 'balance' : bigint, 'minimum' : bigint }
  } |
  { 'AlreadyProcessing' : null } |
  { 'NoDeposit' : null } |
  { 'NotAuthorized' : null } |
  {
    'Success' : {
      'mintId' : bigint,
      'orderId' : bigint,
      'nachosAmount' : bigint,
    }
  } |
  { 'SystemPaused' : null } |
  { 'RateLimited' : null } |
  { 'MintFailed' : string };
export interface NachosOrderRecord {
  'id' : bigint,
  'principal' : Principal,
  'nachosMintId' : [] | [bigint],
  'feeICP' : bigint,
  'claimPath' : ClaimPath,
  'icpDeposited' : bigint,
  'timestamp' : bigint,
  'fiatAmount' : [] | [string],
  'nachosReceived' : bigint,
  'navUsed' : bigint,
  'fiatCurrency' : [] | [string],
}
export interface NachosPendingSwap {
  'principal' : Principal,
  'blockNumber' : [] | [bigint],
  'createdAt' : bigint,
  'errorMessage' : [] | [string],
  'attempts' : bigint,
  'stage' : NachosSwapStage,
  'icpAmount' : bigint,
  'lastAttempt' : bigint,
}
export type NachosQuoteResult = {
    'Ok' : {
      'estimatedNachos' : bigint,
      'feeEstimate' : bigint,
      'navUsed' : bigint,
    }
  } |
  { 'Err' : string };
export interface NachosSwapProgress {
  'startedAt' : bigint,
  'estimatedNachos' : [] | [bigint],
  'errorMessage' : [] | [string],
  'step' : NachosSwapStep,
  'mintId' : [] | [bigint],
  'description' : string,
  'orderId' : [] | [bigint],
  'updatedAt' : bigint,
  'retryCount' : bigint,
  'totalSteps' : bigint,
  'stepNumber' : bigint,
  'actualNachos' : [] | [bigint],
  'icpAmount' : [] | [bigint],
}
export type NachosSwapStage = { 'TransferredToTreasury' : bigint } |
  { 'MintRequested' : bigint } |
  { 'AwaitingDeposit' : bigint };
export type NachosSwapStep = { 'Failed' : null } |
  { 'Complete' : null } |
  { 'DepositReceived' : null } |
  { 'MintingNachos' : null } |
  { 'TransferringToTreasury' : null } |
  { 'NotStarted' : null };
export interface OrderRecord {
  'id' : bigint,
  'transakOrderId' : [] | [string],
  'principal' : Principal,
  'tacoReceived' : bigint,
  'tacoTxId' : [] | [bigint],
  'claimPath' : ClaimPath,
  'icpDeposited' : bigint,
  'timestamp' : bigint,
  'fiatAmount' : [] | [string],
  'fiatCurrency' : [] | [string],
  'poolId' : Principal,
  'slippage' : number,
}
export interface PendingSwap {
  'principal' : Principal,
  'createdAt' : bigint,
  'errorMessage' : [] | [string],
  'attempts' : bigint,
  'stage' : SwapStage,
  'icpAmount' : bigint,
  'lastAttempt' : bigint,
}
export type QuoteResult = {
    'Ok' : {
      'icpFee' : bigint,
      'estimatedTaco' : bigint,
      'tacoFee' : bigint,
      'slippage' : number,
    }
  } |
  { 'Err' : string };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Principal } |
  { 'err' : string };
export interface SwapConfig {
  'minDepositICP' : [] | [bigint],
  'maxSlippageBasisPoints' : [] | [bigint],
  'maxRetries' : [] | [bigint],
  'systemPaused' : [] | [boolean],
  'sweepIntervalNS' : [] | [bigint],
}
export interface SwapProgress {
  'startedAt' : bigint,
  'errorMessage' : [] | [string],
  'step' : SwapStep,
  'txId' : [] | [bigint],
  'description' : string,
  'orderId' : [] | [bigint],
  'updatedAt' : bigint,
  'retryCount' : bigint,
  'totalSteps' : bigint,
  'actualTaco' : [] | [bigint],
  'stepNumber' : bigint,
  'estimatedTaco' : [] | [bigint],
  'icpAmount' : [] | [bigint],
}
export type SwapStage = { 'SwapCompleted' : bigint } |
  { 'WithdrawnToSubaccount' : bigint } |
  { 'TransferredToPool' : bigint } |
  { 'DepositRegistered' : bigint } |
  { 'AwaitingDeposit' : bigint };
export interface SwapStats {
  'totalSwapsCompleted' : bigint,
  'pendingSwapsCount' : bigint,
  'poolConfigured' : boolean,
  'systemPaused' : boolean,
  'completedOrdersCount' : bigint,
  'totalICPSwapped' : bigint,
  'totalTACODelivered' : bigint,
}
export type SwapStep = { 'Failed' : null } |
  { 'TransferringToWallet' : null } |
  { 'GettingQuote' : null } |
  { 'Complete' : null } |
  { 'DepositReceived' : null } |
  { 'SwappingTokens' : null } |
  { 'TransferringToPool' : null } |
  { 'WaitingForDeposit' : null } |
  { 'NotStarted' : null };
export interface TacoSwapDAO {
  'admin_clear_nachos_pending' : ActorMethod<[Principal], Result>,
  'admin_clear_pending' : ActorMethod<[Principal], Result>,
  'admin_transfer_icp' : ActorMethod<
    [Principal, [] | [Uint8Array | number[]], bigint],
    Result_1
  >,
  'admin_transfer_taco' : ActorMethod<[Principal, bigint], Result_1>,
  'claim_nachos' : ActorMethod<
    [bigint, [] | [string], [] | [string]],
    NachosClaimResult
  >,
  'claim_taco' : ActorMethod<[[] | [string], [] | [string]], ClaimResult>,
  'discover_pool' : ActorMethod<[], Result_2>,
  'get_admin_actions' : ActorMethod<[bigint], Array<AdminActionRecord>>,
  'get_all_nachos_swap_progress' : ActorMethod<
    [],
    Array<[Principal, NachosSwapProgress]>
  >,
  'get_all_swap_progress' : ActorMethod<[], Array<[Principal, SwapProgress]>>,
  'get_canister_cycles' : ActorMethod<[], bigint>,
  'get_config' : ActorMethod<
    [],
    {
      'minDepositICP' : bigint,
      'maxSlippageBasisPoints' : bigint,
      'maxRetries' : bigint,
      'icpTacoPoolId' : [] | [Principal],
      'tacoLedgerFee' : bigint,
      'poolZeroForOne' : boolean,
      'systemPaused' : boolean,
      'sweepIntervalNS' : bigint,
    }
  >,
  'get_deposit_address' : ActorMethod<[], string>,
  'get_deposit_address_for' : ActorMethod<[[] | [Principal]], string>,
  'get_full_swap_state' : ActorMethod<
    [],
    {
      'hasActiveLock' : boolean,
      'nachosDepositSubaccount' : Uint8Array | number[],
      'tacoDepositSubaccount' : Uint8Array | number[],
      'hasPendingNachos' : boolean,
      'tacoStatus' : SwapProgress,
      'hasPendingTaco' : boolean,
      'nachosStatus' : NachosSwapProgress,
    }
  >,
  'get_logs' : ActorMethod<[bigint, [] | [string]], Array<LogEntry>>,
  'get_my_nachos_orders' : ActorMethod<[bigint], Array<NachosOrderRecord>>,
  'get_my_orders' : ActorMethod<[bigint], Array<OrderRecord>>,
  'get_nachos_deposit_address_for' : ActorMethod<[[] | [Principal]], string>,
  'get_nachos_order_history' : ActorMethod<
    [bigint, bigint],
    Array<NachosOrderRecord>
  >,
  'get_nachos_pending_swaps' : ActorMethod<
    [],
    Array<[Principal, NachosPendingSwap]>
  >,
  'get_nachos_quote' : ActorMethod<[bigint], NachosQuoteResult>,
  'get_nachos_stats' : ActorMethod<
    [],
    {
      'nachosMintingEnabled' : boolean,
      'nachosPendingCount' : bigint,
      'totalNachosMints' : bigint,
      'totalNachosICPDeposited' : bigint,
      'nachosOrdersCount' : bigint,
      'totalNachosDelivered' : bigint,
    }
  >,
  'get_nachos_swap_status' : ActorMethod<[], NachosSwapProgress>,
  'get_order_history' : ActorMethod<[bigint, bigint], Array<OrderRecord>>,
  'get_pending_balance' : ActorMethod<[], bigint>,
  'get_pending_nachos_balance' : ActorMethod<[], bigint>,
  'get_pending_swaps' : ActorMethod<[], Array<[Principal, PendingSwap]>>,
  'get_processed_coinbase_orders' : ActorMethod<[], Array<[string, bigint]>>,
  'get_processed_transak_orders' : ActorMethod<[], Array<[string, bigint]>>,
  'get_stats' : ActorMethod<[], SwapStats>,
  'get_swap_status' : ActorMethod<[], SwapProgress>,
  'get_taco_quote' : ActorMethod<[bigint], QuoteResult>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'http_request_update' : ActorMethod<[HttpRequest], HttpResponse>,
  'pause' : ActorMethod<[string], Result>,
  'recover_icpswap_balances' : ActorMethod<[], Result>,
  'recover_stuck_funds' : ActorMethod<[Principal], Result_1>,
  'refund_nachos_pending' : ActorMethod<[Principal], Result_1>,
  'refund_pending' : ActorMethod<[Principal], Result_1>,
  'register_payment' : ActorMethod<
    [[] | [bigint]],
    { 'Ok' : null } |
      { 'AlreadyProcessing' : null } |
      { 'NotAuthorized' : null }
  >,
  'retry_pending_swaps' : ActorMethod<[], Result_1>,
  'set_nachos_minting_enabled' : ActorMethod<[boolean], Result>,
  'set_pool_id' : ActorMethod<[Principal, boolean], Result>,
  'unpause' : ActorMethod<[string], Result>,
  'update_config' : ActorMethod<[SwapConfig], Result>,
}
export interface _SERVICE extends TacoSwapDAO {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
