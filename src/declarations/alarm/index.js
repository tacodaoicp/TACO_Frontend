import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './alarm.did.js';

export const canisterId = process.env.CANISTER_ID_ALARM || 'b2cwp-6qaaa-aaaad-qhn6a-cai';

export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({
    ...options.agentOptions,
    host: process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app',
  });

  if (process.env.DFX_NETWORK !== 'ic') {
    agent.fetchRootKey().catch((err) => {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    });
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};

export const alarm = createActor(canisterId);
export * from './alarm.did.js';