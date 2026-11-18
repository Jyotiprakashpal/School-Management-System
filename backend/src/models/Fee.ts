import sql from '../config/postgres.js';

export interface FeeHead {
  id: number;
  className: string;
  name: string;
  amount: number;
  year: string;
  frequency: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeeHeadDto {
  className: string;
  name: string;
  amount: number;
  year: string;
  frequency: string;
  createdBy?: string;
}

export interface UpdateFeeHeadDto {
  className?: string;
  name?: string;
  amount?: number;
  year?: string;
  frequency?: string;
}

export interface FeeHeadQuery {
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
  year?: string;
}

export interface FeeAssignment {
  id: number;
  className: string;
  year: string;
  students: number;
  heads: number;
  perStudent: number;
  createdAt: Date;
}

export interface CreateFeeAssignmentDto {
  className: string;
  year: string;
  createdBy?: string;
}

export interface FeeAssignmentQuery {
  page?: number;
  limit?: number;
  className?: string;
  year?: string;
}

export interface FeeStats {
  feeTypes: number;
  classesCovered: number;
  studentsAssigned: number;
  combinedAmount: number;
}

type FeeHeadRow = Omit<FeeHead, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
type FeeAssignmentRow = Omit<FeeAssignment, 'createdAt'> & { createdAt: string };

function toFeeHeadResponse(fee: FeeHeadRow): FeeHead {
  return { ...fee, createdAt: new Date(fee.createdAt), updatedAt: new Date(fee.updatedAt) };
}

function toFeeAssignmentResponse(assignment: FeeAssignmentRow): FeeAssignment {
  return { ...assignment, createdAt: new Date(assignment.createdAt) };
}

const selectFeeHeadColumns = sql`
  id, "className", name, amount, year, frequency, "createdBy", "createdAt", "updatedAt"
`;

const selectFeeAssignmentColumns = sql`
  id, "className", year, students, heads, "perStudent", "createdAt"
`;

export const feeRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS fee_heads (
        id SERIAL PRIMARY KEY,
        "className" VARCHAR(50) NOT NULL,
        name VARCHAR(120) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        year VARCHAR(20) NOT NULL,
        frequency VARCHAR(20) NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("className", name, year)
      )
    `;
    // `CREATE TABLE IF NOT EXISTS` does not add columns to an existing
    // installation. Keep older databases compatible with the current fee
    // repository, which writes and reads these audit columns.
    await sql`
      ALTER TABLE fee_heads
        ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_heads_class_year ON fee_heads("className", year)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_heads_name ON fee_heads(name)
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS fee_frequencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL UNIQUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO fee_frequencies (name)
      VALUES ${sql([["One Time"], ["Monthly"], ["Quarterly"], ["Half Yearly"], ["Yearly"]])}
      ON CONFLICT (name) DO NOTHING
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS fee_assignments (
        id SERIAL PRIMARY KEY,
        "className" VARCHAR(50) NOT NULL,
        year VARCHAR(20) NOT NULL,
        students INTEGER NOT NULL,
        heads INTEGER NOT NULL,
        "perStudent" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_assignments_class_year ON fee_assignments("className", year)
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_fee_assignments_class_year
      ON fee_assignments("className", year)
    `;
  },

  async findManyFeeHeads(params: FeeHeadQuery): Promise<{ data: FeeHead[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const className = params.className || null;
    const year = params.year || null;

    const fees = await sql<FeeHeadRow[]>`
      SELECT ${selectFeeHeadColumns}
      FROM fee_heads
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "className" ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${year}::text IS NULL OR year = ${year})
      ORDER BY "className", name
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM fee_heads
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "className" ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${year}::text IS NULL OR year = ${year})
    `;

    return { data: fees.map(toFeeHeadResponse), total: Number(total?.count || 0) };
  },

  async findFeeHeadById(id: number): Promise<FeeHead | null> {
    const [fee] = await sql<FeeHeadRow[]>`
      SELECT ${selectFeeHeadColumns} FROM fee_heads WHERE id = ${id}
    `;
    return fee ? toFeeHeadResponse(fee) : null;
  },

  async findFeeHeadsByClassAndYear(className: string, year: string): Promise<FeeHead[]> {
    const fees = await sql<FeeHeadRow[]>`
      SELECT ${selectFeeHeadColumns}
      FROM fee_heads
      WHERE "className" = ${className} AND year = ${year}
      ORDER BY name
    `;
    return fees.map(toFeeHeadResponse);
  },

  async createFeeHead(data: CreateFeeHeadDto): Promise<FeeHead> {
    const [fee] = await sql<FeeHeadRow[]>`
      INSERT INTO fee_heads ("className", name, amount, year, frequency, "createdBy")
      VALUES (${data.className}, ${data.name}, ${data.amount}, ${data.year}, ${data.frequency}, ${data.createdBy || null})
      RETURNING ${selectFeeHeadColumns}
    `;
    return toFeeHeadResponse(fee);
  },

async updateFeeHead(id: number, data: Partial<UpdateFeeHeadDto>): Promise<FeeHead | null> {
    const current = await this.findFeeHeadById(id);
    if (!current) return null;

    const next = {
      className: data.className ?? current.className,
      name: data.name ?? current.name,
      amount: data.amount ?? current.amount,
      year: data.year ?? current.year,
      frequency: data.frequency ?? current.frequency,
    };

    const [fee] = await sql<FeeHeadRow[]>`
      UPDATE fee_heads
       SET "className" = ${next.className},
           name = ${next.name},
           amount = ${next.amount},
           year = ${next.year},
           frequency = ${next.frequency},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectFeeHeadColumns}
    `;
    return fee ? toFeeHeadResponse(fee) : null;
  },

  async deleteFeeHead(id: number): Promise<boolean> {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM fee_heads WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  },

  async checkDuplicateFeeHead(className: string, name: string, year: string, ignoreId?: number): Promise<boolean> {
    const [result] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM fee_heads
      WHERE "className" = ${className}
        AND name = ${name}
        AND year = ${year}
        ${ignoreId ? sql`AND id != ${ignoreId}` : sql``}
    `;
    return Number(result?.count || 0) > 0;
  },

  async getFeeHeadsByClass(className: string): Promise<FeeHead[]> {
    const fees = await sql<FeeHeadRow[]>`
      SELECT ${selectFeeHeadColumns}
      FROM fee_heads
      WHERE "className" = ${className}
      ORDER BY year DESC, name
    `;
    return fees.map(toFeeHeadResponse);
  },

  async getFeeStats(year: string): Promise<{ feeTypes: number; classesCovered: number; combinedAmount: number }> {
    const [feeTypes] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM fee_heads WHERE year = ${year}
    `;

    const [classesCovered] = await sql<{ count: string }[]>`
      SELECT COUNT(DISTINCT "className")::text AS count FROM fee_heads WHERE year = ${year}
    `;

    const [combinedAmount] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(amount), 0)::text AS sum FROM fee_heads WHERE year = ${year}
    `;

    return {
      feeTypes: Number(feeTypes?.count || 0),
      classesCovered: Number(classesCovered?.count || 0),
      combinedAmount: Number(combinedAmount?.sum || 0),
    };
  },

  async createFeeAssignment(data: CreateFeeAssignmentDto): Promise<FeeAssignment> {
    const heads = await this.findFeeHeadsByClassAndYear(data.className, data.year);
    
    if (heads.length === 0) {
      throw new Error('No fee heads found for this class and year');
    }

    const students = await this.getActiveStudentsCount(data.className, data.year);
    const perStudent = heads.reduce((sum, fee) => sum + Number(fee.amount), 0);

    const [assignment] = await sql<FeeAssignmentRow[]>`
      INSERT INTO fee_assignments ("className", year, students, heads, "perStudent")
      VALUES (${data.className}, ${data.year}, ${students}, ${heads.length}, ${perStudent})
      RETURNING ${selectFeeAssignmentColumns}
    `;

    return toFeeAssignmentResponse(assignment);
  },

  async findFeeAssignmentByClassAndYear(className: string, year: string): Promise<FeeAssignment | null> {
    const [assignment] = await sql<FeeAssignmentRow[]>`
      SELECT ${selectFeeAssignmentColumns}
      FROM fee_assignments
      WHERE "className" = ${className} AND year = ${year}
      ORDER BY id DESC
      LIMIT 1
    `;
    return assignment ? toFeeAssignmentResponse(assignment) : null;
  },

  async findManyFeeAssignments(params: FeeAssignmentQuery): Promise<{ data: FeeAssignment[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const className = params.className || null;
    const year = params.year || null;

    const assignments = await sql<FeeAssignmentRow[]>`
      SELECT ${selectFeeAssignmentColumns}
      FROM fee_assignments
      WHERE (${className}::text IS NULL OR "className" = ${className})
        AND (${year}::text IS NULL OR year = ${year})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM fee_assignments
      WHERE (${className}::text IS NULL OR "className" = ${className})
        AND (${year}::text IS NULL OR year = ${year})
    `;

    return { data: assignments.map(toFeeAssignmentResponse), total: Number(total?.count || 0) };
  },

  async getActiveStudentsCount(className: string, year?: string): Promise<number> {
    const queryYear = year ?? null;
    const [result] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM admissions
      WHERE "className" = ${className}
        AND COALESCE(status, 'Active') = 'Active'
        AND (${queryYear}::text IS NULL OR "academicYear" = ${queryYear} OR "academicYear" IS NULL)
    `;
    return Number(result?.count || 0);
  },

  async copyFeeStructure(fromYear: string, toYear: string): Promise<{ copied: number; skipped: number }> {
    const sourceFees = await sql<FeeHeadRow[]>`
      SELECT ${selectFeeHeadColumns} FROM fee_heads WHERE year = ${fromYear}
    `;

    if (sourceFees.length === 0) {
      throw new Error(`No fee heads exist for ${fromYear}`);
    }

    let copied = 0;
    let skipped = 0;

    for (const fee of sourceFees) {
      const isDuplicate = await this.checkDuplicateFeeHead(fee.className, fee.name, toYear);
      if (isDuplicate) {
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO fee_heads ("className", name, amount, year, frequency)
        VALUES (${fee.className}, ${fee.name}, ${fee.amount}, ${toYear}, ${fee.frequency})
      `;
      copied++;
    }

    return { copied, skipped };
  },

  async getYears(): Promise<string[]> {
    const years = await sql<{ year: string }[]>`
      SELECT name AS year FROM academic_sessions
      UNION
      SELECT DISTINCT year FROM fee_heads
      ORDER BY year DESC
    `;
    return years.map(y => y.year);
  },

  async getClasses(): Promise<string[]> {
    const classes = await sql<{ className: string }[]>`
      SELECT DISTINCT "className" FROM fee_heads ORDER BY "className"
    `;
    return classes.map(c => c.className);
  },

  async getFrequencies(): Promise<string[]> {
    // Self-heal older installations where the new lookup table has not yet
    // been created by the startup migration.
    await sql`
      CREATE TABLE IF NOT EXISTS fee_frequencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL UNIQUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO fee_frequencies (name)
      VALUES ${sql([["One Time"], ["Monthly"], ["Quarterly"], ["Half Yearly"], ["Yearly"]])}
      ON CONFLICT (name) DO NOTHING
    `;
    const frequencies = await sql<{ frequency: string }[]>`
      SELECT name AS frequency FROM fee_frequencies WHERE active = TRUE ORDER BY id
    `;
    return frequencies.map(f => f.frequency);
  },
};
