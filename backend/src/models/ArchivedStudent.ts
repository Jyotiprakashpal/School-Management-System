import sql from '../config/postgres.js';

export interface ArchivedStudent {
  id: number;
  admissionNo: string;
  name: string;
  fatherName: string;
  className: string;
  passingYear: string;
  tcNumber: string;
  phone: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArchivedStudentDto {
  admissionNo: string;
  name: string;
  fatherName?: string;
  className: string;
  passingYear: string;
  phone?: string;
  reason?: string;
  tcNumber?: string;
}

export interface UpdateArchivedStudentDto {
  name?: string;
  fatherName?: string;
  className?: string;
  passingYear?: string;
  phone?: string;
  reason?: string;
  tcNumber?: string;
}

export interface ArchivedStudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  passingYear?: string;
  className?: string;
  reason?: string;
}

type ArchivedStudentRow = Omit<ArchivedStudent, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toArchivedStudentResponse(student: ArchivedStudentRow): ArchivedStudent {
  return {
    ...student,
    createdAt: new Date(student.createdAt),
    updatedAt: new Date(student.updatedAt),
  };
}

const selectArchivedStudentColumns = sql`
  id, "admissionNo", name, "fatherName", "className", "passingYear", "tcNumber", phone, reason, "createdAt", "updatedAt"
`;

export const archivedStudentRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS archived_students (
        id SERIAL PRIMARY KEY,
        "admissionNo" VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        "fatherName" VARCHAR(120),
        "className" VARCHAR(50),
        "passingYear" VARCHAR(20),
        "tcNumber" VARCHAR(80) UNIQUE,
        phone VARCHAR(40),
        reason VARCHAR(100),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_archived_students_admission_no ON archived_students("admissionNo")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_archived_students_name ON archived_students(name)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_archived_students_passing_year ON archived_students("passingYear")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_archived_students_tc_number ON archived_students("tcNumber")
    `;
  },

  async findMany(params: ArchivedStudentQuery): Promise<{ data: ArchivedStudent[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const passingYear = params.passingYear || null;
    const className = params.className || null;
    const reason = params.reason || null;

    const students = await sql<ArchivedStudentRow[]>`
      SELECT ${selectArchivedStudentColumns}
      FROM archived_students
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "admissionNo" ILIKE ${search} OR "tcNumber" ILIKE ${search} OR "fatherName" ILIKE ${search})
        AND (${passingYear}::text IS NULL OR "passingYear" = ${passingYear})
        AND (${className}::text IS NULL OR "className" ILIKE ${className} || '%')
        AND (${reason}::text IS NULL OR reason ILIKE ${reason})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM archived_students
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "admissionNo" ILIKE ${search} OR "tcNumber" ILIKE ${search} OR "fatherName" ILIKE ${search})
        AND (${passingYear}::text IS NULL OR "passingYear" = ${passingYear})
        AND (${className}::text IS NULL OR "className" ILIKE ${className} || '%')
        AND (${reason}::text IS NULL OR reason ILIKE ${reason})
    `;

    return { data: students.map(toArchivedStudentResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<ArchivedStudent | null> {
    const [student] = await sql<ArchivedStudentRow[]>`
      SELECT ${selectArchivedStudentColumns} FROM archived_students WHERE id = ${id}
    `;
    return student ? toArchivedStudentResponse(student) : null;
  },

  async findByAdmissionNo(admissionNo: string): Promise<ArchivedStudent | null> {
    const [student] = await sql<ArchivedStudentRow[]>`
      SELECT ${selectArchivedStudentColumns} FROM archived_students WHERE "admissionNo" = ${admissionNo}
    `;
    return student ? toArchivedStudentResponse(student) : null;
  },

  async findByTcNumber(tcNumber: string): Promise<ArchivedStudent | null> {
    const [student] = await sql<ArchivedStudentRow[]>`
      SELECT ${selectArchivedStudentColumns} FROM archived_students WHERE "tcNumber" = ${tcNumber}
    `;
    return student ? toArchivedStudentResponse(student) : null;
  },

  async create(data: CreateArchivedStudentDto): Promise<ArchivedStudent> {
    const [student] = await sql<ArchivedStudentRow[]>`
      INSERT INTO archived_students ("admissionNo", name, "fatherName", "className", "passingYear", "tcNumber", phone, reason)
      VALUES (${data.admissionNo}, ${data.name}, ${data.fatherName || null}, ${data.className}, ${data.passingYear}, ${data.tcNumber || null}, ${data.phone || null}, ${data.reason || null})
      RETURNING ${selectArchivedStudentColumns}
    `;
    return toArchivedStudentResponse(student);
  },

  async update(id: number, data: Partial<UpdateArchivedStudentDto>): Promise<ArchivedStudent | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      name: data.name ?? current.name,
      fatherName: data.fatherName ?? current.fatherName,
      className: data.className ?? current.className,
      passingYear: data.passingYear ?? current.passingYear,
      phone: data.phone ?? current.phone,
      reason: data.reason ?? current.reason,
      tcNumber: data.tcNumber ?? current.tcNumber,
    };

    const [student] = await sql<ArchivedStudentRow[]>`
      UPDATE archived_students
       SET name = ${next.name},
           "fatherName" = ${next.fatherName},
           "className" = ${next.className},
           "passingYear" = ${next.passingYear},
           phone = ${next.phone},
           reason = ${next.reason},
           "tcNumber" = ${next.tcNumber},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectArchivedStudentColumns}
    `;
    return student ? toArchivedStudentResponse(student) : null;
  },

  async delete(id: number): Promise<boolean> {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM archived_students WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  },

  async getStats(): Promise<{
    totalArchived: number;
    latestYear: string | null;
    latestYearCount: number;
    tcIssuedCount: number;
    passedOutCount: number;
    otherReasonsCount: number;
  }> {
    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM archived_students
    `;

    const [latestYear] = await sql<{ passingYear: string }[]>`
      SELECT DISTINCT "passingYear" FROM archived_students ORDER BY "passingYear" DESC LIMIT 1
    `;

    const [latestYearCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM archived_students WHERE "passingYear" = ${latestYear?.passingYear || ''}
    `;

    const [tcIssuedCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM archived_students WHERE "tcNumber" IS NOT NULL AND "tcNumber" != ''
    `;

    const [passedOutCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM archived_students WHERE reason ILIKE 'passed%'
    `;

    const [otherReasonsCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM archived_students WHERE reason NOT ILIKE 'passed%'
    `;

    return {
      totalArchived: Number(total?.count || 0),
      latestYear: latestYear?.passingYear || null,
      latestYearCount: Number(latestYearCount?.count || 0),
      tcIssuedCount: Number(tcIssuedCount?.count || 0),
      passedOutCount: Number(passedOutCount?.count || 0),
      otherReasonsCount: Number(otherReasonsCount?.count || 0),
    };
  },

  async getYears(): Promise<string[]> {
    const years = await sql<{ passingYear: string }[]>`
      SELECT DISTINCT "passingYear" FROM archived_students ORDER BY "passingYear" DESC
    `;
    return years.map(y => y.passingYear);
  },
};