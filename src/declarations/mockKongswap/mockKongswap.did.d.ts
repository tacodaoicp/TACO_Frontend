import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ICTokenReply {
  'fee' : bigint,
  'decimals' : number,
  'token_id' : number,
  'chain' : string,
  'name' : string,
  'canister_id' : string,
  'icrc1' : boolean,
  'icrc2' : boolean,
  'icrc3' : boolean,
  'is_removed' : boolean,
  'symbol' : string,
}
export interface ICTransferReply {
  'is_send' : boolean,
  'block_index' : bigint,
  'chain' : string,
  'canister_id' : string,
  'amount' : bigint,
  'symbol' : string,
}
export interface KongSwapArgs {
  'receive_token' : string,
  'max_slippage' : [] | [number],
  'pay_amount' : bigint,
  'referred_by' : [] | [Principal],
  'receive_amount' : [] | [bigint],
  'receive_address' : [] | [Principal],
  'pay_token' : string,
  'pay_tx_id' : [] | [TxId],
}
export interface KongSwapArgs__1 {
  'receive_token' : string,
  'max_slippage' : [] | [number],
  'pay_amount' : bigint,
  'referred_by' : [] | [Principal],
  'receive_amount' : [] | [bigint],
  'receive_address' : [] | [Principal],
  'pay_token' : string,
  'pay_tx_id' : [] | [TxId],
}
export interface LPTokenReply {
  'fee' : bigint,
  'decimals' : number,
  'token_id' : number,
  'chain' : string,
  'name' : string,
  'address' : string,
  'pool_id_of' : number,
  'is_removed' : boolean,
  'total_supply' : bigint,
  'symbol' : string,
}
export interface PoolReply {
  'tvl' : bigint,
  'lp_token_symbol' : string,
  'name' : string,
  'lp_fee_0' : bigint,
  'lp_fee_1' : bigint,
  'balance_0' : bigint,
  'balance_1' : bigint,
  'rolling_24h_volume' : bigint,
  'rolling_24h_apy' : number,
  'address_0' : string,
  'address_1' : string,
  'rolling_24h_num_swaps' : bigint,
  'symbol_0' : string,
  'symbol_1' : string,
  'pool_id' : number,
  'price' : number,
  'chain_0' : string,
  'chain_1' : string,
  'is_removed' : boolean,
  'symbol' : string,
  'rolling_24h_lp_fee' : bigint,
  'lp_fee_bps' : number,
}
export interface PoolsReply {
  'total_24h_lp_fee' : bigint,
  'total_tvl' : bigint,
  'total_24h_volume' : bigint,
  'pools' : Array<PoolReply>,
  'total_24h_num_swaps' : bigint,
}
export type RequestReply = { 'AddLiquidity' : null } |
  { 'Swap' : SwapReply } |
  { 'AddPool' : null } |
  { 'RemoveLiquidity' : null } |
  { 'Pending' : null };
export type RequestRequest = { 'AddLiquidity' : null } |
  { 'Swap' : KongSwapArgs__1 } |
  { 'AddPool' : null } |
  { 'RemoveLiquidity' : null };
export interface RequestsReply {
  'ts' : bigint,
  'request_id' : bigint,
  'request' : RequestRequest,
  'statuses' : Array<string>,
  'reply' : RequestReply,
}
export interface SwapAmountsReply {
  'txs' : Array<SwapAmountsTxReply>,
  'receive_chain' : string,
  'mid_price' : number,
  'pay_amount' : bigint,
  'receive_amount' : bigint,
  'pay_symbol' : string,
  'receive_symbol' : string,
  'receive_address' : string,
  'pay_address' : string,
  'price' : number,
  'pay_chain' : string,
  'slippage' : number,
}
export interface SwapAmountsTxReply {
  'receive_chain' : string,
  'pay_amount' : bigint,
  'receive_amount' : bigint,
  'pay_symbol' : string,
  'receive_symbol' : string,
  'receive_address' : string,
  'pool_symbol' : string,
  'pay_address' : string,
  'price' : number,
  'pay_chain' : string,
  'lp_fee' : bigint,
  'gas_fee' : bigint,
}
export interface SwapReply {
  'ts' : bigint,
  'txs' : Array<SwapTxReply>,
  'request_id' : bigint,
  'status' : string,
  'tx_id' : bigint,
  'transfer_ids' : Array<TransferIdReply>,
  'receive_chain' : string,
  'mid_price' : number,
  'pay_amount' : bigint,
  'receive_amount' : bigint,
  'claim_ids' : BigUint64Array | bigint[],
  'pay_symbol' : string,
  'receive_symbol' : string,
  'receive_address' : string,
  'pay_address' : string,
  'price' : number,
  'pay_chain' : string,
  'slippage' : number,
}
export interface SwapTxReply {
  'ts' : bigint,
  'receive_chain' : string,
  'pay_amount' : bigint,
  'receive_amount' : bigint,
  'pay_symbol' : string,
  'receive_symbol' : string,
  'receive_address' : string,
  'pool_symbol' : string,
  'pay_address' : string,
  'price' : number,
  'pay_chain' : string,
  'lp_fee' : bigint,
  'gas_fee' : bigint,
}
export type TokenReply = { 'IC' : ICTokenReply } |
  { 'LP' : LPTokenReply };
export interface TransferIdReply {
  'transfer_id' : bigint,
  'transfer' : TransferReply,
}
export type TransferReply = { 'IC' : ICTransferReply };
export type TxId = { 'TransactionId' : string } |
  { 'BlockIndex' : bigint };
export interface _SERVICE {
  'initializeMockData' : ActorMethod<[], undefined>,
  'pools' : ActorMethod<
    [[] | [string]],
    { 'Ok' : PoolsReply } |
      { 'Err' : string }
  >,
  'requests' : ActorMethod<
    [[] | [bigint]],
    { 'Ok' : Array<RequestsReply> } |
      { 'Err' : string }
  >,
  'swap' : ActorMethod<
    [KongSwapArgs__1],
    { 'Ok' : SwapReply } |
      { 'Err' : string }
  >,
  'swap_amounts' : ActorMethod<
    [string, bigint, string],
    { 'Ok' : SwapAmountsReply } |
      { 'Err' : string }
  >,
  'swap_async' : ActorMethod<
    [KongSwapArgs],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'tokens' : ActorMethod<
    [[] | [string]],
    { 'Ok' : Array<TokenReply> } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
