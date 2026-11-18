import sql from '../config/postgres.js';

export interface Department {
  departmentId: string;
  departmentName: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type DepartmentRow = Omit<Department, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toDepartmentResponse(department: DepartmentRow): Department {
  return {
    ...department,
    createdAt: new Date(department.createdAt),
    updatedAt: new Date(department.updatedAt),
  };
}

const selectDepartmentColumns = sql`
  "departmentId", "departmentName", "createdBy", "createdAt", "updatedAt"
`;

export const departmentRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS departments (
        "departmentId" VARCHAR(80) PRIMARY KEY,
        "departmentName" VARCHAR(100) NOT NULL UNIQUE,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    for (const departmentName of ['Academics', 'Administration', 'Finance', 'Transport']) {
      await sql`
        INSERT INTO departments ("departmentId", "departmentName")
        VALUES (${`DEPT-${departmentName.toUpperCase()}`}, ${departmentName})
        ON CONFLICT ("departmentName") DO NOTHING
      `;
    }

    await sql`CREATE INDEX IF NOT EXISTS idx_departments_name ON departments("departmentName")`;
  },

  async findMany(search?: string): Promise<Department[]> {
    const query = search?.trim() ? `%${search.trim()}%` : null;
    const departments = await sql<DepartmentRow[]>`
      SELECT ${selectDepartmentColumns}
      FROM departments
      WHERE (${query}::text IS NULL OR "departmentName" ILIKE ${query})
      ORDER BY "departmentName" ASC
    `;
    return departments.map(toDepartmentResponse);
  },

  async findById(departmentId: string): Promise<Department | null> {
    const [department] = await sql<DepartmentRow[]>`
      SELECT ${selectDepartmentColumns} FROM departments WHERE "departmentId" = ${departmentId}
    `;
    return department ? toDepartmentResponse(department) : null;
  },

  async findByName(departmentName: string): Promise<Department | null> {
    const [department] = await sql<DepartmentRow[]>`
      SELECT ${selectDepartmentColumns}
      FROM departments WHERE LOWER("departmentName") = LOWER(${departmentName.trim()})
    `;
    return department ? toDepartmentResponse(department) : null;
  },

  async create(departmentName: string, createdBy?: string): Promise<Department> {
    const departmentId = `DEPT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const [department] = await sql<DepartmentRow[]>`
      INSERT INTO departments ("departmentId", "departmentName", "createdBy")
      VALUES (${departmentId}, ${departmentName}, ${createdBy || null})
      RETURNING ${selectDepartmentColumns}
    `;
    return toDepartmentResponse(department);
  },

  async update(departmentId: string, departmentName: string): Promise<Department | null> {
    const [department] = await sql<DepartmentRow[]>`
      UPDATE departments
      SET "departmentName" = ${departmentName}, "updatedAt" = NOW()
      WHERE "departmentId" = ${departmentId}
      RETURNING ${selectDepartmentColumns}
    `;
    return department ? toDepartmentResponse(department) : null;
  },

  async delete(departmentId: string): Promise<boolean> {
    const result = await sql`DELETE FROM departments WHERE "departmentId" = ${departmentId}`;
    return result.count > 0;
  },
};
