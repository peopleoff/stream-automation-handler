/**
 * Automation Executor Service
 * Matches TikTok events to triggers and executes linked automations
 */

import {
  getEnabledTikTokGiftTriggersWithAutomations,
  type TikTokGiftTriggerWithAutomation,
} from "@cattyshack/shared/db/queries/tiktok-gift-triggers";
import { getAutomationsEnabled } from "@cattyshack/shared/db/queries/config";
import { insertAutomationRun } from "@cattyshack/shared/db/queries/automation-runs";
import { executeAutomationAction } from "@cattyshack/shared/services/hue";
import type { AppLogger } from "@cattyshack/shared/utils/logger";
import type { HueAutomation } from "@cattyshack/shared/db/schema";
import type {
  TikTokEvent,
  TikTokGiftEvent,
  AutomationActionConfig,
  ServiceConfig,
  DecayConfig,
} from "../types";
import type { TikTokStreamService } from "./tiktok-stream";

export interface AutomationExecutorService {
  start(): Promise<void>;
  stop(): void;
  getLoadedTriggers(): TikTokGiftTriggerWithAutomation[];
}

interface AutomationExecutorConfig {
  serviceConfig: ServiceConfig;
  tiktokStream: TikTokStreamService;
  logger: AppLogger;
}

// ============================================================================
// Decay Timer State Management
// ============================================================================

interface DecayTimerState {
  automationId: number;
  lightId: string;
  intervalHandle: NodeJS.Timeout;
  accumulatedTime: number; // Total time remaining in milliseconds
  lastTick: number; // Timestamp of last decay tick
  decayConfig: DecayConfig;
}

// Default max accumulated time (5 minutes in milliseconds)
const DEFAULT_MAX_ACCUMULATED_TIME = 300000;

export function createAutomationExecutor(config: AutomationExecutorConfig): AutomationExecutorService {
  const { serviceConfig, tiktokStream, logger } = config;

  let tiktokGiftTriggers: TikTokGiftTriggerWithAutomation[] = [];
  let automationsEnabled = serviceConfig.automationsEnabled;
  let refreshInterval: NodeJS.Timeout | null = null;
  let flagRefreshInterval: NodeJS.Timeout | null = null;
  let isRunning = false;

  // Decay timer state map: key = `${automationId}-${lightId}`
  const decayTimers = new Map<string, DecayTimerState>();

  /**
   * Load TikTok gift triggers from database
   * Clears existing decay timers as automation configs may have changed
   */
  async function loadTikTokGiftTriggers(): Promise<void> {
    try {
      // Clear existing decay timers before loading new automations
      // This ensures that if automation configs change, old timers don't persist
      if (decayTimers.size > 0) {
        logger.debug("Clearing existing decay timers before reloading automations...");
        stopAllDecayTimers();
      }

      tiktokGiftTriggers = await getEnabledTikTokGiftTriggersWithAutomations();

      logger.info(`Loaded ${tiktokGiftTriggers.length} enabled TikTok gift triggers`);
    } catch (error) {
      logger.error("Failed to load TikTok gift triggers from database", error as Error);
    }
  }

  /**
   * Load automations enabled flag from database
   */
  async function loadAutomationsEnabledFlag(): Promise<void> {
    try {
      const previousState = automationsEnabled;
      automationsEnabled = await getAutomationsEnabled();

      // Log if state changed
      if (previousState !== automationsEnabled) {
        logger.info(
          `Automations ${automationsEnabled ? "ENABLED" : "DISABLED"} - state changed from ${previousState ? "enabled" : "disabled"}`
        );
      } else {
        logger.debug(`Automations status: ${automationsEnabled ? "enabled" : "disabled"}`);
      }
    } catch (error) {
      logger.error("Failed to load automations enabled flag from database", error as Error);
    }
  }

  // ============================================================================
  // Decay Timer Functions
  // ============================================================================

  /**
   * Get timer key for a specific automation+light combination
   */
  function getTimerKey(automationId: number, lightId: string): string {
    return `${automationId}-${lightId}`;
  }

  /**
   * Execute a decay tick for a specific light
   * Decreases brightness and schedules next tick if needed
   */
  async function executeDecayTick(
    automationId: number,
    lightId: string,
    decayConfig: DecayConfig
  ): Promise<void> {
    try {
      // Fetch current light state
      const lightResponse = await fetch(
        `http://${serviceConfig.hueIp}/api/${serviceConfig.hueUsername}/lights/${lightId}`
      );

      if (!lightResponse.ok) {
        logger.error(`Failed to fetch light ${lightId} state for decay: HTTP ${lightResponse.status}`);
        return;
      }

      const lightData = await lightResponse.json() as { state: { bri: number; on: boolean } };
      const currentBri = lightData.state.bri || 0;
      const currentBriPercent = Math.round((currentBri / 254) * 100);

      // Calculate new brightness (ensure it doesn't go below 0%)
      const newBriPercent = Math.max(0, currentBriPercent - decayConfig.decayAmount);
      const newBri = Math.round((newBriPercent / 100) * 254);

      logger.debug(
        `Decay tick for automation ${automationId}, light ${lightId}: ${currentBriPercent}% → ${newBriPercent}%`
      );

      // Update light brightness
      await fetch(
        `http://${serviceConfig.hueIp}/api/${serviceConfig.hueUsername}/lights/${lightId}/state`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bri: newBri }),
        }
      );

      // If brightness reached 0%, stop the timer
      if (newBriPercent === 0) {
        logger.info(`Decay timer stopped for automation ${automationId}, light ${lightId}: brightness reached 0%`);
        stopDecayTimer(automationId, lightId);
      }
    } catch (error) {
      logger.error(
        `Error during decay tick for automation ${automationId}, light ${lightId}`,
        error as Error
      );
    }
  }

  /**
   * Start or add time to a decay timer for a specific automation+light combination
   */
  function addTimeToDecayTimer(
    automationId: number,
    lightId: string,
    decayConfig: DecayConfig
  ): void {
    const key = getTimerKey(automationId, lightId);
    const existingTimer = decayTimers.get(key);
    const maxAccumulatedTime = decayConfig.maxAccumulatedTime || DEFAULT_MAX_ACCUMULATED_TIME;

    if (existingTimer) {
      // Add time to existing timer (with max cap)
      const newAccumulatedTime = Math.min(
        existingTimer.accumulatedTime + decayConfig.addTimePerEvent,
        maxAccumulatedTime
      );

      existingTimer.accumulatedTime = newAccumulatedTime;

      logger.debug(
        `Added ${decayConfig.addTimePerEvent}ms to decay timer for automation ${automationId}, ` +
        `light ${lightId}. Total accumulated: ${newAccumulatedTime}ms (max: ${maxAccumulatedTime}ms)`
      );
    } else {
      // Create new timer
      const initialAccumulatedTime = Math.min(decayConfig.addTimePerEvent, maxAccumulatedTime);

      const intervalHandle = setInterval(() => {
        const timer = decayTimers.get(key);
        if (!timer) {
          return; // Timer was stopped
        }

        const now = Date.now();
        const elapsed = now - timer.lastTick;

        // Decrease accumulated time
        timer.accumulatedTime = Math.max(0, timer.accumulatedTime - elapsed);
        timer.lastTick = now;

        // If time has run out, execute decay tick
        if (timer.accumulatedTime <= 0) {
          executeDecayTick(automationId, lightId, decayConfig).catch(err => {
            logger.error(`Failed to execute decay tick for automation ${automationId}, light ${lightId}`, err);
          });

          // Reset accumulated time for next decay cycle
          timer.accumulatedTime = timer.decayConfig.decayInterval;
        }
      }, 1000); // Check every second

      const timerState: DecayTimerState = {
        automationId,
        lightId,
        intervalHandle,
        accumulatedTime: initialAccumulatedTime,
        lastTick: Date.now(),
        decayConfig,
      };

      decayTimers.set(key, timerState);

      logger.info(
        `Started decay timer for automation ${automationId}, light ${lightId}. ` +
        `Decay: ${decayConfig.decayAmount}% every ${decayConfig.decayInterval}ms, ` +
        `Initial time: ${initialAccumulatedTime}ms`
      );
    }
  }

  /**
   * Stop a decay timer for a specific automation+light combination
   */
  function stopDecayTimer(automationId: number, lightId: string): void {
    const key = getTimerKey(automationId, lightId);
    const timer = decayTimers.get(key);

    if (timer) {
      clearInterval(timer.intervalHandle);
      decayTimers.delete(key);
      logger.debug(`Stopped decay timer for automation ${automationId}, light ${lightId}`);
    }
  }

  /**
   * Stop all decay timers
   */
  function stopAllDecayTimers(): void {
    logger.debug(`Stopping ${decayTimers.size} active decay timer(s)...`);

    for (const [key, timer] of decayTimers.entries()) {
      clearInterval(timer.intervalHandle);
      logger.debug(`Stopped decay timer: ${key}`);
    }

    decayTimers.clear();
  }

  // ============================================================================
  // Event Matching Functions
  // ============================================================================

  /**
   * Match TikTok gift event to gift triggers
   */
  function matchesGiftTrigger(event: TikTokGiftEvent, trigger: TikTokGiftTriggerWithAutomation): boolean {
    // Check if matchAllGifts is enabled - if so, always match the gift type
    if (trigger.matchAllGifts) {
      // Still need to check quantity constraints
      if (trigger.minQuantity !== null && event.repeatCount < trigger.minQuantity) {
        return false;
      }
      if (trigger.maxQuantity !== null && event.repeatCount > trigger.maxQuantity) {
        return false;
      }
      return true;
    }

    // Parse giftIds array from JSON string
    let giftIds: string[];
    try {
      giftIds = JSON.parse(trigger.giftIds);
    } catch (error) {
      logger.error(`Failed to parse giftIds for trigger ${trigger.id}`, error as Error);
      return false;
    }

    // Check if gift ID matches any in the array
    if (!giftIds.includes(event.giftId)) {
      return false;
    }

    // Check minimum quantity if specified
    if (trigger.minQuantity !== null && event.repeatCount < trigger.minQuantity) {
      return false;
    }

    // Check maximum quantity if specified
    if (trigger.maxQuantity !== null && event.repeatCount > trigger.maxQuantity) {
      return false;
    }

    return true;
  }

  /**
   * Record automation run to database for tracking and analytics
   * Handles errors gracefully to not break automation execution
   */
  async function recordAutomationRun(params: {
    automation: HueAutomation;
    trigger: TikTokGiftTriggerWithAutomation;
    event: TikTokGiftEvent;
    actionConfig: AutomationActionConfig | null;
    selectedLights: string[];
    results: Array<{ lightId: string; success: boolean; error?: string }>;
    executionStartTime: number;
    error?: string;
  }): Promise<void> {
    const {
      automation,
      trigger,
      event,
      actionConfig,
      selectedLights,
      results,
      executionStartTime,
      error,
    } = params;

    try {
      const executionDurationMs = Date.now() - executionStartTime;
      const successfulCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      // Determine status
      let status: "success" | "partial_failure" | "failed";
      if (error || failedCount === selectedLights.length) {
        status = "failed";
      }
      else if (failedCount > 0) {
        status = "partial_failure";
      }
      else {
        status = "success";
      }

      // Extract failed light IDs and errors
      const failedResults = results.filter(r => !r.success);
      const failedLightIds = failedResults.map(r => r.lightId);
      const failedLightErrors: Record<string, string> = {};
      for (const result of failedResults) {
        if (result.error) {
          failedLightErrors[result.lightId] = result.error;
        }
      }

      // Prepare run data
      await insertAutomationRun({
        automationId: automation.id,
        triggerId: trigger.id,
        eventType: event.type,
        timestamp: event.timestamp,
        status,
        senderUsername: event.username,
        senderId: event.userId,
        giftId: event.giftId,
        giftName: event.giftName,
        giftValue: event.giftValue,
        repeatCount: event.repeatCount,
        eventData: null, // Gift events don't need extra data
        actionType: actionConfig?.type || "unknown",
        actionConfig: actionConfig ? JSON.stringify(actionConfig) : "{}",
        selectedLights: JSON.stringify(selectedLights),
        selectedLightsCount: selectedLights.length,
        successfulLightsCount: successfulCount,
        failedLightsCount: failedCount,
        executionDurationMs,
        errorMessage: error || (failedCount > 0 ? `${failedCount} light(s) failed to respond` : null),
        failedLightIds: failedLightIds.length > 0 ? JSON.stringify(failedLightIds) : null,
        failedLightErrors: Object.keys(failedLightErrors).length > 0 ? JSON.stringify(failedLightErrors) : null,
        automationName: automation.name,
        triggerName: trigger.name,
      });

      logger.debug(`Recorded automation run for ${automation.name} (status: ${status})`);
    }
    catch (trackingError) {
      // Don't let tracking failures break automation execution
      logger.error("Failed to record automation run to database", trackingError as Error);
    }
  }

  /**
   * Execute automation action from a Hue automation
   */
  async function executeAutomation(
    automation: HueAutomation,
    trigger: TikTokGiftTriggerWithAutomation,
    event: TikTokGiftEvent
  ): Promise<void> {
    const executionStartTime = Date.now();

    try {
      logger.info(`Executing automation: ${automation.name}`, {
        automationId: automation.id,
        triggeredBy: trigger.name,
        gift: `${event.giftName} x${event.repeatCount}`,
      });

      // Parse automation config
      let actionConfig: AutomationActionConfig;
      let selectedLights: string[];

      try {
        actionConfig = JSON.parse(automation.actionConfig);
        selectedLights = JSON.parse(automation.selectedLights);
      } catch (error) {
        logger.error(`Invalid automation config for automation ${automation.id}`, error as Error);

        // Record failed run due to config parsing error
        await recordAutomationRun({
          automation,
          trigger,
          event,
          actionConfig: null,
          selectedLights: [],
          results: [],
          executionStartTime,
          error: error instanceof Error ? error.message : "Invalid automation config",
        });

        return;
      }

      // Execute the Hue action
      const results = await executeAutomationAction(
        serviceConfig.hueIp,
        serviceConfig.hueUsername,
        selectedLights,
        actionConfig
      );

      // Log results
      const successful = results.filter((r: { success: boolean }) => r.success).length;
      const failed = results.filter((r: { success: boolean }) => !r.success).length;

      if (failed > 0) {
        logger.warn(`Automation partially executed: ${successful} succeeded, ${failed} failed`, {
          automationId: automation.id,
          failures: results.filter((r: { success: boolean }) => !r.success),
        });
      } else {
        logger.light(
          `Automation executed successfully`,
          selectedLights,
          { automationId: automation.id, automationName: automation.name, triggerName: trigger.name }
        );
      }

      // Record the automation run
      await recordAutomationRun({
        automation,
        trigger,
        event,
        actionConfig,
        selectedLights,
        results,
        executionStartTime,
      });

      // Handle decay timers for incrementBrightness actions
      if (actionConfig.type === "incrementBrightness" && actionConfig.decayConfig?.enabled) {
        logger.debug(`Decay config enabled for automation ${automation.id}, managing decay timers...`);

        // Add time to decay timers for each successfully controlled light
        for (const result of results) {
          if (result.success) {
            addTimeToDecayTimer(automation.id, result.lightId, actionConfig.decayConfig);
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to execute automation: ${automation.name}`, error as Error);

      // Record failed run
      await recordAutomationRun({
        automation,
        trigger,
        event,
        actionConfig: null,
        selectedLights: [],
        results: [],
        executionStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle incoming TikTok event
   */
  async function handleEvent(event: TikTokEvent): Promise<void> {
    // Check if automations are enabled globally
    if (!automationsEnabled) {
      logger.debug("Automations are disabled, skipping event processing");
      return;
    }

    // Only handle gift events for now (other event types not yet supported with triggers)
    logger.info(`Received TikTok event of type: ${event.type}`);
    if (event.type !== "gift") {
      logger.debug(`Event type ${event.type} not supported by TikTok gift triggers, ignoring`);
      return;
    }

    // Only trigger automations on final gift events (when combo is complete)
    if (!event.final) {
      logger.debug(`Ignoring non-final gift event: ${event.giftName} (x${event.repeatCount})`);
      return;
    }

    // Find matching gift triggers
    const matches = tiktokGiftTriggers.filter(trigger => matchesGiftTrigger(event, trigger));

    if (matches.length === 0) {
      logger.debug(`No gift triggers matched for ${event.giftName} (x${event.repeatCount})`);
      return;
    }

    logger.info(`Found ${matches.length} matching gift trigger(s) for ${event.giftName} (x${event.repeatCount})`);

    // Execute all matching triggers' linked automations
    for (const trigger of matches) {
      await executeAutomation(trigger.automation, trigger, event);
    }
  }

  /**
   * Start the automation executor
   */
  async function start(): Promise<void> {
    if (isRunning) {
      logger.warn("Automation executor is already running");
      return;
    }

    logger.info("Starting automation executor...");
    logger.info(`Initial automations status: ${automationsEnabled ? "ENABLED" : "DISABLED"}`);

    // Load initial TikTok gift triggers
    await loadTikTokGiftTriggers();

    // Subscribe to TikTok events
    tiktokStream.on("event", handleEvent);

    // Set up periodic refresh of TikTok gift triggers (30s default)
    refreshInterval = setInterval(() => {
      logger.debug("Refreshing TikTok gift triggers from database...");
      loadTikTokGiftTriggers().catch(err => {
        logger.error("Failed to refresh TikTok gift triggers", err);
      });
    }, serviceConfig.automationRefreshInterval);

    // Set up periodic refresh of automations enabled flag (5 minutes)
    flagRefreshInterval = setInterval(() => {
      logger.debug("Refreshing automations enabled flag from database...");
      loadAutomationsEnabledFlag().catch(err => {
        logger.error("Failed to refresh automations enabled flag", err);
      });
    }, 300000); // 5 minutes = 300000ms

    isRunning = true;
    logger.info("✅ Automation executor started");
  }

  /**
   * Stop the automation executor
   */
  function stop(): void {
    if (!isRunning) {
      return;
    }

    logger.info("Stopping automation executor...");

    // Clear all decay timers
    stopAllDecayTimers();

    // Clear trigger refresh interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }

    // Clear flag refresh interval
    if (flagRefreshInterval) {
      clearInterval(flagRefreshInterval);
      flagRefreshInterval = null;
    }

    // Unsubscribe from TikTok events
    tiktokStream.removeListener("event", handleEvent);

    isRunning = false;
    logger.info("Automation executor stopped");
  }

  /**
   * Get currently loaded TikTok gift triggers
   */
  function getLoadedTriggers(): TikTokGiftTriggerWithAutomation[] {
    return [...tiktokGiftTriggers];
  }

  return {
    start,
    stop,
    getLoadedTriggers,
  };
}
