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
  onnotice: () => {},
});

export const connectPostgres = async () => {
  await sql`SELECT 1`;
};

export default sql;
