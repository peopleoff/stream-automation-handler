import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import db from "../index";
import { automationRuns } from "../schema";

/**
 * Centralized database functions for automation run tracking
 * These functions support live monitoring, troubleshooting, and analytics
 */

// Use Drizzle's generated types
export type AutomationRun = InferSelectModel<typeof automationRuns>;
export type NewAutomationRun = InferInsertModel<typeof automationRuns>;

/**
 * Insert a new automation run record
 * Used by event service to track automation executions
 */
export async function insertAutomationRun(
  runData: NewAutomationRun,
): Promise<AutomationRun> {
  try {
    const result = await db.insert(automationRuns).values(runData).returning();
    return result[0];
  }
  catch (error) {
    console.error("Error inserting automation run:", error);
    throw new Error("Failed to insert automation run");
  }
}

/**
 * Get recent automation runs (for live monitoring feed)
 * Returns runs ordered by timestamp descending (newest first)
 * @param limit - Maximum number of runs to return (default: 50)
 */
export async function getRecentRuns(limit = 50): Promise<AutomationRun[]> {
  try {
    return await db
      .select()
      .from(automationRuns)
      .orderBy(desc(automationRuns.timestamp))
      .limit(limit);
  }
  catch (error) {
    console.error("Error fetching recent runs:", error);
    throw new Error("Failed to fetch recent automation runs");
  }
}

/**
 * Get automation runs for a specific automation
 * Useful for per-automation history view
 * @param automationId - ID of the automation
 * @param limit - Maximum number of runs to return (default: 100)
 */
export async function getRunsByAutomation(
  automationId: number,
  limit = 100,
): Promise<AutomationRun[]> {
  try {
    return await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.automationId, automationId))
      .orderBy(desc(automationRuns.timestamp))
      .limit(limit);
  }
  catch (error) {
    console.error("Error fetching runs by automation:", error);
    throw new Error("Failed to fetch automation runs");
  }
}

/**
 * Get failed automation runs (for troubleshooting view)
 * Returns runs with status "failed" or "partial_failure"
 * @param limit - Maximum number of runs to return (default: 50)
 */
export async function getFailedRuns(limit = 50): Promise<AutomationRun[]> {
  try {
    return await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.status, "failed"))
      .orderBy(desc(automationRuns.timestamp))
      .limit(limit);
  }
  catch (error) {
    console.error("Error fetching failed runs:", error);
    throw new Error("Failed to fetch failed automation runs");
  }
}

/**
 * Get a specific automation run by ID
 * Useful for detail view
 */
export async function getRunById(id: number): Promise<AutomationRun | null> {
  try {
    const result = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }
  catch (error) {
    console.error("Error fetching run by ID:", error);
    throw new Error("Failed to fetch automation run");
  }
}

/**
 * Get automation runs within a time range
 * Useful for analytics and reporting
 * @param startTime - Start timestamp in milliseconds
 * @param endTime - End timestamp in milliseconds
 * @param limit - Maximum number of runs to return (default: 500)
 */
export async function getRunsInTimeRange(
  startTime: number,
  endTime: number,
  limit = 500,
): Promise<AutomationRun[]> {
  try {
    return await db
      .select()
      .from(automationRuns)
      .where(
        and(
          gte(automationRuns.timestamp, startTime),
          lte(automationRuns.timestamp, endTime),
        ),
      )
      .orderBy(desc(automationRuns.timestamp))
      .limit(limit);
  }
  catch (error) {
    console.error("Error fetching runs in time range:", error);
    throw new Error("Failed to fetch automation runs in time range");
  }
}

/**
 * Get automation runs by status
 * @param status - Status to filter by ("success", "partial_failure", "failed")
 * @param limit - Maximum number of runs to return (default: 100)
 */
export async function getRunsByStatus(
  status: "success" | "partial_failure" | "failed",
  limit = 100,
): Promise<AutomationRun[]> {
  try {
    return await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.status, status))
      .orderBy(desc(automationRuns.timestamp))
      .limit(limit);
  }
  catch (error) {
    console.error("Error fetching runs by status:", error);
    throw new Error("Failed to fetch automation runs by status");
  }
}

/**
 * Get automation runs by event type
 * @param eventType - Event type to filter by
 * @param limit - Maximum number of runs to return (default: 100)
 */
export async function getRunsByEventType(
  eventType: "gift" | "comment" | "like" | "follow" | "share",
  limit = 100,
): Promise<AutomationRun[]> {
  try {
    return await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.eventType, eventType))
      .orderBy(desc(automationRuns.timestamp))
      .limit(limit);
  }
  catch (error) {
    console.error("Error fetching runs by event type:", error);
    throw new Error("Failed to fetch automation runs by event type");
  }
}
