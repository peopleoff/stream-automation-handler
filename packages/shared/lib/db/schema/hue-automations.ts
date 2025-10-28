import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const hueAutomations = sqliteTable("hue_automations", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  enabled: integer({ mode: "boolean" }).notNull().default(true),

  // Action Configuration
  actionType: text("action_type", {
    enum: ["setBrightness", "incrementBrightness", "setColor", "randomColors"],
  }).notNull(),
  actionConfig: text("action_config").notNull(), // JSON string
  selectedLights: text("selected_lights").notNull(), // JSON array of light IDs

  // Trigger Configuration (for future use)
  triggerType: text("trigger_type").default("manual"),
  triggerConfig: text("trigger_config"), // JSON string

  // Metadata
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type HueAutomation = typeof hueAutomations.$inferSelect;
export type NewHueAutomation = typeof hueAutomations.$inferInsert;
