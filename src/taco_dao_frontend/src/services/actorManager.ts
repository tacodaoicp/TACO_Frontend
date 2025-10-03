/**
 * Actor Manager - Singleton ICP Actor Instances
 *
 * Manages singleton instances of ICP canister actors to prevent duplicate
 * actor creation and ensure consistent identity usage across the application.
 */

import { Actor, HttpAgent, AnonymousIdentity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import type { ActorSubclass, Identity } from "@dfinity/agent";
import type { _SERVICE as AlarmService } from "../../../declarations/alarm/alarm.did";
import type { _SERVICE as DaoService } from "../../../declarations/dao_backend/DAO_backend.did";
import type { _SERVICE as TreasuryService } from "../../../declarations/treasury/treasury.did";
import type { _SERVICE as NeuronSnapshotService } from "../../../declarations/neuronSnapshot/neuronSnapshot.did";
import type { _SERVICE as SneedForumService } from "../../../declarations/sneed_sns_forum/sneed_sns_forum.did";
import type { _SERVICE as AppSneedDaoService } from "../../../declarations/app_sneeddao_backend/app_sneeddao_backend.did";
import { idlFactory as alarmIdlFactory } from "../../../declarations/alarm/alarm.did.js";
import { idlFactory as daoIdlFactory } from "../../../declarations/dao_backend/DAO_backend.did.js";
import { idlFactory as treasuryIdlFactory } from "../../../declarations/treasury/treasury.did.js";
import { idlFactory as neuronSnapshotIdlFactory } from "../../../declarations/neuronSnapshot/neuronSnapshot.did.js";
import { idlFactory as sneedForumIdlFactory } from "../../../declarations/sneed_sns_forum/sneed_sns_forum.did.js";
import { idlFactory as appSneedDaoIdlFactory } from "../../../declarations/app_sneeddao_backend/app_sneeddao_backend.did.js";
import { idlFactory as snsGovernanceIdlFactory } from "../../../declarations/sns_governance/sns_governance.did.js";
import { idlFactory as icrc1IdlFactory } from "../../../declarations/ledger_canister/ledger_canister.did.js";

// Canister ID helpers - matches taco.store.ts pattern
const alarmCanisterId = (): string => {
  switch (process.env.DFX_NETWORK) {
    case "ic":
      return process.env.CANISTER_ID_ALARM_IC || 'b2cwp-6qaaa-aaaad-qhn6a-cai';
    case "staging":
      return process.env.CANISTER_ID_ALARM_STAGING || 'b2cwp-6qaaa-aaaad-qhn6a-cai';
  }
  return 'b2cwp-6qaaa-aaaad-qhn6a-cai'; // local fallback
};

const daoBackendCanisterId = (): string => {
  switch (process.env.DFX_NETWORK) {
    case "ic":
      return process.env.CANISTER_ID_DAO_BACKEND_IC || 'vxqw7-iqaaa-aaaan-qzziq-cai';
    case "staging":
      return process.env.CANISTER_ID_DAO_BACKEND_STAGING || 'tisou-7aaaa-aaaai-atiea-cai';
  }
  return 'tisou-7aaaa-aaaai-atiea-cai'; // local fallback to staging
};

const treasuryCanisterId = (): string => {
  switch (process.env.DFX_NETWORK) {
    case "ic":
      return process.env.CANISTER_ID_TREASURY_IC || 'v6t5d-6yaaa-aaaan-qzzja-cai';
    case "staging":
      return process.env.CANISTER_ID_TREASURY_STAGING || 'tptia-syaaa-aaaai-atieq-cai';
  }
  return 'tptia-syaaa-aaaai-atieq-cai'; // local fallback to staging
};

const neuronSnapshotCanisterId = (): string => {
  switch (process.env.DFX_NETWORK) {
    case "ic":
      return process.env.CANISTER_ID_NEURONSNAPSHOT_IC || 'mcigm-4aaaa-aaaad-qhlkq-cai';
    case "staging":
      return process.env.CANISTER_ID_NEURONSNAPSHOT_STAGING || 'mcigm-4aaaa-aaaad-qhlkq-cai';
  }
  return 'mcigm-4aaaa-aaaad-qhlkq-cai'; // local fallback
};

const sneedForumCanisterId = (): string => {
  switch (process.env.DFX_NETWORK) {
    case "ic":
      return process.env.CANISTER_ID_NEURONSNAPSHOT_IC || 'mcigm-4aaaa-aaaad-qhlkq-cai';
    case "staging":
      return process.env.CANISTER_ID_NEURONSNAPSHOT_STAGING || 'mcigm-4aaaa-aaaad-qhlkq-cai';
  }
  return 'mcigm-4aaaa-aaaad-qhlkq-cai'; // local fallback
};

const appSneedDaoCanisterId = (): string => {
  switch (process.env.DFX_NETWORK) {
    case "ic":
      return process.env.CANISTER_ID_APP_SNEEDDAO_BACKEND_IC || 'g7s5u-tqaaa-aaaad-qhktq-cai';
    case "staging":
      return process.env.CANISTER_ID_APP_SNEEDDAO_BACKEND_STAGING || 'g7s5u-tqaaa-aaaad-qhktq-cai';
  }
  return 'g7s5u-tqaaa-aaaad-qhktq-cai'; // local fallback
};

const tacoSnsGovernanceCanisterId = (): string => {
  // TACO DAO SNS governance canister ID (same across all networks)
  return 'lhdfz-wqaaa-aaaaq-aae3q-cai';
};

/**
 * Actor Manager Class
 * Singleton pattern for managing ICP actor instances
 */
class ActorManager {
  private static instance: ActorManager;

  // Cached authenticated actor instances
  private alarmActor: ActorSubclass<AlarmService> | null = null;
  private daoActor: ActorSubclass<DaoService> | null = null;
  private treasuryActor: ActorSubclass<TreasuryService> | null = null;
  private neuronSnapshotActor: ActorSubclass<NeuronSnapshotService> | null = null;
  private sneedForumActor: ActorSubclass<SneedForumService> | null = null;
  private appSneedDaoActor: ActorSubclass<AppSneedDaoService> | null = null;
  private snsGovernanceActor: ActorSubclass<any> | null = null;

  // Cached anonymous actor instances (for public calls)
  private anonymousAlarmActor: ActorSubclass<AlarmService> | null = null;
  private anonymousDaoActor: ActorSubclass<DaoService> | null = null;
  private anonymousTreasuryActor: ActorSubclass<TreasuryService> | null = null;
  private anonymousNeuronSnapshotActor: ActorSubclass<NeuronSnapshotService> | null = null;
  private anonymousSneedForumActor: ActorSubclass<SneedForumService> | null = null;
  private anonymousAppSneedDaoActor: ActorSubclass<AppSneedDaoService> | null = null;
  private anonymousSnsGovernanceActor: ActorSubclass<any> | null = null;

  // Cache for ICRC1 actors (keyed by canister ID)
  private icrc1Actors: Map<string, ActorSubclass<any>> = new Map();
  private anonymousIcrc1Actors: Map<string, ActorSubclass<any>> = new Map();

  // Cached agents
  private agent: HttpAgent | null = null;
  private anonymousAgent: HttpAgent | null = null;
  private authClient: AuthClient | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ActorManager {
    if (!ActorManager.instance) {
      ActorManager.instance = new ActorManager();
    }
    return ActorManager.instance;
  }

  /**
   * Initialize the agent and auth client
   */
  private async initializeAgent(authClient?: AuthClient): Promise<HttpAgent> {
    // If authClient is provided, use it (allows using shared authClient from stores)
    if (authClient) {
      this.authClient = authClient;
    }

    // Get auth client if not provided
    if (!this.authClient) {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: true
        }
      });
    }

    // Get identity
    const identity = this.authClient.getIdentity();

    // Create agent
    const host = process.env.DFX_NETWORK === "local"
      ? "http://localhost:4943"
      : "https://ic0.app";

    this.agent = await HttpAgent.create({
      identity,
      host,
      // Critical: Set fetch timeout to prevent hanging
      fetchOptions: {
        timeout: 10000, // 10 second timeout for all ICP calls
      },
    });

    // Fetch root key for local development
    if (process.env.DFX_NETWORK === "local") {
      await this.agent.fetchRootKey();
    }

    return this.agent;
  }

  /**
   * Initialize anonymous agent (for public calls)
   */
  private async initializeAnonymousAgent(): Promise<HttpAgent> {
    if (this.anonymousAgent) {
      return this.anonymousAgent;
    }

    const host = process.env.DFX_NETWORK === "local"
      ? "http://localhost:4943"
      : "https://ic0.app";

    this.anonymousAgent = await HttpAgent.create({
      identity: new AnonymousIdentity(),
      host,
      // Critical: Set fetch timeout to prevent hanging
      fetchOptions: {
        timeout: 10000, // 10 second timeout for all ICP calls
      },
    });

    // Fetch root key for local development
    if (process.env.DFX_NETWORK === "local") {
      await this.anonymousAgent.fetchRootKey();
    }

    return this.anonymousAgent;
  }

  /**
   * Get or create Alarm Actor (singleton)
   */
  async getAlarmActor(authClient?: AuthClient): Promise<ActorSubclass<AlarmService>> {
    // If authClient is provided, reset actors to use new identity
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.alarmActor) {
      return this.alarmActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.alarmActor = Actor.createActor(alarmIdlFactory, {
      agent,
      canisterId: alarmCanisterId(),
    });

    console.log('✅ Alarm actor created (singleton)');
    return this.alarmActor;
  }

  /**
   * Get or create DAO Actor (singleton)
   */
  async getDaoActor(authClient?: AuthClient): Promise<ActorSubclass<DaoService>> {
    // If authClient is provided, reset actors to use new identity
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.daoActor) {
      return this.daoActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.daoActor = Actor.createActor(daoIdlFactory, {
      agent,
      canisterId: daoBackendCanisterId(),
    });

    console.log('✅ DAO actor created (singleton)');
    return this.daoActor;
  }

  /**
   * Get or create Treasury Actor (singleton)
   */
  async getTreasuryActor(authClient?: AuthClient): Promise<ActorSubclass<TreasuryService>> {
    // If authClient is provided, reset actors to use new identity
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.treasuryActor) {
      return this.treasuryActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.treasuryActor = Actor.createActor(treasuryIdlFactory, {
      agent,
      canisterId: treasuryCanisterId(),
    });

    console.log('✅ Treasury actor created (singleton)');
    return this.treasuryActor;
  }

  /**
   * Get or create Anonymous DAO Actor (singleton) - for public calls
   */
  async getAnonymousDaoActor(): Promise<ActorSubclass<DaoService>> {
    if (this.anonymousDaoActor) {
      return this.anonymousDaoActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousDaoActor = Actor.createActor(daoIdlFactory, {
      agent,
      canisterId: daoBackendCanisterId(),
    });

    console.log('✅ Anonymous DAO actor created (singleton)');
    return this.anonymousDaoActor;
  }

  /**
   * Get or create Anonymous Treasury Actor (singleton) - for public calls
   */
  async getAnonymousTreasuryActor(): Promise<ActorSubclass<TreasuryService>> {
    if (this.anonymousTreasuryActor) {
      return this.anonymousTreasuryActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousTreasuryActor = Actor.createActor(treasuryIdlFactory, {
      agent,
      canisterId: treasuryCanisterId(),
    });

    console.log('✅ Anonymous Treasury actor created (singleton)');
    return this.anonymousTreasuryActor;
  }

  /**
   * Get or create Anonymous Alarm Actor (singleton) - for public calls
   */
  async getAnonymousAlarmActor(): Promise<ActorSubclass<AlarmService>> {
    if (this.anonymousAlarmActor) {
      return this.anonymousAlarmActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousAlarmActor = Actor.createActor(alarmIdlFactory, {
      agent,
      canisterId: alarmCanisterId(),
    });

    console.log('✅ Anonymous Alarm actor created (singleton)');
    return this.anonymousAlarmActor;
  }

  /**
   * Get or create NeuronSnapshot Actor (singleton)
   */
  async getNeuronSnapshotActor(authClient?: AuthClient): Promise<ActorSubclass<NeuronSnapshotService>> {
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.neuronSnapshotActor) {
      return this.neuronSnapshotActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.neuronSnapshotActor = Actor.createActor(neuronSnapshotIdlFactory, {
      agent,
      canisterId: neuronSnapshotCanisterId(),
    });

    console.log('✅ NeuronSnapshot actor created (singleton)');
    return this.neuronSnapshotActor;
  }

  /**
   * Get or create Anonymous NeuronSnapshot Actor (singleton)
   */
  async getAnonymousNeuronSnapshotActor(): Promise<ActorSubclass<NeuronSnapshotService>> {
    if (this.anonymousNeuronSnapshotActor) {
      return this.anonymousNeuronSnapshotActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousNeuronSnapshotActor = Actor.createActor(neuronSnapshotIdlFactory, {
      agent,
      canisterId: neuronSnapshotCanisterId(),
    });

    console.log('✅ Anonymous NeuronSnapshot actor created (singleton)');
    return this.anonymousNeuronSnapshotActor;
  }

  /**
   * Get or create SneedForum Actor (singleton)
   */
  async getSneedForumActor(authClient?: AuthClient): Promise<ActorSubclass<SneedForumService>> {
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.sneedForumActor) {
      return this.sneedForumActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.sneedForumActor = Actor.createActor(sneedForumIdlFactory, {
      agent,
      canisterId: sneedForumCanisterId(),
    });

    console.log('✅ SneedForum actor created (singleton)');
    return this.sneedForumActor;
  }

  /**
   * Get or create Anonymous SneedForum Actor (singleton)
   */
  async getAnonymousSneedForumActor(): Promise<ActorSubclass<SneedForumService>> {
    if (this.anonymousSneedForumActor) {
      return this.anonymousSneedForumActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousSneedForumActor = Actor.createActor(sneedForumIdlFactory, {
      agent,
      canisterId: sneedForumCanisterId(),
    });

    console.log('✅ Anonymous SneedForum actor created (singleton)');
    return this.anonymousSneedForumActor;
  }

  /**
   * Get or create AppSneedDao Actor (singleton)
   */
  async getAppSneedDaoActor(authClient?: AuthClient): Promise<ActorSubclass<AppSneedDaoService>> {
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.appSneedDaoActor) {
      return this.appSneedDaoActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.appSneedDaoActor = Actor.createActor(appSneedDaoIdlFactory, {
      agent,
      canisterId: appSneedDaoCanisterId(),
    });

    console.log('✅ AppSneedDao actor created (singleton)');
    return this.appSneedDaoActor;
  }

  /**
   * Get or create Anonymous AppSneedDao Actor (singleton)
   */
  async getAnonymousAppSneedDaoActor(): Promise<ActorSubclass<AppSneedDaoService>> {
    if (this.anonymousAppSneedDaoActor) {
      return this.anonymousAppSneedDaoActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousAppSneedDaoActor = Actor.createActor(appSneedDaoIdlFactory, {
      agent,
      canisterId: appSneedDaoCanisterId(),
    });

    console.log('✅ Anonymous AppSneedDao actor created (singleton)');
    return this.anonymousAppSneedDaoActor;
  }

  /**
   * Get or create SNS Governance Actor (singleton)
   */
  async getSnsGovernanceActor(authClient?: AuthClient): Promise<ActorSubclass<any>> {
    if (authClient) {
      this.resetActors();
      this.authClient = authClient;
    }

    if (this.snsGovernanceActor) {
      return this.snsGovernanceActor;
    }

    const agent = await this.initializeAgent(authClient);

    this.snsGovernanceActor = Actor.createActor(snsGovernanceIdlFactory, {
      agent,
      canisterId: tacoSnsGovernanceCanisterId(),
    });

    console.log('✅ SNS Governance actor created (singleton)');
    return this.snsGovernanceActor;
  }

  /**
   * Get or create Anonymous SNS Governance Actor (singleton)
   */
  async getAnonymousSnsGovernanceActor(): Promise<ActorSubclass<any>> {
    if (this.anonymousSnsGovernanceActor) {
      return this.anonymousSnsGovernanceActor;
    }

    const agent = await this.initializeAnonymousAgent();

    this.anonymousSnsGovernanceActor = Actor.createActor(snsGovernanceIdlFactory, {
      agent,
      canisterId: tacoSnsGovernanceCanisterId(),
    });

    console.log('✅ Anonymous SNS Governance actor created (singleton)');
    return this.anonymousSnsGovernanceActor;
  }

  /**
   * Get or create ICRC1 Actor for specific canister (cached by canister ID)
   */
  async getIcrc1Actor(canisterId: string, authClient?: AuthClient): Promise<ActorSubclass<any>> {
    if (authClient) {
      // If new authClient provided, clear cache and reinitialize
      this.icrc1Actors.clear();
      this.resetActors();
      this.authClient = authClient;
    }

    // Check cache
    if (this.icrc1Actors.has(canisterId)) {
      return this.icrc1Actors.get(canisterId)!;
    }

    const agent = await this.initializeAgent(authClient);

    const actor = Actor.createActor(icrc1IdlFactory, {
      agent,
      canisterId,
    });

    this.icrc1Actors.set(canisterId, actor);
    console.log(`✅ ICRC1 actor created for ${canisterId} (cached)`);
    return actor;
  }

  /**
   * Get or create Anonymous ICRC1 Actor for specific canister (cached by canister ID)
   */
  async getAnonymousIcrc1Actor(canisterId: string): Promise<ActorSubclass<any>> {
    // Check cache
    if (this.anonymousIcrc1Actors.has(canisterId)) {
      return this.anonymousIcrc1Actors.get(canisterId)!;
    }

    const agent = await this.initializeAnonymousAgent();

    const actor = Actor.createActor(icrc1IdlFactory, {
      agent,
      canisterId,
    });

    this.anonymousIcrc1Actors.set(canisterId, actor);
    console.log(`✅ Anonymous ICRC1 actor created for ${canisterId} (cached)`);
    return actor;
  }

  /**
   * Reset all actors (useful when identity changes)
   */
  resetActors(): void {
    this.alarmActor = null;
    this.daoActor = null;
    this.treasuryActor = null;
    this.neuronSnapshotActor = null;
    this.sneedForumActor = null;
    this.appSneedDaoActor = null;
    this.agent = null;
    console.log('🔄 All authenticated actors reset');
  }

  /**
   * Reset anonymous actors
   */
  resetAnonymousActors(): void {
    this.anonymousAlarmActor = null;
    this.anonymousDaoActor = null;
    this.anonymousTreasuryActor = null;
    this.anonymousNeuronSnapshotActor = null;
    this.anonymousSneedForumActor = null;
    this.anonymousAppSneedDaoActor = null;
    this.anonymousAgent = null;
    console.log('🔄 All anonymous actors reset');
  }

  /**
   * Update identity (e.g., after login/logout)
   */
  async updateIdentity(newAuthClient: AuthClient): Promise<void> {
    this.authClient = newAuthClient;
    this.resetActors();
    await this.initializeAgent();
    console.log('🔄 Identity updated, actors will be recreated on next use');
  }
}

// Export singleton instance
export const actorManager = ActorManager.getInstance();

// Export canister ID helper functions for use in other services (e.g., Web Workers)
export {
  alarmCanisterId,
  daoBackendCanisterId,
  treasuryCanisterId,
  neuronSnapshotCanisterId,
  sneedForumCanisterId,
  appSneedDaoCanisterId,
  tacoSnsGovernanceCanisterId,
};

// Export types for convenience
export type { AlarmService, DaoService, TreasuryService, NeuronSnapshotService, SneedForumService, AppSneedDaoService };
