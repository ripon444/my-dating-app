import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool
export const createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      global._postgresPool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon.tech') || databaseUrl.includes('ssl=true')
          ? { rejectUnauthorized: false }
          : false,
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_USER || 'postgres',
        password: process.env.SQL_PASSWORD || 'postgres',
        database: process.env.SQL_DB_NAME || 'dating_app',
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance
const pool = createPool();

export const getPool = createPool;
export { pool };

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
export { schema };
