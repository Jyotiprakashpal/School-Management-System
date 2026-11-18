import sql from '../config/postgres.js';

export interface SchoolClass {
  id: number;
  name: string;
  sections: string[];
  active: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

type SchoolClassRow = Omit<SchoolClass, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toSchoolClassResponse(row: SchoolClassRow): SchoolClass {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export const schoolClassRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS school_classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(80) NOT NULL UNIQUE,
        sections TEXT[] NOT NULL DEFAULT ARRAY['A', 'B', 'C']::TEXT[],
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedBy" TEXT
      )
    `;
    await sql`
      ALTER TABLE school_classes
      ADD COLUMN IF NOT EXISTS sections TEXT[] NOT NULL DEFAULT ARRAY['A', 'B', 'C']::TEXT[],
      ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS "updatedBy" TEXT
    `;
    await sql`
      UPDATE school_classes
      SET "createdBy" = 'System'
      WHERE "createdBy" IS NULL
    `;
    await sql`
      INSERT INTO school_classes (name, "createdBy")
      VALUES ${sql(["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"].map((name) => [name, "System"]))}
      ON CONFLICT (name) DO NOTHING
    `;
  },

  async findAll(): Promise<SchoolClass[]> {
    const rows = await sql<SchoolClassRow[]>`
      SELECT id, name, sections, active, "createdBy", "createdAt", "updatedAt", "updatedBy"
      FROM school_classes
      WHERE active = TRUE
      ORDER BY id
    `;
    return rows.map(toSchoolClassResponse);
  },
};
