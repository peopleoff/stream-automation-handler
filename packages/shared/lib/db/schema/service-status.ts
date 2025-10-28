import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const serviceStatus = sqliteTable(
  "service_status",
  {
    id: integer().primaryKey({ autoIncrement: true }),

    // Service identification
    serviceName: text("service_name").notNull().unique(), // e.g., 'tiktok-stream'

    // Status tracking
    status: text({
      enum: ["connected", "disconnected", "error", "starting"],
    }).notNull(),

    // Heartbeat tracking
    lastHeartbeat: integer("last_heartbeat").notNull(), // milliseconds since epoch

    // Optional connection details (JSON)
    connectionDetails: text("connection_details"), // JSON: error messages, stream info, etc.

    // Metadata
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`), // milliseconds
  },
  (table) => ({
    // Index for efficient lookups by service name
    serviceNameIdx: index("service_status_service_name_idx").on(table.serviceName),
    // Index for heartbeat monitoring
    lastHeartbeatIdx: index("service_status_last_heartbeat_idx").on(table.lastHeartbeat),
  }),
);

export type ServiceStatus = typeof serviceStatus.$inferSelect;
export type NewServiceStatus = typeof serviceStatus.$inferInsert;
