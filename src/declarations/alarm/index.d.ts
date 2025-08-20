import type { Principal } from '@dfinity/principal';
import type { ActorSubclass } from '@dfinity/agent';
import type { _SERVICE } from './alarm.did';

export declare const canisterId: string;
export declare const createActor: (canisterId: string, options?: {
  agentOptions?: import('@dfinity/agent').HttpAgentOptions;
}) => ActorSubclass<_SERVICE>;
export declare const alarm: ActorSubclass<_SERVICE>;
export * from './alarm.did';