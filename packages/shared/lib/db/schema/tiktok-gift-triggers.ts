import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { hueAutomations } from "./hue-automations";

export const tiktokGiftTriggers = sqliteTable("tiktok_gift_triggers", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),

  // TikTok gift identification
  giftIds: text("gift_ids").notNull(), // JSON array of gift IDs
  matchAllGifts: integer("match_all_gifts", { mode: "boolean" }).notNull().default(false),

  // Quantity range (optional - null means "any quantity")
  minQuantity: integer("min_quantity"),
  maxQuantity: integer("max_quantity"),

  // Link to automation
  automationId: integer("automation_id")
    .notNull()
    .references(() => hueAutomations.id, { onDelete: "cascade" }),

  // Status
  enabled: integer({ mode: "boolean" }).notNull().default(true),

  // Metadata
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type TikTokGiftTrigger = typeof tiktokGiftTriggers.$inferSelect;
export type NewTikTokGiftTrigger = typeof tiktokGiftTriggers.$inferInsert;
