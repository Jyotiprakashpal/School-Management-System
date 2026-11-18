import sql from '../config/postgres.js';

export interface BloodGroup { id: number; name: string; active: boolean; }

export const bloodGroupRepository = {
  async initializeTable(): Promise<void> {
    await sql`CREATE TABLE IF NOT EXISTS blood_groups (id SERIAL PRIMARY KEY, name VARCHAR(10) NOT NULL UNIQUE, active BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`INSERT INTO blood_groups (name) VALUES ${sql([["A+"], ["A-"], ["B+"], ["B-"], ["AB+"], ["AB-"], ["O+"], ["O-"]])} ON CONFLICT (name) DO NOTHING`;
  },
  async findAll(): Promise<BloodGroup[]> { return sql<BloodGroup[]>`SELECT id, name, active FROM blood_groups WHERE active = TRUE ORDER BY id`; },
};
