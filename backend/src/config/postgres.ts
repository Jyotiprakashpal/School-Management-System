import 'dotenv/config';
import dns from 'node:dns';
import postgres from 'postgres';

dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in backend/.env');
}

export const sql = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  connect_timeout: 15,
  ssl: process.env.DATABASE_SSL === 'false' ? false : 'require',
});

export const connectPostgres = async () => {
  await sql`SELECT 1`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      role VARCHAR(40) NOT NULL DEFAULT 'user',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

export default sql;
