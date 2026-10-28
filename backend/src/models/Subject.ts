import sql from '../config/postgres.js';

export interface Subject {
  id: number;
  code: string;
  name: string;
  type: 'Core' | 'Language' | 'Elective' | 'Activity';
  classes: string;
  teachers: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubjectDto {
  code: string;
  name: string;
  type: 'Core' | 'Language' | 'Elective' | 'Activity';
  classes: string;
  teachers: number;
  status?: 'Active' | 'Inactive';
}

export interface UpdateSubjectDto {
  code?: string;
  name?: string;
  type?: 'Core' | 'Language' | 'Elective' | 'Activity';
  classes?: string;
  teachers?: number;
  status?: 'Active' | 'Inactive';
}

export interface SubjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

type SubjectRow = Omit<Subject, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toSubjectResponse(subject: SubjectRow): Subject {
  return {
    ...subject,
    createdAt: new Date(subject.createdAt),
    updatedAt: new Date(subject.updatedAt),
  };
}

const selectSubjectColumns = sql`
  id, code, name, type, classes, teachers, status, "createdAt", "updatedAt"
`;

export const subjectRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('Core', 'Language', 'Elective', 'Activity')),
        classes VARCHAR(100) NOT NULL,
        teachers INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_subjects_type ON subjects(type)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_subjects_status ON subjects(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code)
    `;
  },

  async findMany(params: SubjectQuery): Promise<{ data: Subject[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const type = params.type || null;
    const status = params.status || null;

    const subjects = await sql<SubjectRow[]>`
      SELECT ${selectSubjectColumns}
      FROM subjects
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR code ILIKE ${search} OR classes ILIKE ${search})
        AND (${type}::text IS NULL OR type = ${type})
        AND (${status}::text IS NULL OR status = ${status})
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM subjects
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR code ILIKE ${search} OR classes ILIKE ${search})
        AND (${type}::text IS NULL OR type = ${type})
        AND (${status}::text IS NULL OR status = ${status})
    `;

    return { data: subjects.map(toSubjectResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Subject | null> {
    const [subject] = await sql<SubjectRow[]>`
      SELECT ${selectSubjectColumns} FROM subjects WHERE id = ${id}
    `;
    return subject ? toSubjectResponse(subject) : null;
  },

  async findByCode(code: string): Promise<Subject | null> {
    const [subject] = await sql<SubjectRow[]>`
      SELECT ${selectSubjectColumns} FROM subjects WHERE code = ${code}
    `;
    return subject ? toSubjectResponse(subject) : null;
  },

  async create(data: CreateSubjectDto): Promise<Subject> {
    const [subject] = await sql<SubjectRow[]>`
      INSERT INTO subjects (code, name, type, classes, teachers, status)
      VALUES (${data.code.toUpperCase()}, ${data.name}, ${data.type}, ${data.classes}, ${data.teachers}, ${data.status || 'Active'})
      RETURNING ${selectSubjectColumns}
    `;
    return toSubjectResponse(subject);
  },

  async update(id: number, data: Partial<UpdateSubjectDto>): Promise<Subject | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      code: data.code?.toUpperCase() ?? current.code,
      name: data.name ?? current.name,
      type: data.type ?? current.type,
      classes: data.classes ?? current.classes,
      teachers: data.teachers ?? current.teachers,
      status: data.status ?? current.status,
    };

    const [subject] = await sql<SubjectRow[]>`
      UPDATE subjects
       SET code = ${next.code},
           name = ${next.name},
           type = ${next.type},
           classes = ${next.classes},
           teachers = ${next.teachers},
           status = ${next.status},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectSubjectColumns}
    `;
    return subject ? toSubjectResponse(subject) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM subjects WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    totalTeachers: number;
  }> {
    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM subjects
    `;
    const [active] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM subjects WHERE status = 'Active'
    `;
    const [totalTeachers] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(teachers), 0)::text AS sum FROM subjects
    `;
    const byTypeResult = await sql<{ type: string; count: string }[]>`
      SELECT type, COUNT(*)::text AS count FROM subjects GROUP BY type
    `;
    const byType: Record<string, number> = {};
    for (const row of byTypeResult) {
      byType[row.type] = Number(row.count);
    }

    return {
      total: Number(total?.count || 0),
      active: Number(active?.count || 0),
      totalTeachers: Number(totalTeachers?.sum || 0),
      byType,
    };
  },

  async getTypes(): Promise<string[]> {
    const result = await sql<{ type: string }[]>`
      SELECT DISTINCT type FROM subjects ORDER BY type
    `;
    return result.map(r => r.type);
  },

  async getStatuses(): Promise<string[]> {
    const result = await sql<{ status: string }[]>`
      SELECT DISTINCT status FROM subjects ORDER BY status
    `;
    return result.map(r => r.status);
  },
};