import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_FILE_NAME?.replace("file:", "") || "../../data/local.db",
  },
  casing: "snake_case",
});
