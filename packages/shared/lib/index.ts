/**
 * Cattyshack Shared Package
 * Shared code for frontend and backend services
 */

// Database
export * from "./db";
export * from "./db/schema";

// Database query functions (explicit exports to avoid type conflicts)
export {
  insertAutomationRun,
  getRecentRuns,
  getRunsByAutomation,
  getFailedRuns,
  getRunById,
  getRunsInTimeRange,
  getRunsByStatus,
  getRunsByEventType,
} from "./db/queries/automation-runs";

export {
  getConfig,
  updateConfig,
  getHueConfig,
  updateHueConfig,
  updateTiktokConfig,
  getTiktokConfig,
  getAutomationsEnabled,
} from "./db/queries/config";

export {
  getAllHueAutomations,
  getHueAutomationById,
  createHueAutomation,
  updateHueAutomation,
  deleteHueAutomation,
  getEnabledHueAutomations,
} from "./db/queries/hue-automations";

export {
  getServiceStatus,
  getAllServiceStatuses,
  upsertServiceStatus,
  updateServiceHeartbeat,
  isServiceHeartbeatStale,
  deleteServiceStatus,
} from "./db/queries/service-status";

export {
  getAllTikTokGiftTriggers,
  getTikTokGiftTriggerById,
  createTikTokGiftTrigger,
  updateTikTokGiftTrigger,
  deleteTikTokGiftTrigger,
  getEnabledTikTokGiftTriggers,
  getEnabledTikTokGiftTriggersWithAutomations,
} from "./db/queries/tiktok-gift-triggers";

// Services
export * from "./services/hue";

// Schemas
export * from "./schemas";

// Utils
export * from "./utils/logger";
export * from "./utils/db-watcher";

// Constants
export * from "./constants/tiktok-gifts";
