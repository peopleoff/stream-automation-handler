/**
 * Configuration Loader
 * Loads configuration from database and environment variables
 */

import { getConfig } from "@cattyshack/shared/db/queries/config";
import type { ServiceConfig } from "./types.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Load and validate service configuration
 * @throws Error if configuration is missing or invalid
 */
export async function loadConfig(): Promise<ServiceConfig> {
  // Load from database
  const dbConfig = await getConfig();

  // Validate required database configuration
  if (!dbConfig) {
    throw new Error("No configuration found in database. Please set up your configuration first.");
  }

  if (!dbConfig.tiktok_handle) {
    throw new Error("TikTok handle not configured. Please set up your TikTok configuration.");
  }

  if (!dbConfig.hue_ip || !dbConfig.hue_username) {
    throw new Error("Hue bridge not configured. Please set up your Hue bridge connection.");
  }

  // Environment variables with defaults
  const logLevel = process.env.LOG_LEVEL || "info";
  const nodeEnv = process.env.NODE_ENV || "development";
  const dbFileName = process.env.DB_FILE_NAME || "file:../../data/local.db";
  const automationRefreshInterval = parseInt(
    process.env.AUTOMATION_REFRESH_INTERVAL || "30000",
    10
  );
  const streamRetryInterval = parseInt(
    process.env.STREAM_RETRY_INTERVAL || "300000", // Default 5 minutes
    10
  );

  // Validate environment values
  const validLogLevels = ["error", "warn", "info", "debug"];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(", ")}`
    );
  }

  if (automationRefreshInterval < 5000) {
    throw new Error(
      "AUTOMATION_REFRESH_INTERVAL must be at least 5000ms to avoid excessive database queries"
    );
  }

  if (streamRetryInterval < 60000) {
    throw new Error(
      "STREAM_RETRY_INTERVAL must be at least 60000ms (1 minute) to avoid excessive connection attempts"
    );
  }

  // Parse automations_enabled (SQLite stores as integer: 1 = true, 0 = false)
  const automationsEnabled = dbConfig.automations_enabled === 1;

  return {
    tiktokHandle: dbConfig.tiktok_handle,
    hueIp: dbConfig.hue_ip,
    hueUsername: dbConfig.hue_username,
    logLevel,
    nodeEnv,
    dbFileName,
    automationRefreshInterval,
    streamRetryInterval,
    automationsEnabled,
  };
}
