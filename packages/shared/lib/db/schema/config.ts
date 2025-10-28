import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
  id: integer().primaryKey({ autoIncrement: true }),
  hue_ip: text(),
  hue_username: text(),
  hue_password: text(),
  tiktok_handle: text(),
  automations_enabled: integer("automations_enabled").notNull().default(1),
});
