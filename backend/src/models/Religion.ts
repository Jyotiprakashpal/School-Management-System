import sql from '../config/postgres.js';

export interface Religion { id: number; name: string; active: boolean; }

export const religionRepository = {
  async initializeTable(): Promise<void> {
    await sql`CREATE TABLE IF NOT EXISTS religions (id SERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, active BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  },
  async findAll(): Promise<Religion[]> {
    return sql<Religion[]>`SELECT id, name, active FROM religions WHERE active = TRUE ORDER BY name ASC`;
  },
  async create(name: string): Promise<Religion> {
    const [religion] = await sql<Religion[]>`INSERT INTO religions (name) VALUES (${name}) RETURNING id, name, active`;
    return religion;
  },
  async update(id: number, name: string): Promise<Religion | null> {
    const [religion] = await sql<Religion[]>`UPDATE religions SET name = ${name} WHERE id = ${id} RETURNING id, name, active`;
    return religion || null;
  },
  async delete(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM religions WHERE id = ${id}`;
    return result.count > 0;
  },
};
