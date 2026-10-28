import sql from '../config/postgres.js';

export interface FeePayment {
  id: number;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  feeHeadId: number;
  feeHeadName: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transactionId: string | null;
  receiptNumber: string;
  paymentDate: Date;
  academicYear: string;
  collectedBy: string;
  createdBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeePaymentDto {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  feeHeadId: number;
  feeHeadName: string;
  amount: number;
  paidAmount: number;
  paymentMode: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transactionId?: string;
  paymentDate?: string | Date;
  academicYear: string;
  collectedBy: string;
  createdBy?: string;
  notes?: string;
}

export interface UpdateFeePaymentDto {
  paidAmount?: number;
  paymentMode?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transactionId?: string;
  paymentDate?: string | Date;
  collectedBy?: string;
  notes?: string;
}

export interface FeePaymentQuery {
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
  section?: string;
  feeHeadId?: number;
  paymentMode?: string;
  academicYear?: string;
  fromDate?: string;
  toDate?: string;
  studentId?: string;
}

export interface FeeCollectionSummary {
  totalCollected: number;
  totalPending: number;
  totalStudents: number;
  paidStudents: number;
  partialStudents: number;
  unpaidStudents: number;
}

export interface StudentFeeStatus {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  totalFees: number;
  totalPaid: number;
  totalBalance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  payments: FeePayment[];
}

type FeePaymentRow = Omit<FeePayment, 'paymentDate' | 'createdAt' | 'updatedAt'> & {
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
};

function toFeePaymentResponse(payment: FeePaymentRow): FeePayment {
  return {
    ...payment,
    paymentDate: new Date(payment.paymentDate),
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt),
  };
}

const selectFeePaymentColumns = sql`
  id, "studentId", "admissionNo", "studentName", "className", section, "feeHeadId", "feeHeadName",
  amount, "paidAmount", "balanceAmount", "paymentMode", "transactionId", "receiptNumber",
  "paymentDate", "academicYear", "collectedBy", "createdBy", notes, "createdAt", "updatedAt"
`;

export const feeCollectionRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS fee_payments (
        id SERIAL PRIMARY KEY,
        "studentId" TEXT NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
        "admissionNo" VARCHAR(80) NOT NULL,
        "studentName" VARCHAR(120) NOT NULL,
        "className" VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        "feeHeadId" INTEGER NOT NULL REFERENCES fee_heads(id) ON DELETE RESTRICT,
        "feeHeadName" VARCHAR(120) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "balanceAmount" DECIMAL(10,2) NOT NULL,
        "paymentMode" VARCHAR(20) NOT NULL DEFAULT 'Cash',
        "transactionId" VARCHAR(100),
        "receiptNumber" VARCHAR(50) NOT NULL UNIQUE,
        "paymentDate" TIMESTAMPTZ NOT NULL,
        "academicYear" VARCHAR(20) NOT NULL,
        "collectedBy" VARCHAR(120) NOT NULL,
        "createdBy" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments("studentId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_admission_no ON fee_payments("admissionNo")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_class_section ON fee_payments("className", section)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_fee_head ON fee_payments("feeHeadId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments("paymentDate" DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_academic_year ON fee_payments("academicYear")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt_number ON fee_payments("receiptNumber")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fee_payments_academic_year_class ON fee_payments("academicYear", "className")
    `;
  },

  async generateReceiptNumber(academicYear: string): Promise<string> {
    const yearShort = academicYear.replace('–', '').slice(-4);
    const [result] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM fee_payments WHERE "academicYear" = ${academicYear}
    `;
    const count = Number(result?.count || 0) + 1;
    return `RCPT-${yearShort}-${String(count).padStart(5, '0')}`;
  },

  async findMany(params: FeePaymentQuery): Promise<{ data: FeePayment[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const className = params.className || null;
    const section = params.section || null;
    const feeHeadId = params.feeHeadId || null;
    const paymentMode = params.paymentMode || null;
    const academicYear = params.academicYear || null;
    const fromDate = params.fromDate ? new Date(params.fromDate) : null;
    const toDate = params.toDate ? new Date(params.toDate + 'T23:59:59') : null;
    const studentId = params.studentId || null;

    const payments = await sql<FeePaymentRow[]>`
      SELECT ${selectFeePaymentColumns}
      FROM fee_payments
      WHERE (${search}::text IS NULL OR "studentName" ILIKE ${search} OR "admissionNo" ILIKE ${search} OR "receiptNumber" ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${feeHeadId}::int IS NULL OR "feeHeadId" = ${feeHeadId})
        AND (${paymentMode}::text IS NULL OR "paymentMode" = ${paymentMode})
        AND (${academicYear}::text IS NULL OR "academicYear" = ${academicYear})
        AND (${fromDate}::timestamptz IS NULL OR "paymentDate" >= ${fromDate})
        AND (${toDate}::timestamptz IS NULL OR "paymentDate" <= ${toDate})
        AND (${studentId}::text IS NULL OR "studentId" = ${studentId})
      ORDER BY "paymentDate" DESC, "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM fee_payments
      WHERE (${search}::text IS NULL OR "studentName" ILIKE ${search} OR "admissionNo" ILIKE ${search} OR "receiptNumber" ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${feeHeadId}::int IS NULL OR "feeHeadId" = ${feeHeadId})
        AND (${paymentMode}::text IS NULL OR "paymentMode" = ${paymentMode})
        AND (${academicYear}::text IS NULL OR "academicYear" = ${academicYear})
        AND (${fromDate}::timestamptz IS NULL OR "paymentDate" >= ${fromDate})
        AND (${toDate}::timestamptz IS NULL OR "paymentDate" <= ${toDate})
        AND (${studentId}::text IS NULL OR "studentId" = ${studentId})
    `;

    return { data: payments.map(toFeePaymentResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<FeePayment | null> {
    const [payment] = await sql<FeePaymentRow[]>`
      SELECT ${selectFeePaymentColumns} FROM fee_payments WHERE id = ${id}
    `;
    return payment ? toFeePaymentResponse(payment) : null;
  },

  async findByReceiptNumber(receiptNumber: string): Promise<FeePayment | null> {
    const [payment] = await sql<FeePaymentRow[]>`
      SELECT ${selectFeePaymentColumns} FROM fee_payments WHERE "receiptNumber" = ${receiptNumber}
    `;
    return payment ? toFeePaymentResponse(payment) : null;
  },

  async findByStudentId(studentId: string, academicYear?: string): Promise<FeePayment[]> {
    const payments = await sql<FeePaymentRow[]>`
      SELECT ${selectFeePaymentColumns}
      FROM fee_payments
      WHERE "studentId" = ${studentId}
        ${academicYear ? sql`AND "academicYear" = ${academicYear}` : sql``}
      ORDER BY "paymentDate" DESC
    `;
    return payments.map(toFeePaymentResponse);
  },

  async getStudentFeeStatus(studentId: string, academicYear: string): Promise<StudentFeeStatus | null> {
    const student = await sql<{ studentId: string; admissionNo: string; name: string; className: string; section: string }[]>`
      SELECT "userId" as "studentId", "admissionNo", name as "studentName", "className", section
      FROM users WHERE "userId" = ${studentId}
    `;
    if (!student.length) return null;

    const payments = await this.findByStudentId(studentId, academicYear);
    const totalFees = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const totalBalance = totalFees - totalPaid;

    let status: 'Paid' | 'Partial' | 'Unpaid';
    if (totalPaid <= 0) status = 'Unpaid';
    else if (totalBalance <= 0) status = 'Paid';
    else status = 'Partial';

    return {
      studentId: student[0].studentId,
      admissionNo: student[0].admissionNo,
      studentName: student[0].name,
      className: student[0].className,
      section: student[0].section,
      totalFees,
      totalPaid,
      totalBalance,
      status,
      payments
    };
  },

  async getClassFeeStatus(className: string, section: string, academicYear: string): Promise<StudentFeeStatus[]> {
    const students = await sql<{ studentId: string; admissionNo: string; name: string; className: string; section: string }[]>`
      SELECT "userId" as "studentId", "admissionNo", name, "className", section
      FROM users
      WHERE "className" = ${className} AND section = ${section}
    `;

    const result: StudentFeeStatus[] = [];
    for (const student of students) {
      const status = await this.getStudentFeeStatus(student.studentId, academicYear);
      if (status) result.push(status);
    }
    return result;
  },

  async createPayment(data: CreateFeePaymentDto): Promise<FeePayment> {
    const receiptNumber = await this.generateReceiptNumber(data.academicYear);
    const balanceAmount = data.amount - data.paidAmount;

    const [payment] = await sql<FeePaymentRow[]>`
      INSERT INTO fee_payments (
        "studentId", "admissionNo", "studentName", "className", section,
        "feeHeadId", "feeHeadName", amount, "paidAmount", "balanceAmount",
        "paymentMode", "transactionId", "receiptNumber", "paymentDate",
        "academicYear", "collectedBy", "createdBy", notes
      )
      VALUES (
        ${data.studentId}, ${data.admissionNo}, ${data.studentName}, ${data.className}, ${data.section},
        ${data.feeHeadId}, ${data.feeHeadName}, ${data.amount}, ${data.paidAmount}, ${balanceAmount},
        ${data.paymentMode}, ${data.transactionId || null}, ${receiptNumber},
        ${data.paymentDate ? new Date(data.paymentDate) : new Date()},
        ${data.academicYear}, ${data.collectedBy}, ${data.createdBy || null}, ${data.notes || null}
      )
      RETURNING ${selectFeePaymentColumns}
    `;
    return toFeePaymentResponse(payment);
  },

  async updatePayment(id: number, data: Partial<UpdateFeePaymentDto>): Promise<FeePayment | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      paidAmount: data.paidAmount ?? current.paidAmount,
      paymentMode: data.paymentMode ?? current.paymentMode,
      transactionId: data.transactionId ?? current.transactionId,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : current.paymentDate,
      collectedBy: data.collectedBy ?? current.collectedBy,
      notes: data.notes ?? current.notes,
    };

    const balanceAmount = current.amount - next.paidAmount;

    const [payment] = await sql<FeePaymentRow[]>`
      UPDATE fee_payments
       SET "paidAmount" = ${next.paidAmount},
           "paymentMode" = ${next.paymentMode},
           "transactionId" = ${next.transactionId},
           "paymentDate" = ${next.paymentDate},
           "collectedBy" = ${next.collectedBy},
           notes = ${next.notes},
           "balanceAmount" = ${balanceAmount},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectFeePaymentColumns}
    `;
    return payment ? toFeePaymentResponse(payment) : null;
  },

  async deletePayment(id: number): Promise<boolean> {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM fee_payments WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  },

  async getCollectionSummary(academicYear: string, className?: string, section?: string): Promise<FeeCollectionSummary> {
    let whereClause = sql`WHERE "academicYear" = ${academicYear}`;
    if (className) whereClause = sql`${whereClause} AND "className" = ${className}`;
    if (section) whereClause = sql`${whereClause} AND section = ${section}`;

    const [totalCollected] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM("paidAmount"), 0)::text AS sum FROM fee_payments ${whereClause}
    `;

    const studentCount = await sql<{ studentId: string }[]>`
      SELECT DISTINCT "studentId" FROM fee_payments ${whereClause}
    `;

    const paidStudents = await sql<{ studentId: string; totalPaid: string; totalAmount: string }[]>`
      SELECT "studentId", 
        SUM("paidAmount")::text as "totalPaid",
        SUM(amount)::text as "totalAmount"
      FROM fee_payments ${whereClause}
      GROUP BY "studentId"
      HAVING SUM("paidAmount") >= SUM(amount)
    `;

    const unpaidStudents = await sql<{ studentId: string; totalPaid: string }[]>`
      SELECT "studentId", SUM("paidAmount")::text as "totalPaid"
      FROM fee_payments ${whereClause}
      GROUP BY "studentId"
      HAVING SUM("paidAmount") = 0
    `;

    const partialStudents = await sql<{ studentId: string; totalPaid: string; totalAmount: string }[]>`
      SELECT "studentId", 
        SUM("paidAmount")::text as "totalPaid",
        SUM(amount)::text as "totalAmount"
      FROM fee_payments ${whereClause}
      GROUP BY "studentId"
      HAVING SUM("paidAmount") > 0 AND SUM("paidAmount") < SUM(amount)
    `;

    return {
      totalCollected: Number(totalCollected?.sum || 0),
      totalPending: 0, // Would need to calculate from fee assignments
      totalStudents: studentCount.length,
      paidStudents: paidStudents.length,
      partialStudents: partialStudents.length,
      unpaidStudents: unpaidStudents.length
    };
  },

  async getDailyCollectionReport(academicYear: string, date: Date): Promise<{
    date: Date;
    totalCollected: number;
    transactionCount: number;
    byMode: { mode: string; amount: number; count: number }[];
    byClass: { className: string; amount: number; count: number }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await sql<FeePaymentRow[]>`
      SELECT ${selectFeePaymentColumns}
      FROM fee_payments
      WHERE "academicYear" = ${academicYear}
        AND "paymentDate" >= ${startOfDay}
        AND "paymentDate" <= ${endOfDay}
      ORDER BY "paymentDate" DESC
    `;

    const totalCollected = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const transactionCount = payments.length;

    const byModeMap = new Map<string, { amount: number; count: number }>();
    const byClassMap = new Map<string, { amount: number; count: number }>();

    for (const p of payments) {
      const mode = p.paymentMode;
      const existingMode = byModeMap.get(mode) || { amount: 0, count: 0 };
      existingMode.amount += Number(p.paidAmount);
      existingMode.count += 1;
      byModeMap.set(mode, existingMode);

      const cls = p.className;
      const existingClass = byClassMap.get(cls) || { amount: 0, count: 0 };
      existingClass.amount += Number(p.paidAmount);
      existingClass.count += 1;
      byClassMap.set(cls, existingClass);
    }

    return {
      date,
      totalCollected,
      transactionCount,
      byMode: Array.from(byModeMap.entries()).map(([mode, data]) => ({ mode, ...data })),
      byClass: Array.from(byClassMap.entries()).map(([className, data]) => ({ className, ...data }))
    };
  },

  async getMonthlyCollectionReport(academicYear: string, year: number, month: number): Promise<{
    month: string;
    totalCollected: number;
    transactionCount: number;
    dailyBreakdown: { date: Date; amount: number; count: number }[];
  }> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const payments = await sql<FeePaymentRow[]>`
      SELECT ${selectFeePaymentColumns}
      FROM fee_payments
      WHERE "academicYear" = ${academicYear}
        AND "paymentDate" >= ${startOfMonth}
        AND "paymentDate" <= ${endOfMonth}
      ORDER BY "paymentDate"
    `;

    const dailyMap = new Map<string, { amount: number; count: number }>();
    let totalCollected = 0;

    for (const p of payments) {
      const dateStr = new Date(p.paymentDate).toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || { amount: 0, count: 0 };
      existing.amount += Number(p.paidAmount);
      existing.count += 1;
      dailyMap.set(dateStr, existing);
      totalCollected += Number(p.paidAmount);
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date: new Date(date), ...data }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      month: startOfMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      totalCollected,
      transactionCount: payments.length,
      dailyBreakdown
    };
  }
};