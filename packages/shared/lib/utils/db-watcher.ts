/**
 * Database Change Watcher
 * Monitors database tables for changes and emits events
 */

import type { AutomationRun, ServiceStatus } from "../db/schema";
import db from "../db";
import { automationRuns, serviceStatus } from "../db/schema";
import { desc, gt } from "drizzle-orm";

export interface DbWatcherEvents {
  "status-update": ServiceStatus;
  "automation-run": AutomationRun;
  "error": Error;
}

export type DbWatcherEventType = keyof DbWatcherEvents;
export type DbWatcherCallback<T extends DbWatcherEventType> = (data: DbWatcherEvents[T]) => void;

/**
 * Database watcher that polls for changes
 */
export class DbWatcher {
  private listeners = new Map<DbWatcherEventType, Set<DbWatcherCallback<any>>>();
  private intervalId: NodeJS.Timeout | null = null;
  private lastStatusCheck: number = 0;
  private lastRunCheck: number = 0;
  private isRunning = false;

  constructor(private pollIntervalMs: number = 2000) {}

  /**
   * Start watching for database changes
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastStatusCheck = Date.now();
    this.lastRunCheck = Date.now();

    this.intervalId = setInterval(() => {
      this.checkForChanges().catch((error) => {
        this.emit("error", error instanceof Error ? error : new Error(String(error)));
      });
    }, this.pollIntervalMs);
  }

  /**
   * Stop watching for changes
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Subscribe to events
   */
  on<T extends DbWatcherEventType>(event: T, callback: DbWatcherCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit<T extends DbWatcherEventType>(event: T, data: DbWatcherEvents[T]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        }
        catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Check database for changes since last check
   */
  private async checkForChanges(): Promise<void> {
    await Promise.all([
      this.checkStatusUpdates(),
      this.checkAutomationRuns(),
    ]);
  }

  /**
   * Check for service status updates
   */
  private async checkStatusUpdates(): Promise<void> {
    try {
      const updates = await db
        .select()
        .from(serviceStatus)
        .where(gt(serviceStatus.updatedAt, this.lastStatusCheck))
        .orderBy(desc(serviceStatus.updatedAt));

      if (updates.length > 0) {
        // Update last check time
        this.lastStatusCheck = Math.max(...updates.map(u => u.updatedAt));

        // Emit each update
        updates.forEach((update) => {
          this.emit("status-update", update);
        });
      }
    }
    catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check for new automation runs
   */
  private async checkAutomationRuns(): Promise<void> {
    try {
      const runs = await db
        .select()
        .from(automationRuns)
        .where(gt(automationRuns.createdAt, this.lastRunCheck))
        .orderBy(desc(automationRuns.createdAt));

      if (runs.length > 0) {
        // Update last check time
        this.lastRunCheck = Math.max(...runs.map(r => r.createdAt));

        // Emit each run
        runs.forEach((run) => {
          this.emit("automation-run", run);
        });
      }
    }
    catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get current status
   */
  get running(): boolean {
    return this.isRunning;
  }
}

/**
 * Create a new database watcher instance
 */
export function createDbWatcher(pollIntervalMs?: number): DbWatcher {
  return new DbWatcher(pollIntervalMs);
}
