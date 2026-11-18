import sql from '../config/postgres.js';

export interface Gender { id: number; name: string; active: boolean; }

export const genderRepository = {
  async initializeTable(): Promise<void> {
    await sql`CREATE TABLE IF NOT EXISTS genders (id SERIAL PRIMARY KEY, name VARCHAR(40) NOT NULL UNIQUE, active BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`INSERT INTO genders (name) VALUES ${sql([["Male"], ["Female"], ["Other"]])} ON CONFLICT (name) DO NOTHING`;
  },
  async findAll(): Promise<Gender[]> { return sql<Gender[]>`SELECT id, name, active FROM genders WHERE active = TRUE ORDER BY id`; },
};
