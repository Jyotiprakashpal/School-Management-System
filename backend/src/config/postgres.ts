import 'dotenv/config';
import dns from 'node:dns';
import postgres from 'postgres';

dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in backend/.env');
}

export const sql = postgres(connectionString, {
  // Supabase session-mode poolers have a small shared client limit. Keep the
  // app pool deliberately small so multiple dev/production instances cannot
  // exhaust the provider pool.
  max: Math.max(1, Number(process.env.DATABASE_POOL_MAX || 1)),
  idle_timeout: Number(process.env.DATABASE_IDLE_TIMEOUT || 20),
  max_lifetime: Number(process.env.DATABASE_MAX_LIFETIME || 300),
  connect_timeout: 15,
  ssl: process.env.DATABASE_SSL === 'false' ? false : 'require',
  onnotice: () => {},
});

export const connectPostgres = async () => {
  await sql`SELECT 1`;
};

export default sql;
