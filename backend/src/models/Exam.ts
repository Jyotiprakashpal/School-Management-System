import sql from '../config/postgres.js';

export interface Exam {
  id: number;
  name: string;
  term: string;
  session: string;
  classes: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamDto {
  name: string;
  term: string;
  session: string;
  classes: string;
  startDate: string;
  endDate: string;
  status?: 'Upcoming' | 'Active' | 'Completed';
  createdBy?: string;
}

export interface UpdateExamDto {
  name?: string;
  term?: string;
  session?: string;
  classes?: string;
  startDate?: string;
  endDate?: string;
  status?: 'Upcoming' | 'Active' | 'Completed';
}

export interface ExamQuery {
  page?: number;
  limit?: number;
  search?: string;
  session?: string;
  status?: string;
}

type ExamRow = Omit<Exam, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> & {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

function toExamResponse(exam: ExamRow): Exam {
  return {
    ...exam,
    startDate: exam.startDate,
    endDate: exam.endDate,
    createdAt: new Date(exam.createdAt),
    updatedAt: new Date(exam.updatedAt),
  };
}

const selectExamColumns = sql`
  id, name, term, session, classes, "startDate", "endDate", status, "createdBy", "createdAt", "updatedAt"
`;

export const examRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        term VARCHAR(50) NOT NULL,
        session VARCHAR(20) NOT NULL,
        classes VARCHAR(100) NOT NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Active', 'Completed')),
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exams_session ON exams(session)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exams_start_date ON exams("startDate")
    `;
  },

  async findMany(params: ExamQuery): Promise<{ data: Exam[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const session = params.session || null;
    const status = params.status || null;

    const exams = await sql<ExamRow[]>`
      SELECT ${selectExamColumns}
      FROM exams
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR term ILIKE ${search} OR classes ILIKE ${search})
        AND (${session}::text IS NULL OR session = ${session})
        AND (${status}::text IS NULL OR status = ${status})
      ORDER BY "startDate" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM exams
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR term ILIKE ${search} OR classes ILIKE ${search})
        AND (${session}::text IS NULL OR session = ${session})
        AND (${status}::text IS NULL OR status = ${status})
    `;

    return { data: exams.map(toExamResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Exam | null> {
    const [exam] = await sql<ExamRow[]>`
      SELECT ${selectExamColumns} FROM exams WHERE id = ${id}
    `;
    return exam ? toExamResponse(exam) : null;
  },

  async findByNameSession(name: string, session: string): Promise<Exam | null> {
    const [exam] = await sql<ExamRow[]>`
      SELECT ${selectExamColumns} FROM exams WHERE name = ${name} AND session = ${session}
    `;
    return exam ? toExamResponse(exam) : null;
  },

  async create(data: CreateExamDto): Promise<Exam> {
    const [exam] = await sql<ExamRow[]>`
      INSERT INTO exams (name, term, session, classes, "startDate", "endDate", status, "createdBy")
      VALUES (${data.name}, ${data.term}, ${data.session}, ${data.classes}, ${data.startDate}, ${data.endDate}, ${data.status || 'Upcoming'}, ${data.createdBy || null})
      RETURNING ${selectExamColumns}
    `;
    return toExamResponse(exam);
  },

  async update(id: number, data: Partial<UpdateExamDto>): Promise<Exam | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      name: data.name ?? current.name,
      term: data.term ?? current.term,
      session: data.session ?? current.session,
      classes: data.classes ?? current.classes,
      startDate: data.startDate ?? current.startDate,
      endDate: data.endDate ?? current.endDate,
      status: data.status ?? current.status,
    };

    const [exam] = await sql<ExamRow[]>`
      UPDATE exams
       SET name = ${next.name},
           term = ${next.term},
           session = ${next.session},
           classes = ${next.classes},
           "startDate" = ${next.startDate},
           "endDate" = ${next.endDate},
           status = ${next.status},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectExamColumns}
    `;
    return exam ? toExamResponse(exam) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM exams WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getStats(): Promise<{
    total: number;
    upcoming: number;
    active: number;
    completed: number;
  }> {
    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exams
    `;
    const [upcoming] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exams WHERE status = 'Upcoming'
    `;
    const [active] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exams WHERE status = 'Active'
    `;
    const [completed] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exams WHERE status = 'Completed'
    `;

    return {
      total: Number(total?.count || 0),
      upcoming: Number(upcoming?.count || 0),
      active: Number(active?.count || 0),
      completed: Number(completed?.count || 0),
    };
  },

  async getActiveOrNext(): Promise<Exam | null> {
    const [active] = await sql<ExamRow[]>`
      SELECT ${selectExamColumns} FROM exams WHERE status = 'Active' ORDER BY "startDate" LIMIT 1
    `;
    if (active) return toExamResponse(active);

    const [upcoming] = await sql<ExamRow[]>`
      SELECT ${selectExamColumns} FROM exams WHERE status = 'Upcoming' ORDER BY "startDate" LIMIT 1
    `;
    return upcoming ? toExamResponse(upcoming) : null;
  },
};