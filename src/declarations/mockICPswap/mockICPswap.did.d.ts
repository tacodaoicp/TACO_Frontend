import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface DepositArgs {
  'fee' : bigint,
  'token' : string,
  'amount' : bigint,
}
export interface GetPoolArgs {
  'fee' : bigint,
  'token0' : Token,
  'token1' : Token,
}
export interface ICPSwapBalance { 'balance0' : bigint, 'balance1' : bigint }
export interface PoolData {
  'fee' : bigint,
  'key' : string,
  'tickSpacing' : bigint,
  'token0' : Token,
  'token1' : Token,
  'canisterId' : Principal,
}
export interface PoolMetadata {
  'fee' : bigint,
  'key' : string,
  'sqrtPriceX96' : bigint,
  'tick' : bigint,
  'liquidity' : bigint,
  'token0' : Token,
  'token1' : Token,
  'maxLiquidityPerTick' : bigint,
  'nextPositionId' : bigint,
}
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : PoolMetadata } |
  { 'err' : string };
export type Result_2 = { 'ok' : ICPSwapBalance } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<PoolData> } |
  { 'err' : string };
export type Result_4 = { 'ok' : PoolData } |
  { 'err' : string };
export interface SwapArgs {
  'amountIn' : string,
  'zeroForOne' : boolean,
  'amountOutMinimum' : string,
}
export interface Token { 'address' : string, 'standard' : string }
export interface WithdrawArgs {
  'fee' : bigint,
  'token' : string,
  'amount' : bigint,
}
export interface _SERVICE {
  'addPool' : ActorMethod<
    [Principal, Principal, Principal, number, bigint],
    undefined
  >,
  'deposit2' : ActorMethod<[Principal, DepositArgs], Result>,
  'getAllPoolMetadata' : ActorMethod<[], Array<[Principal, PoolMetadata]>>,
  'getPool' : ActorMethod<[GetPoolArgs], Result_4>,
  'getPoolByPair' : ActorMethod<[Principal, Principal], [] | [Principal]>,
  'getPools' : ActorMethod<[], { 'ok' : Array<PoolData> } | { 'err' : string }>,
  'getPoolsByCanister' : ActorMethod<[Principal], Result_3>,
  'getUserUnusedBalance' : ActorMethod<[Principal], Result_2>,
  'initializeMockPools' : ActorMethod<[], undefined>,
  'metadata' : ActorMethod<[], Result_1>,
  'metadata2' : ActorMethod<[Principal], Result_1>,
  'quote' : ActorMethod<[SwapArgs], Result>,
  'quote2' : ActorMethod<[SwapArgs, Principal], Result>,
  'swap' : ActorMethod<[SwapArgs], Result>,
  'swap2' : ActorMethod<[Principal, SwapArgs], Result>,
  'updatePoolMetadata' : ActorMethod<[Principal, bigint, bigint], undefined>,
  'withdraw' : ActorMethod<[WithdrawArgs], Result>,
  'withdraw2' : ActorMethod<[Principal, WithdrawArgs], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
