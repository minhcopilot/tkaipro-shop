import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { DB_DEV_LOGGER } from "~/app";

import * as schema from "./schema";

/**
 * Caches the database connection in development to
 * prevent creating a new connection on every HMR update.
 */
type DbConnection = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as {
  conn?: DbConnection;
};

// function to create connection with proper error handling
function createConnection(): DbConnection {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    // during build time in production, use dummy connection
    if (process.env.NODE_ENV === 'production') {
      console.warn("⚠️ DATABASE_URL not set during build time - using dummy connection");
      return postgres('postgresql://dummy:dummy@localhost:5432/dummy', {
        max: 1,
        idle_timeout: 1,
        connect_timeout: 1
      });
    }
    throw new Error("🔴 DATABASE_URL environment variable is not set");
  }
  
  // configure connection pool to prevent leaks
  return postgres(databaseUrl, {
    max: 25, // tăng từ 10 - worker poll 3s + expire query song song dễ exhaust pool
    idle_timeout: 20, // close idle nhanh hơn (30→20s) để giải phóng socket
    max_lifetime: 60 * 30, // close connections after 30 minutes
    connect_timeout: 10, // timeout after 10s
    prepare: false, // tránh prepared statement leak nếu có pgbouncer/proxy
  });
}

export const conn: DbConnection =
  globalForDb.conn ?? createConnection();
  
if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

// Database connection instance
export const db = drizzle(conn, {
  logger: DB_DEV_LOGGER && process.env.NODE_ENV !== "production",
  schema,
});
