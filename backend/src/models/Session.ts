import sql from '../config/postgres.js';

export interface AcademicSession {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionDto {
  name: string;
  startDate: string;
  endDate: string;
  current?: boolean;
}

export interface UpdateSessionDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface SessionQuery {
  page?: number;
  limit?: number;
  search?: string;
}

type SessionRow = Omit<AcademicSession, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toSessionResponse(row: SessionRow): AcademicSession {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

const selectSessionColumns = sql`
  id, name, "startDate", "endDate", current, "createdAt", "updatedAt"
`;

export const sessionRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS academic_sessions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        current BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_academic_sessions_current ON academic_sessions(current)
    `;
  },

  async findMany(params: SessionQuery): Promise<{ data: AcademicSession[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;

    const sessions = await sql<AcademicSession[]>`
      SELECT ${selectSessionColumns}
      FROM academic_sessions
      WHERE (${search}::text IS NULL OR name ILIKE ${search})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM academic_sessions
      WHERE (${search}::text IS NULL OR name ILIKE ${search})
    `;

    return { data: sessions, total: Number(total?.count || 0) };
  },

  async findAll(): Promise<AcademicSession[]> {
    const sessions = await sql<AcademicSession[]>`
      SELECT ${selectSessionColumns}
      FROM academic_sessions
      ORDER BY "createdAt" DESC
    `;
    return sessions;
  },

  async findById(id: number): Promise<AcademicSession | null> {
    const [session] = await sql<AcademicSession[]>`
      SELECT ${selectSessionColumns} FROM academic_sessions WHERE id = ${id}
    `;
    return session || null;
  },

  async findCurrent(): Promise<AcademicSession | null> {
    const [session] = await sql<AcademicSession[]>`
      SELECT ${selectSessionColumns} FROM academic_sessions WHERE current = TRUE
    `;
    return session || null;
  },

  async create(data: CreateSessionDto): Promise<AcademicSession> {
    // If setting as current, unset all others
    if (data.current) {
      await sql`
        UPDATE academic_sessions SET current = FALSE, "updatedAt" = NOW()
      `;
    }

    const [session] = await sql<AcademicSession[]>`
      INSERT INTO academic_sessions (name, "startDate", "endDate", current)
      VALUES (${data.name}, ${data.startDate}, ${data.endDate}, ${data.current || false})
      RETURNING ${selectSessionColumns}
    `;
    return session;
  },

  async update(id: number, data: Partial<UpdateSessionDto>): Promise<AcademicSession | null> {
    // If setting as current, unset all others
    if (data.current === true) {
      await sql`
        UPDATE academic_sessions SET current = FALSE, "updatedAt" = NOW()
      `;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(data.name); }
    if (data.startDate !== undefined) { updates.push('"startDate" = $' + (values.length + 1)); values.push(data.startDate); }
    if (data.endDate !== undefined) { updates.push('"endDate" = $' + (values.length + 1)); values.push(data.endDate); }
    if (data.current !== undefined) { updates.push('current = $' + (values.length + 1)); values.push(data.current); }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE academic_sessions SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectSessionColumns}`;
    const [session] = await sql.unsafe(query, values) as AcademicSession[];
    return session || null;
  },

  async setCurrent(id: number): Promise<AcademicSession | null> {
    // Unset all current
    await sql`
      UPDATE academic_sessions SET current = FALSE, "updatedAt" = NOW()
    `;

    const [session] = await sql<AcademicSession[]>`
      UPDATE academic_sessions SET current = TRUE, "updatedAt" = NOW() WHERE id = ${id} RETURNING ${selectSessionColumns}
    `;
    return session || null;
  },

  async delete(id: number): Promise<boolean> {
    const [session] = await sql<AcademicSession[]>`
      SELECT ${selectSessionColumns} FROM academic_sessions WHERE id = ${id}
    `;
    if (!session) return false;

    if (session.current) {
      return false; // Cannot delete current session
    }

    const result = await sql`
      DELETE FROM academic_sessions WHERE id = ${id}
    `;
    return result.count > 0;
  },
};