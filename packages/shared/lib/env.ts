/**
 * Environment variable handling for shared package
 * Apps using this package should set these environment variables
 */

interface Env {
  DB_FILE_NAME: string;
  NODE_ENV: string;
}

// Get environment variables with defaults
const env: Env = {
  DB_FILE_NAME: process.env.DB_FILE_NAME || "file:../../data/local.db",
  NODE_ENV: process.env.NODE_ENV || "development",
};

export default env;
