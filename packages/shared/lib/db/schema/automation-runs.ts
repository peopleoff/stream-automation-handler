import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { hueAutomations } from "./hue-automations";
import { tiktokGiftTriggers } from "./tiktok-gift-triggers";

export const automationRuns = sqliteTable(
  "automation_runs",
  {
    id: integer().primaryKey({ autoIncrement: true }),

    // Relationships (preserve history if automation/trigger deleted)
    automationId: integer("automation_id").references(() => hueAutomations.id, {
      onDelete: "set null",
    }),
    triggerId: integer("trigger_id").references(() => tiktokGiftTriggers.id, {
      onDelete: "set null",
    }),

    // Event identification
    eventType: text("event_type", {
      enum: ["gift", "comment", "like", "follow", "share"],
    }).notNull(),
    timestamp: integer().notNull(), // milliseconds since epoch (from TikTok event)

    // Execution status
    status: text({
      enum: ["success", "partial_failure", "failed"],
    }).notNull(),

    // Event source data (nullable for different event types)
    senderUsername: text("sender_username"),
    senderId: text("sender_id"),
    giftId: text("gift_id"),
    giftName: text("gift_name"),
    giftValue: integer("gift_value"),
    repeatCount: integer("repeat_count"),
    eventData: text("event_data"), // JSON for event-specific data (comments, likes, etc.)

    // Execution details
    actionType: text("action_type").notNull(), // setBrightness, setColor, etc.
    actionConfig: text("action_config").notNull(), // JSON snapshot of action configuration
    selectedLights: text("selected_lights").notNull(), // JSON array of light IDs
    selectedLightsCount: integer("selected_lights_count").notNull(),
    successfulLightsCount: integer("successful_lights_count").notNull(),
    failedLightsCount: integer("failed_lights_count").notNull(),
    executionDurationMs: integer("execution_duration_ms"),

    // Error diagnostics (for troubleshooting)
    errorMessage: text("error_message"),
    failedLightIds: text("failed_light_ids"), // JSON array
    failedLightErrors: text("failed_light_errors"), // JSON object: lightId -> error

    // Metadata (snapshots for display even if parent records deleted)
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`), // milliseconds
    automationName: text("automation_name"),
    triggerName: text("trigger_name"),
  },
  (table) => ({
    // Indexes for query performance
    automationIdIdx: index("automation_runs_automation_id_idx").on(table.automationId),
    timestampIdx: index("automation_runs_timestamp_idx").on(table.timestamp),
    statusIdx: index("automation_runs_status_idx").on(table.status),
    automationTimestampIdx: index("automation_runs_automation_timestamp_idx").on(
      table.automationId,
      table.timestamp,
    ),
  }),
);

export type AutomationRun = typeof automationRuns.$inferSelect;
export type NewAutomationRun = typeof automationRuns.$inferInsert;
