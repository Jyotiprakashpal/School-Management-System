import sql from '../config/postgres.js';

export interface Student {
  userId: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  class: string;
  section: string;
  phone: string;
  gender: string;
  admissionDate: Date;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentDto {
  userId: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  class: string;
  section: string;
  phone: string;
  gender: string;
  admissionDate: string | Date;
  createdBy?: string;
}

export interface UpdateStudentDto {
  name?: string;
  admissionNo?: string;
  fatherName?: string;
  class?: string;
  section?: string;
  phone?: string;
  gender?: string;
  admissionDate?: string | Date;
}

export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  section?: string;
  userId?: string;
}

type StudentRow = Omit<Student, 'admissionDate'> & { admissionDate: string };

function toStudentResponse(student: StudentRow): Student {
  return { ...student, admissionDate: new Date(student.admissionDate) };
}

const selectStudentColumns = sql`
  "userId", name, "admissionNo", "fatherName", class, section, phone, gender, "admissionDate", "createdBy", "createdAt", "updatedAt"
`;

export const studentRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        "userId" TEXT PRIMARY KEY REFERENCES users("userId") ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        "admissionNo" VARCHAR(80) NOT NULL UNIQUE,
        "fatherName" VARCHAR(120) NOT NULL,
        class VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        phone VARCHAR(40) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        "admissionDate" DATE NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  },

  async findMany(params: StudentQuery): Promise<{ data: Student[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const className = params.class || null;
    const section = params.section || null;
    const userId = params.userId || null;

    const students = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns}
      FROM students
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "admissionNo" ILIKE ${search} OR "fatherName" ILIKE ${search})
        AND (${className}::text IS NULL OR class = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${userId}::text IS NULL OR "userId" = ${userId})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM students
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "admissionNo" ILIKE ${search} OR "fatherName" ILIKE ${search})
        AND (${className}::text IS NULL OR class = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${userId}::text IS NULL OR "userId" = ${userId})
    `;

    return { data: students.map(toStudentResponse), total: Number(total?.count || 0) };
  },

  async findByCompositeKey(userId: string, admissionNo: string): Promise<Student | null> {
    const [student] = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns} FROM students WHERE "userId" = ${userId} AND "admissionNo" = ${admissionNo}
    `;
    return student ? toStudentResponse(student) : null;
  },

  async findByAdmissionNo(admissionNo: string): Promise<Student | null> {
    const [student] = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns} FROM students WHERE "admissionNo" = ${admissionNo}
    `;
    return student ? toStudentResponse(student) : null;
  },

  async findByUserId(userId: string): Promise<Student[]> {
    const students = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns} FROM students WHERE "userId" = ${userId} ORDER BY "createdAt" DESC
    `;
    return students.map(toStudentResponse);
  },

  async create(data: CreateStudentDto): Promise<Student> {
    const [student] = await sql<StudentRow[]>`
      INSERT INTO students ("userId", name, "admissionNo", "fatherName", class, section, phone, gender, "admissionDate", "createdBy")
      VALUES (${data.userId}, ${data.name.trim()}, ${data.admissionNo.trim()}, ${data.fatherName.trim()}, ${data.class.trim()}, ${data.section.trim()}, ${data.phone.trim()}, ${data.gender.trim()}, ${data.admissionDate}, ${data.createdBy || null})
      RETURNING ${selectStudentColumns}
    `;
    return toStudentResponse(student);
  },

  async update(userId: string, admissionNo: string, data: Partial<UpdateStudentDto>): Promise<Student | null> {
    const current = await this.findByCompositeKey(userId, admissionNo);
    if (!current) return null;

    const next = {
      name: data.name ?? current.name,
      admissionNo: data.admissionNo ?? current.admissionNo,
      fatherName: data.fatherName ?? current.fatherName,
      class: data.class ?? current.class,
      section: data.section ?? current.section,
      phone: data.phone ?? current.phone,
      gender: data.gender ?? current.gender,
      admissionDate: data.admissionDate ?? current.admissionDate
    };

    const [student] = await sql<StudentRow[]>`
      UPDATE students
       SET name = ${next.name.trim()},
           "admissionNo" = ${next.admissionNo.trim()},
           "fatherName" = ${next.fatherName.trim()},
           class = ${next.class.trim()},
           section = ${next.section.trim()},
           phone = ${next.phone.trim()},
           gender = ${next.gender.trim()},
           "admissionDate" = ${next.admissionDate},
           "updatedAt" = NOW()
       WHERE "userId" = ${userId} AND "admissionNo" = ${admissionNo}
       RETURNING ${selectStudentColumns}
    `;
    return student ? toStudentResponse(student) : null;
  },

  async delete(userId: string, admissionNo: string): Promise<boolean> {
    const rows = await sql<{ "userId": string }[]>`
      DELETE FROM students WHERE "userId" = ${userId} AND "admissionNo" = ${admissionNo} RETURNING "userId"
    `;
    return rows.length > 0;
  }
};