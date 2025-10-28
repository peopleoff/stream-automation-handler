import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { eq, sql } from "drizzle-orm";

import db from "../index";
import { serviceStatus } from "../schema";

/**
 * Centralized database functions for service status management
 * These can be reused across different services and API endpoints
 */

// Use Drizzle's generated types
export type ServiceStatus = InferSelectModel<typeof serviceStatus>;
export type NewServiceStatus = InferInsertModel<typeof serviceStatus>;

/**
 * Get service status by service name
 * Returns null if service status doesn't exist
 */
export async function getServiceStatus(serviceName: string): Promise<ServiceStatus | null> {
  try {
    const result = await db
      .select()
      .from(serviceStatus)
      .where(eq(serviceStatus.serviceName, serviceName))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }
  catch (error) {
    console.error(`Error fetching service status for ${serviceName}:`, error);
    throw new Error(`Failed to fetch service status for ${serviceName}`);
  }
}

/**
 * Get all service statuses
 * Returns empty array if no services exist
 */
export async function getAllServiceStatuses(): Promise<ServiceStatus[]> {
  try {
    return await db.select().from(serviceStatus);
  }
  catch (error) {
    console.error("Error fetching all service statuses:", error);
    throw new Error("Failed to fetch service statuses");
  }
}

/**
 * Update or create service status (upsert pattern)
 * If service doesn't exist, creates a new record
 * If service exists, updates the existing record
 */
export async function upsertServiceStatus(
  serviceName: string,
  statusData: {
    status: "connected" | "disconnected" | "error" | "starting";
    connectionDetails?: string | null;
  },
): Promise<ServiceStatus> {
  try {
    const existingStatus = await getServiceStatus(serviceName);
    const now = Date.now();

    if (existingStatus) {
      // Update existing status
      const updated = await db
        .update(serviceStatus)
        .set({
          status: statusData.status,
          lastHeartbeat: now,
          connectionDetails: statusData.connectionDetails,
          updatedAt: now,
        })
        .where(eq(serviceStatus.serviceName, serviceName))
        .returning();

      return updated[0];
    }
    else {
      // Create new status
      const newStatus = await db
        .insert(serviceStatus)
        .values({
          serviceName,
          status: statusData.status,
          lastHeartbeat: now,
          connectionDetails: statusData.connectionDetails,
        })
        .returning();

      return newStatus[0];
    }
  }
  catch (error) {
    console.error(`Error upserting service status for ${serviceName}:`, error);
    throw new Error(`Failed to update service status for ${serviceName}`);
  }
}

/**
 * Update heartbeat timestamp for a service
 * Used by services to indicate they are still alive
 */
export async function updateServiceHeartbeat(serviceName: string): Promise<ServiceStatus | null> {
  try {
    const existingStatus = await getServiceStatus(serviceName);

    if (!existingStatus) {
      console.warn(`Service ${serviceName} does not exist, cannot update heartbeat`);
      return null;
    }

    const now = Date.now();
    const updated = await db
      .update(serviceStatus)
      .set({
        lastHeartbeat: now,
        updatedAt: now,
      })
      .where(eq(serviceStatus.serviceName, serviceName))
      .returning();

    return updated[0];
  }
  catch (error) {
    console.error(`Error updating heartbeat for ${serviceName}:`, error);
    throw new Error(`Failed to update heartbeat for ${serviceName}`);
  }
}

/**
 * Check if service heartbeat is stale
 * Returns true if last heartbeat is older than threshold
 * @param serviceName - Name of the service to check
 * @param thresholdMs - Threshold in milliseconds (default: 90 seconds)
 */
export async function isServiceHeartbeatStale(
  serviceName: string,
  thresholdMs = 90000,
): Promise<boolean> {
  try {
    const status = await getServiceStatus(serviceName);

    if (!status) {
      return true; // Service doesn't exist = stale
    }

    const now = Date.now();
    const timeSinceHeartbeat = now - status.lastHeartbeat;

    return timeSinceHeartbeat > thresholdMs;
  }
  catch (error) {
    console.error(`Error checking heartbeat for ${serviceName}:`, error);
    return true; // On error, assume stale for safety
  }
}

/**
 * Delete service status by service name
 * Used for cleanup when service is permanently removed
 */
export async function deleteServiceStatus(serviceName: string): Promise<void> {
  try {
    await db.delete(serviceStatus).where(eq(serviceStatus.serviceName, serviceName));
  }
  catch (error) {
    console.error(`Error deleting service status for ${serviceName}:`, error);
    throw new Error(`Failed to delete service status for ${serviceName}`);
  }
}
