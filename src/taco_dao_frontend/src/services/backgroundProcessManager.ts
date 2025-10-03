/**
 * Background Process Manager
 *
 * Organizes and manages all background API calls and data fetching operations
 * based on user type and customer journey, with configurable refresh intervals.
 *
 * User Types:
 * - Guest: Not logged in users
 * - Member: Logged in users
 * - Admin: Admin users
 */

export type UserType = 'guest' | 'member' | 'admin';

export interface BackgroundProcess {
  id: string;
  name: string;
  priority: number; // 1 = highest, 5 = lowest
  execute: () => Promise<any>; // Can return any type, not just void
  refreshInterval?: number; // in milliseconds, undefined = no refresh
  userTypes: UserType[];
  runOnce?: boolean; // if true, only runs once per session
}

export class BackgroundProcessManager {
  private processes: Map<string, BackgroundProcess> = new Map();
  private runningIntervals: Map<string, NodeJS.Timeout> = new Map();
  private executedOnce: Set<string> = new Set();
  private isInitialized = false;

  /**
   * Register a background process
   */
  registerProcess(process: BackgroundProcess): void {
    this.processes.set(process.id, process);
  }

  /**
   * Start background processes for a specific user type
   */
  async startProcesses(userType: UserType): Promise<void> {
    console.log('🔍 Step 15: startProcesses called for user type:', userType)

    if (this.isInitialized) {
      console.log('⚡ Background processes already running');
      return;
    }

    console.log(`⚡ Starting background processes for ${userType}`);
    this.isInitialized = true;

    console.log('🔍 Step 16: Filtering applicable processes')
    // Get applicable processes and sort by priority
    const applicableProcesses = Array.from(this.processes.values())
      .filter(p => p.userTypes.includes(userType))
      .sort((a, b) => a.priority - b.priority);

    console.log('🔍 Step 17: Found', applicableProcesses.length, 'applicable processes')

    // Execute processes in priority order
    for (const process of applicableProcesses) {
      console.log('🔍 Step 18: Processing:', process.name)

      // Skip if it's a run-once process that already ran
      if (process.runOnce && this.executedOnce.has(process.id)) {
        console.log('  ↳ Skipping (already executed)')
        continue;
      }

      // Execute immediately (NOT awaited - fires and forgets)
      console.log('  ↳ Executing process (non-blocking)')
      this.executeProcess(process);
      console.log('  ↳ Process fired')

      // Mark as executed if run-once
      if (process.runOnce) {
        this.executedOnce.add(process.id);
      }

      // Set up refresh interval if specified and not run-once
      if (process.refreshInterval && !process.runOnce) {
        const intervalId = setInterval(() => {
          this.executeProcess(process);
        }, process.refreshInterval);

        this.runningIntervals.set(process.id, intervalId);
      }
    }

    console.log('🔍 Step 19: All processes fired, exiting startProcesses')
  }

  /**
   * Execute a single process with error handling and timing
   */
  private async executeProcess(process: BackgroundProcess): Promise<void> {
    const startTime = performance.now();
    try {
      console.log(`⚡ START: ${process.name} (t=${startTime.toFixed(2)}ms)`);
      const result = await process.execute();
      const endTime = performance.now();
      const duration = endTime - startTime;
        } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ ERROR: ${process.name} (failed after ${duration.toFixed(2)}ms):`, error);
    }
  }

  /**
   * Stop all running background processes
   */
  stopAllProcesses(): void {
    console.log('⚡ Stopping all background processes');

    this.runningIntervals.forEach(interval => {
      clearInterval(interval);
    });

    this.runningIntervals.clear();
    this.isInitialized = false;
  }

  /**
   * Stop a specific process
   */
  stopProcess(processId: string): void {
    const interval = this.runningIntervals.get(processId);
    if (interval) {
      clearInterval(interval);
      this.runningIntervals.delete(processId);
    }
  }

  /**
   * Restart processes with new user type
   */
  async restartProcesses(userType: UserType): Promise<void> {
    this.stopAllProcesses();
    this.executedOnce.clear();
    await this.startProcesses(userType);
  }
}

// Singleton instance
export const backgroundProcessManager = new BackgroundProcessManager();
