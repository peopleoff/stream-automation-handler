/**
 * TikTok Live Stream Service
 * Connects to TikTok live streams and emits normalized events
 */

import { TikTokLiveConnection, ControlEvent, WebcastEvent, WebcastGiftMessage } from "tiktok-live-connector";
import type { AppLogger } from "@cattyshack/shared/utils/logger";
import { upsertServiceStatus, updateServiceHeartbeat } from "@cattyshack/shared";
import type { TikTokEvent } from "../types";
import { EventEmitter } from "events";

export interface TikTokStreamService extends EventEmitter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  startPersistentMode(retryIntervalMs: number): void;
  stopPersistentMode(): void;
}

interface TikTokStreamConfig {
  username: string;
  logger: AppLogger;
}

export function createTikTokStreamService(config: TikTokStreamConfig): TikTokStreamService {
  const { username, logger } = config;
  const emitter = new EventEmitter();

  let connection: TikTokLiveConnection | null = null;
  let connected = false;
  let persistentMode = false;
  let retryTimer: NodeJS.Timeout | null = null;
  let retryIntervalMs = 300000; // Default 5 minutes
  let heartbeatTimer: NodeJS.Timeout | null = null;

  /**
   * Start heartbeat timer to update service status
   */
  function startHeartbeat(): void {
    // Clear any existing heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    // Update heartbeat every 30 seconds
    heartbeatTimer = setInterval(async () => {
      try {
        await updateServiceHeartbeat("tiktok-stream");
      } catch (error) {
        logger.error("Failed to update heartbeat", error as Error);
      }
    }, 30000);
  }

  /**
   * Stop heartbeat timer
   */
  function stopHeartbeat(): void {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  /**
   * Connect to TikTok live stream
   */
  async function connect(): Promise<void> {
    if (connected) {
      logger.info("Already connected to TikTok stream");
      return;
    }

    // Clear any existing retry timer
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    try {
      // Remove @ symbol if present
      const cleanUsername = username.startsWith("@") ? username.slice(1) : username;

      logger.info(`Connecting to TikTok stream for @${cleanUsername}...`);

      // Create new connection
      connection = new TikTokLiveConnection(cleanUsername);

      // Set up event listeners
      setupEventListeners(connection);

      // Connect to the stream
      const state = await connection.connect();

      connected = true;

      // Update service status to connected
      await upsertServiceStatus("tiktok-stream", {
        status: "connected",
        connectionDetails: JSON.stringify({
          roomId: state.roomId,
          username: cleanUsername,
          connectedAt: Date.now(),
        }),
      });

      // Start heartbeat
      startHeartbeat();

      logger.info(`✅ Connected to TikTok stream (Room ID: ${state.roomId})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.warn("Failed to connect to TikTok stream (user may not be live)", {
        error: errorMessage,
      });

      // Update service status to disconnected with error details
      await upsertServiceStatus("tiktok-stream", {
        status: "disconnected",
        connectionDetails: JSON.stringify({
          error: errorMessage,
          lastAttempt: Date.now(),
        }),
      });

      // In persistent mode, schedule retry
      if (persistentMode) {
        scheduleRetry();
      } else {
        // In non-persistent mode, throw the error
        throw error;
      }
    }
  }

  /**
   * Disconnect from TikTok stream
   */
  async function disconnect(): Promise<void> {
    if (connection) {
      try {
        connection.disconnect();
        connection = null;
        connected = false;

        // Stop heartbeat
        stopHeartbeat();

        // Update service status to disconnected
        await upsertServiceStatus("tiktok-stream", {
          status: "disconnected",
          connectionDetails: JSON.stringify({
            disconnectedAt: Date.now(),
            reason: "Manual disconnect",
          }),
        });

        logger.info("Disconnected from TikTok stream");
      } catch (error) {
        logger.error("Error during disconnect", error as Error);
      }
    }
  }

  /**
   * Check if connected
   */
  function isConnected(): boolean {
    return connected;
  }

  /**
   * Schedule a retry attempt
   */
  function scheduleRetry(): void {
    if (retryTimer) {
      clearTimeout(retryTimer);
    }

    const minutesUntilRetry = Math.round(retryIntervalMs / 60000);
    logger.info(`⏳ Will retry connection in ${minutesUntilRetry} minute(s)...`);

    retryTimer = setTimeout(() => {
      logger.info("🔄 Attempting to reconnect to TikTok stream...");
      connect().catch(err => {
        logger.error("Scheduled reconnection failed", err as Error);
      });
    }, retryIntervalMs);
  }

  /**
   * Start persistent mode - continuously retry connection
   */
  function startPersistentMode(intervalMs: number): void {
    persistentMode = true;
    retryIntervalMs = intervalMs;
    logger.info(`🔁 Persistent mode enabled (retry interval: ${Math.round(intervalMs / 60000)} minutes)`);
  }

  /**
   * Stop persistent mode
   */
  function stopPersistentMode(): void {
    persistentMode = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    logger.info("⏸️ Persistent mode disabled");
  }

  /**
   * Setup event listeners for TikTok events
   */
  function setupEventListeners(conn: TikTokLiveConnection): void {
    // Connection events
    conn.on(ControlEvent.CONNECTED, () => {
      logger.stream("Stream connected", "TikTok");
    });

    conn.on(ControlEvent.DISCONNECTED, () => {
      connected = false;
      logger.warn("Stream disconnected (stream may have ended)", { platform: "TikTok" });

      // Stop heartbeat
      stopHeartbeat();

      // Update service status to disconnected
      upsertServiceStatus("tiktok-stream", {
        status: "disconnected",
        connectionDetails: JSON.stringify({
          disconnectedAt: Date.now(),
          reason: "Stream ended or connection lost",
        }),
      }).catch((err: unknown) => {
        logger.error("Failed to update service status on disconnect", err as Error);
      });

      // In persistent mode, schedule retry
      if (persistentMode) {
        scheduleRetry();
      }
    });

    // Gift events
    conn.on(WebcastEvent.GIFT, (data: WebcastGiftMessage) => {
      try {
        const event: TikTokEvent = {
          type: "gift",
          giftId: data.giftId?.toString() || "unknown",
          giftName: data.giftDetails?.giftName || "Unknown Gift",
          giftValue: data.giftDetails?.diamondCount || 0,
          repeatCount: data.repeatCount || 1,
          username: data.user?.nickname || data.user?.uniqueId || "anonymous",
          userId: data.user?.userId || "unknown",
          timestamp: Date.now(),
          final: data.repeatEnd ? true : false,
        };

        logger.gift(
          event.giftName,
          event.username,
          event.giftValue,
          { repeatCount: event.repeatCount, final: event.final }
        );

        emitter.emit("event", event);
      } catch (error) {
        logger.error("Error processing gift event", error as Error);
      }
    });

    // Error handling
    conn.on(ControlEvent.ERROR, (error: Error) => {
      logger.error("TikTok stream error", error);
    });
  }

  return Object.assign(emitter, {
    connect,
    disconnect,
    isConnected,
    startPersistentMode,
    stopPersistentMode,
  });
}
