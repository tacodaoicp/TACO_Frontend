import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Subaccount = Uint8Array | number[];
export type TransferRecipient = { 'principal' : Principal } |
  { 'accountId' : { 'owner' : Principal, 'subaccount' : [] | [Subaccount] } };
export interface treasury {
  'drainTransferQueue' : ActorMethod<[], undefined>,
  'getAcceptedtokens' : ActorMethod<[Array<string>], undefined>,
  'getPendingTransferCount' : ActorMethod<[], bigint>,
  'getTokenInfo' : ActorMethod<
    [],
    Array<
      [
        string,
        {
          'Symbol' : string,
          'Name' : string,
          'TransferFee' : bigint,
          'Decimals' : bigint,
        },
      ]
    >
  >,
  'receiveTransferTasks' : ActorMethod<
    [Array<[TransferRecipient, bigint, string]>],
    boolean
  >,
  'setOTCCanister' : ActorMethod<[string], undefined>,
  'setTest' : ActorMethod<[boolean], undefined>,
}
export interface _SERVICE extends treasury {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
