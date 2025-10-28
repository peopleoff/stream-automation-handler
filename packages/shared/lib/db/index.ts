import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

import env from "../env";
import * as schema from "./schema";

const db = drizzle(env.DB_FILE_NAME, { schema, casing: "snake_case" });

export default db;
