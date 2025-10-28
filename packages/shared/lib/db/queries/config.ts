import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { eq } from "drizzle-orm";

import db from "../index";
import { config } from "../schema";

/**
 * Centralized database functions for configuration management
 * These can be reused across different API endpoints
 */

// Use Drizzle's generated types
export type Config = InferSelectModel<typeof config>;
export type NewConfig = InferInsertModel<typeof config>;

/**
 * Get the current configuration from database
 * Returns the first config record or null if none exists
 */
export async function getConfig(): Promise<Config | null> {
  try {
    const result = await db.select().from(config).limit(1);
    return result.length > 0 ? result[0] : null;
  }
  catch (error) {
    console.error("Error fetching config:", error);
    throw new Error("Failed to fetch configuration");
  }
}

/**
 * Update configuration in database
 * If no config exists, creates a new record
 * If config exists, updates the existing record
 */
export async function updateConfig(configData: Partial<NewConfig>): Promise<Config> {
  try {
    const existingConfig = await getConfig();

    if (existingConfig) {
      // Update existing config
      const updated = await db
        .update(config)
        .set(configData)
        .where(eq(config.id, existingConfig.id))
        .returning();

      return updated[0];
    }
    else {
      // Create new config
      const newConfig = await db
        .insert(config)
        .values(configData)
        .returning();

      return newConfig[0];
    }
  }
  catch (error) {
    console.error("Error updating config:", error);
    throw new Error("Failed to update configuration");
  }
}

/**
 * Update specifically Hue bridge configuration
 * Helper function for Hue-specific updates
 */
export async function updateHueConfig(hueData: {
  hue_ip?: string | null;
  hue_username?: string | null;
  hue_password?: string | null;
}): Promise<Config> {
  return updateConfig(hueData);
}

/**
 * Get only Hue configuration
 * Returns null if no config exists
 */
export async function getHueConfig(): Promise<Pick<Config, "hue_ip" | "hue_username" | "hue_password"> | null> {
  const configData = await getConfig();

  if (!configData)
    return null;

  return {
    hue_ip: configData.hue_ip,
    hue_username: configData.hue_username,
    hue_password: configData.hue_password,
  };
}

/**
 * Update specifically TikTok configuration
 * Helper function for TikTok-specific updates
 */
export async function updateTiktokConfig(tiktokData: {
  tiktok_handle?: string | null;
}): Promise<Config> {
  return updateConfig(tiktokData);
}

/**
 * Get only TikTok configuration
 * Returns null if no config exists
 */
export async function getTiktokConfig(): Promise<Pick<Config, "tiktok_handle"> | null> {
  const configData = await getConfig();

  if (!configData)
    return null;

  return {
    tiktok_handle: configData.tiktok_handle,
  };
}

/**
 * Get automations enabled status
 * Returns true by default if no config exists
 */
export async function getAutomationsEnabled(): Promise<boolean> {
  try {
    const configData = await getConfig();

    if (!configData)
      return true;

    // SQLite stores booleans as integers (1 = true, 0 = false)
    return configData.automations_enabled === 1;
  }
  catch (error) {
    console.error("Error fetching automations enabled status:", error);
    // Default to true on error to avoid breaking existing functionality
    return true;
  }
}
