import sql from '../config/postgres.js';
export interface Category { id: number; name: string; active: boolean; }
export const categoryRepository = {
  async initializeTable(): Promise<void> { await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, active BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`; },
  async findAll(): Promise<Category[]> { return sql<Category[]>`SELECT id, name, active FROM categories WHERE active = TRUE ORDER BY name ASC`; },
  async create(name: string): Promise<Category> { const [item] = await sql<Category[]>`INSERT INTO categories (name) VALUES (${name}) RETURNING id, name, active`; return item; },
};
