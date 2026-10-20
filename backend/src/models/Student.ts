import sql from '../config/postgres.js';

export interface FeeHead {
  id: number;
  name: string;
  amount: number;
  paid: number;
  selected?: boolean;
}

export interface Student {
  id: number;
  name: string;
  adm: string;
  className: string;
  father: string;
  phone: string;
  fees: FeeHead[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentDto {
  name: string;
  adm: string;
  className: string;
  father: string;
  phone: string;
  fees?: FeeHead[];
}

export interface UpdateStudentDto {
  name?: string;
  adm?: string;
  className?: string;
  father?: string;
  phone?: string;
  fees?: FeeHead[];
}

export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
}

export const isFeeHeadArray = (value: unknown): value is FeeHead[] =>
  Array.isArray(value) &&
  value.every((fee) =>
    fee !== null &&
    typeof fee === 'object' &&
    typeof (fee as FeeHead).name === 'string' &&
    typeof (fee as FeeHead).amount === 'number' &&
    typeof (fee as FeeHead).paid === 'number'
  );

type StudentRow = Omit<Student, 'fees'> & { fees: FeeHead[] | null };

function toStudentResponse(student: StudentRow): Student {
  return { ...student, fees: student.fees || [] };
}

const selectStudentColumns = sql`
  id, name, adm, "className", father, phone, fees, "createdAt", "updatedAt"
`;

export const studentRepository = {
  async findMany(params: StudentQuery): Promise<{ data: Student[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const className = params.className || null;

    const students = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns}
      FROM students
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR adm ILIKE ${search} OR father ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM students
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR adm ILIKE ${search} OR father ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
    `;

    return { data: students.map(toStudentResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Student | null> {
    const [student] = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns} FROM students WHERE id = ${id}
    `;
    return student ? toStudentResponse(student) : null;
  },

  async findByAdm(adm: string): Promise<Student | null> {
    const [student] = await sql<StudentRow[]>`
      SELECT ${selectStudentColumns} FROM students WHERE adm = ${adm}
    `;
    return student ? toStudentResponse(student) : null;
  },

  async create(data: CreateStudentDto): Promise<Student> {
    const [student] = await sql<StudentRow[]>`
      INSERT INTO students (name, adm, "className", father, phone, fees)
      VALUES (${data.name.trim()}, ${data.adm.trim()}, ${data.className.trim()}, ${data.father.trim()}, ${data.phone.trim()}, ${sql.json(JSON.parse(JSON.stringify(data.fees || [])))})
      RETURNING ${selectStudentColumns}
    `;
    return toStudentResponse(student);
  },

  async update(id: number, data: Partial<UpdateStudentDto>): Promise<Student | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      name: data.name ?? current.name,
      adm: data.adm ?? current.adm,
      className: data.className ?? current.className,
      father: data.father ?? current.father,
      phone: data.phone ?? current.phone,
      fees: data.fees ?? current.fees
    };

    const [student] = await sql<StudentRow[]>`
      UPDATE students
       SET name = ${next.name.trim()},
           adm = ${next.adm.trim()},
           "className" = ${next.className.trim()},
           father = ${next.father.trim()},
           phone = ${next.phone.trim()},
           fees = ${sql.json(JSON.parse(JSON.stringify(next.fees)))},
          "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectStudentColumns}
    `;
    return student ? toStudentResponse(student) : null;
  },

  async delete(id: number): Promise<boolean> {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM students WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }
};
