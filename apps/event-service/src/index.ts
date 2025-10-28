/**
 * Event Service - Main Entry Point
 * Connects TikTok live events to Hue light automations
 */

import { createAppLogger } from "@cattyshack/shared/utils/logger";
import { upsertServiceStatus } from "@cattyshack/shared";
import { loadConfig } from "./config.js";
import { createTikTokStreamService } from "./services/tiktok-stream.js";
import { createAutomationExecutor } from "./services/automation-executor.js";

/**
 * Main service function
 */
async function main() {
  // Initialize logger
  const logger = createAppLogger({
    level: process.env.LOG_LEVEL || "info",
    file: "logs/event-service.log",
    console: true,
  });

  logger.info("=� Starting Event Service...");

  try {
    // Initialize service status to starting
    await upsertServiceStatus("tiktok-stream", {
      status: "starting",
      connectionDetails: JSON.stringify({
        startedAt: Date.now(),
      }),
    });

    // Load configuration from database
    logger.info("Loading configuration from database...");
    const config = await loadConfig();

    logger.info("Configuration loaded successfully", {
      tiktokHandle: config.tiktokHandle,
      hueIp: config.hueIp,
      environment: config.nodeEnv,
    });

    // Create TikTok stream service
    logger.info("Initializing TikTok stream service...");
    const tiktokStream = createTikTokStreamService({
      username: config.tiktokHandle,
      logger,
    });

    // Create automation executor
    logger.info("Initializing automation executor...");
    const automationExecutor = createAutomationExecutor({
      serviceConfig: config,
      tiktokStream,
      logger,
    });

    // Start automation executor
    await automationExecutor.start();

    // Enable persistent mode (retry every 5 minutes)
    const retryIntervalMs = config.streamRetryInterval || 300000; // Default 5 minutes
    tiktokStream.startPersistentMode(retryIntervalMs);

    // Attempt initial connection
    logger.info("Attempting initial connection to TikTok live stream...");
    logger.info("Note: Service will continuously retry if user is not live");
    await tiktokStream.connect();

    logger.info(" Event Service started successfully!");
    logger.info(`Monitoring TikTok: ${config.tiktokHandle}`);
    logger.info(`Controlling Hue Bridge: ${config.hueIp}`);
    logger.info(`Loaded ${automationExecutor.getLoadedTriggers().length} triggers`);
    logger.info(`Persistent mode: Will retry every ${Math.round(retryIntervalMs / 60000)} minutes if not connected`);

    // Setup graceful shutdown
    setupGracefulShutdown(logger, tiktokStream, automationExecutor);
  } catch (error) {
    logger.error("Failed to start Event Service", error as Error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(
  logger: ReturnType<typeof createAppLogger>,
  tiktokStream: ReturnType<typeof createTikTokStreamService>,
  automationExecutor: ReturnType<typeof createAutomationExecutor>
) {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    try {
      // Stop automation executor
      automationExecutor.stop();

      // Disconnect from TikTok
      await tiktokStream.disconnect();

      logger.info(" Event Service shut down successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", error as Error);
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught exception", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled rejection", reason as Error);
    process.exit(1);
  });
}

// Start the service
main().catch(error => {
  // eslint-disable-next-line no-console
  console.error("Fatal error:", error);
  process.exit(1);
});
