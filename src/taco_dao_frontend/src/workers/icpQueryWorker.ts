/**
 * Web Worker for ICP Query Calls
 *
 * This worker runs in a separate thread to prevent IDL decoding from blocking the main UI thread.
 * Heavy operations like decoding 100+ token details happen here without freezing the page.
 */

import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Import IDL factories
import { idlFactory as treasuryIDL } from '../../../declarations/treasury/treasury.did.js';
import { idlFactory as daoIDL } from '../../../declarations/dao_backend/DAO_backend.did.js';

// Message types
interface WorkerRequest {
  id: string;
  type: 'query';
  canisterType: 'treasury' | 'dao';
  canisterId: string;
  methodName: string;
  args: any[];
  host?: string;
  isDevelopment?: boolean; // Pass from main thread
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Create agent (shared for all calls)
let agent: HttpAgent | null = null;

async function getAgent(host?: string, isDevelopment?: boolean): Promise<HttpAgent> {
  if (!agent) {
    const agentHost = host || 'https://ic0.app';

    console.log(`🔧 [WORKER] Creating agent with host: ${agentHost}`);

    agent = await HttpAgent.create({ host: agentHost });

    // Fetch root key in development (passed from main thread)
    if (isDevelopment) {
      console.log(`🔧 [WORKER] Fetching root key for development...`);
      await agent.fetchRootKey().catch(err => {
        console.warn('🔧 [WORKER] Unable to fetch root key:', err);
      });
    }
  }
  return agent;
}

// Get IDL factory based on canister type
function getIDLFactory(canisterType: string) {
  switch (canisterType) {
    case 'treasury':
      return treasuryIDL;
    case 'dao':
      return daoIDL;
    default:
      throw new Error(`Unknown canister type: ${canisterType}`);
  }
}

// Handle incoming messages
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const startTime = performance.now();

  console.log(`🔧 [WORKER] Received request ${request.id}: ${request.canisterType}.${request.methodName}`);
  console.log(`🔧 [WORKER] Canister ID:`, request.canisterId);

  try {
    // Validate request
    if (!request.canisterId) {
      throw new Error('Canister ID is required');
    }

    // Get agent
    const agentInstance = await getAgent(request.host, request.isDevelopment);

    // Create actor
    const idlFactory = getIDLFactory(request.canisterType);

    console.log(`🔧 [WORKER] Creating actor with IDL factory...`);

    const actor = Actor.createActor(idlFactory, {
      agent: agentInstance,
      canisterId: Principal.fromText(request.canisterId),
    });

    console.log(`🔧 [WORKER] Actor created successfully`);

    // Call method
    const methodStart = performance.now();
    console.log(`🔧 [WORKER] Calling ${request.methodName}...`);

    // @ts-ignore - dynamic method call
    const result = await actor[request.methodName](...request.args);

    const methodEnd = performance.now();
    console.log(`✅ [WORKER] ${request.methodName} completed in ${(methodEnd - methodStart).toFixed(2)}ms`);

    // Analyze result size and structure
    const resultAnalysisStart = performance.now();
    let resultSize = 0;
    try {
      resultSize = JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v).length;
    } catch (e) {
      console.warn(`⚠️ [WORKER] Could not measure result size:`, e);
    }
    const resultItemCount = Array.isArray(result) ? result.length : 'N/A';
    const resultAnalysisEnd = performance.now();

    console.log(`📊 [WORKER] Result analysis:`);
    console.log(`  - Type: ${Array.isArray(result) ? 'Array' : typeof result}`);
    console.log(`  - Item count: ${resultItemCount}`);
    if (resultSize > 0) {
      console.log(`  - JSON size: ${(resultSize / 1024).toFixed(2)} KB (${resultSize.toLocaleString()} bytes)`);
    }
    console.log(`  - Analysis took: ${(resultAnalysisEnd - resultAnalysisStart).toFixed(2)}ms`);

    // Send result back to main thread
    const serializationStart = performance.now();
    const response: WorkerResponse = {
      id: request.id,
      success: true,
      data: result,
    };

    self.postMessage(response);
    const serializationEnd = performance.now();

    const totalTime = performance.now() - startTime;
    console.log(`📤 [WORKER] postMessage serialization took: ${(serializationEnd - serializationStart).toFixed(2)}ms`);
    console.log(`🎉 [WORKER] Request ${request.id} completed in ${totalTime.toFixed(2)}ms`);
  } catch (error) {
    console.error(`❌ [WORKER] Request ${request.id} failed:`, error);

    const response: WorkerResponse = {
      id: request.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(response);
  }
});

console.log('🔧 [WORKER] ICP Query Worker initialized');
