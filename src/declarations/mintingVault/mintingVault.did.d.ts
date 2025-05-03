import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

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
export interface PricePoint {
  'usdPrice' : number,
  'time' : bigint,
  'icpPrice' : bigint,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : SyncError };
export type Result_2 = { 'ok' : SwapResult } |
  { 'err' : string };
export type Result_3 = { 'ok' : string } |
  { 'err' : string };
export type Result_4 = {
    'ok' : {
      'tacoPrice' : bigint,
      'premium' : number,
      'tokenPrice' : bigint,
      'maxAcceptedAmount' : bigint,
      'estimatedTacoAmount' : bigint,
    }
  } |
  { 'err' : string };
export type SwapError = { 'InvalidBlock' : null } |
  { 'InvalidAmount' : null } |
  { 'TransferError' : null } |
  { 'InvalidPrice' : null } |
  { 'BlockAlreadyProcessed' : null } |
  { 'InsufficientBalance' : null } |
  { 'SwapAlreadyRunning' : null } |
  { 'UnexpectedError' : string } |
  { 'TokenNotTrusted' : null };
export interface SwapResult {
  'returnedSentAmount' : bigint,
  'blockNumber' : bigint,
  'wantedTokenAddress' : string,
  'error' : [] | [SwapError],
  'sentTokenAddress' : string,
  'usedSentAmount' : bigint,
  'success' : boolean,
  'returnedWantedAmount' : bigint,
  'swappedAmount' : bigint,
}
export type SyncError = { 'NotDAO' : null } |
  { 'UnexpectedError' : string };
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
export interface UpdateConfig {
  'balanceUpdateInterval' : [] | [bigint],
  'maxSlippageBasisPoints' : [] | [bigint],
  'blockCleanupInterval' : [] | [bigint],
  'minSwapValueUSD' : [] | [number],
  'PRICE_HISTORY_WINDOW' : [] | [bigint],
  'maxPremium' : [] | [number],
  'swappingEnabled' : [] | [boolean],
  'minPremium' : [] | [number],
}
export interface _SERVICE {
  'clearLogs' : ActorMethod<[], undefined>,
  'estimateSwapAmount' : ActorMethod<[Principal, bigint], Result_4>,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getLogsByContext' : ActorMethod<[string, bigint], Array<LogEntry>>,
  'getLogsByLevel' : ActorMethod<[LogLevel, bigint], Array<LogEntry>>,
  'getVaultStatus' : ActorMethod<
    [],
    {
      'currentAllocations' : Array<[Principal, bigint]>,
      'totalValueICP' : bigint,
      'tokenDetails' : Array<[Principal, TokenDetails]>,
      'premiumRange' : { 'max' : number, 'min' : number },
      'targetAllocations' : Array<[Principal, bigint]>,
      'exchangeRates' : Array<[Principal, number]>,
    }
  >,
  'recoverWronglySentTokens' : ActorMethod<[Principal, bigint], Result_3>,
  'setLogAdmin' : ActorMethod<[Principal], undefined>,
  'setSnsGovernanceCanisterId' : ActorMethod<[Principal], undefined>,
  'setTest' : ActorMethod<[boolean], undefined>,
  'swapTokenForTaco' : ActorMethod<[Principal, bigint, bigint], Result_2>,
  'syncTokenDetailsFromDAO' : ActorMethod<
    [Array<[Principal, TokenDetails]>],
    Result_1
  >,
  'updateConfiguration' : ActorMethod<[UpdateConfig], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
