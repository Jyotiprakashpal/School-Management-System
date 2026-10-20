import 'dotenv/config';
import postgres from 'postgres';

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
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      adm VARCHAR(80) NOT NULL UNIQUE,
      "className" VARCHAR(120) NOT NULL,
      father VARCHAR(120) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      fees JSONB NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

export default sql;
