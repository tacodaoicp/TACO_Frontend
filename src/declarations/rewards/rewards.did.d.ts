import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface PerformanceResult {
  'startTime' : bigint,
  'endTime' : bigint,
  'user' : Principal,
  'finalValue' : number,
  'allocationChanges' : bigint,
  'initialValue' : number,
}
export type PriceType = { 'ICP' : null } |
  { 'USD' : null };
export type Result = { 'ok' : PerformanceResult } |
  { 'err' : RewardsError };
export interface Rewards {
  'calculateUserPerformance' : ActorMethod<
    [Principal, bigint, bigint, PriceType],
    Result
  >,
  'getCanisterStatus' : ActorMethod<
    [],
    {
      'allocationArchiveId' : Principal,
      'priceArchiveId' : Principal,
      'environment' : string,
    }
  >,
}
export type RewardsError = { 'AllocationDataMissing' : null } |
  { 'SystemError' : string } |
  { 'PriceDataMissing' : { 'token' : Principal, 'timestamp' : bigint } } |
  { 'InvalidTimeRange' : null } |
  { 'UserNotFound' : null };
export interface _SERVICE extends Rewards {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
