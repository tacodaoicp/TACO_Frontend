/**
 * Worker Client - Interface to ICP Query Worker
 *
 * Provides a simple API to offload heavy ICP query calls to a Web Worker.
 * This prevents the main thread from freezing during IDL decoding.
 */

type WorkerRequest = {
  id: string;
  type: 'query';
  canisterType: 'treasury' | 'dao';
  canisterId: string;
  methodName: string;
  args: any[];
  host?: string;
  isDevelopment?: boolean;
};

type WorkerResponse = {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
};

class ICPWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (data: any) => void;
    reject: (error: Error) => void;
  }>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create worker
      this.worker = new Worker(
        new URL('../workers/icpQueryWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const receiveStart = performance.now();
        const response = event.data;
        const pending = this.pendingRequests.get(response.id);

        if (pending) {
          if (response.success) {
            console.log(`📦 [WORKER CLIENT] Received result for ${response.id} at ${receiveStart.toFixed(2)}ms`);

            // Analyze received data
            const dataAnalysisStart = performance.now();
            let dataSize = 0;
            try {
              dataSize = JSON.stringify(response.data, (_, v) => typeof v === 'bigint' ? v.toString() : v).length;
            } catch (e) {
              console.warn(`⚠️ [WORKER CLIENT] Could not measure data size:`, e);
            }
            const dataItemCount = Array.isArray(response.data) ? response.data.length : 'N/A';
            const dataAnalysisEnd = performance.now();

            console.log(`📊 [WORKER CLIENT] Received data analysis:`);
            console.log(`  - Type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
            console.log(`  - Item count: ${dataItemCount}`);
            if (dataSize > 0) {
              console.log(`  - JSON size: ${(dataSize / 1024).toFixed(2)} KB (${dataSize.toLocaleString()} bytes)`);
            }
            console.log(`  - Analysis took: ${(dataAnalysisEnd - dataAnalysisStart).toFixed(2)}ms`);
            console.log(`  - Total receive handling: ${(performance.now() - receiveStart).toFixed(2)}ms`);

            pending.resolve(response.data);
          } else {
            console.error(`❌ [WORKER CLIENT] Request ${response.id} failed:`, response.error);
            pending.reject(new Error(response.error || 'Unknown worker error'));
          }
          this.pendingRequests.delete(response.id);
        }
      });

      // Handle worker errors
      this.worker.addEventListener('error', (error) => {
        console.error('❌ [WORKER CLIENT] Worker error:', error);
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
          reject(new Error('Worker encountered an error'));
        });
        this.pendingRequests.clear();
      });

      console.log('✅ [WORKER CLIENT] Worker initialized');
    } catch (error) {
      console.error('❌ [WORKER CLIENT] Failed to initialize worker:', error);
    }
  }

  /**
   * Call a query method on a canister via the worker
   */
  async query<T = any>(
    canisterType: 'treasury' | 'dao',
    canisterId: string,
    methodName: string,
    args: any[] = [],
    host?: string
  ): Promise<T> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!canisterId) {
      throw new Error('Canister ID is required');
    }

    const requestId = `req_${++this.requestCounter}_${Date.now()}`;

    console.log(`📤 [WORKER CLIENT] Sending request ${requestId}: ${canisterType}.${methodName}`);
    console.log(`📤 [WORKER CLIENT] Canister ID:`, canisterId);

    // Check if in development mode
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

    const request: WorkerRequest = {
      id: requestId,
      type: 'query',
      canisterType,
      canisterId,
      methodName,
      args,
      host,
      isDevelopment,
    };

    // Create promise that will be resolved when worker responds
    const promise = new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Set timeout (2 minutes max)
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Worker request ${requestId} timed out`));
        }
      }, 120000);
    });

    // Send request to worker
    this.worker.postMessage(request);

    return promise;
  }

  /**
   * Terminate the worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
      console.log('🛑 [WORKER CLIENT] Worker terminated');
    }
  }
}

// Singleton instance
let workerClient: ICPWorkerClient | null = null;

export function getWorkerClient(): ICPWorkerClient {
  if (!workerClient) {
    workerClient = new ICPWorkerClient();
  }
  return workerClient;
}

export function terminateWorkerClient() {
  if (workerClient) {
    workerClient.terminate();
    workerClient = null;
  }
}
