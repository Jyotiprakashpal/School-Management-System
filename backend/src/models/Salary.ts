import sql from '../config/postgres.js';

export interface Payroll {
  id: number;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  basic: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Pending' | 'Processed' | 'Paid';
  month: string;
  year: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePayrollDto {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  basic: number;
  allowances: number;
  deductions: number;
  month: string;
  year: number;
  status?: 'Pending' | 'Processed' | 'Paid';
  createdBy?: string;
}

export interface UpdatePayrollDto {
  basic?: number;
  allowances?: number;
  deductions?: number;
  status?: 'Pending' | 'Processed' | 'Paid';
}

export interface PayrollQuery {
  page?: number;
  limit?: number;
  month?: string;
  year?: number;
  department?: string;
  status?: 'Pending' | 'Processed' | 'Paid';
  employeeId?: string;
}

export interface PayrollSummary {
  grossPayroll: number;
  totalDeductions: number;
  netPayroll: number;
  paidPayroll: number;
  pendingCount: number;
  processedCount: number;
  paidCount: number;
  totalEmployees: number;
}

export interface DepartmentPayroll {
  department: string;
  totalNet: number;
  employeeCount: number;
}

export interface MonthlyPayrollReport {
  month: string;
  year: number;
  employees: number;
  gross: number;
  deductions: number;
  net: number;
  paid: number;
  status: 'Complete' | 'Partial';
}

export interface EmployeeSalaryReport {
  employeeId: string;
  name: string;
  department: string;
  gross: number;
  net: number;
  status: 'Paid' | 'Pending';
}

type PayrollRow = Omit<Payroll, 'createdAt' | 'updatedAt' | 'netSalary'> & {
  netSalary: number;
  createdAt: string;
  updatedAt: string;
};

type MonthlyPayrollRow = Omit<MonthlyPayrollReport, 'status'> & {
  status: string;
};

type EmployeeSalaryRow = EmployeeSalaryReport;

function toPayrollResponse(row: PayrollRow): Payroll {
  return {
    ...row,
    netSalary: row.basic + row.allowances - row.deductions,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    createdBy: row.createdBy || null,
  };
}

function toMonthlyPayrollResponse(row: MonthlyPayrollRow): MonthlyPayrollReport {
  return {
    ...row,
    status: row.status as 'Complete' | 'Partial',
  };
}

function toEmployeeSalaryResponse(row: EmployeeSalaryRow): EmployeeSalaryReport {
  return row;
}

const selectPayrollColumns = sql`
  id, "employeeId", name, designation, department, basic, allowances, deductions,
  "netSalary", status, month, year, "createdBy", "createdAt", "updatedAt"
`;

const selectMonthlyPayrollColumns = sql`
  id, month, year, employees, gross, deductions, net, paid, status
`;

const selectEmployeeSalaryColumns = sql`
  id, "employeeId", name, department, gross, net, status
`;

export const salaryRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS payrolls (
        id SERIAL PRIMARY KEY,
        "employeeId" TEXT NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        designation VARCHAR(120) NOT NULL,
        department VARCHAR(50) NOT NULL,
        basic DECIMAL(10,2) NOT NULL,
        allowances DECIMAL(10,2) NOT NULL DEFAULT 0,
        deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
        "netSalary" DECIMAL(10,2) GENERATED ALWAYS AS (basic + allowances - deductions) STORED,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Paid')),
        month VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("employeeId", month, year)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payrolls_month_year ON payrolls(month, year)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payrolls_department ON payrolls(department)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payrolls_employee ON payrolls("employeeId")
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS monthly_payrolls (
        id SERIAL PRIMARY KEY,
        month VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        employees INTEGER NOT NULL DEFAULT 0,
        gross DECIMAL(12,2) NOT NULL DEFAULT 0,
        deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
        net DECIMAL(12,2) NOT NULL DEFAULT 0,
        paid DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'Partial' CHECK (status IN ('Complete', 'Partial')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(month, year)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS employee_salaries (
        id SERIAL PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        name VARCHAR(120) NOT NULL,
        department VARCHAR(50) NOT NULL,
        gross DECIMAL(10,2) NOT NULL,
        net DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  },

  async findMany(params: PayrollQuery): Promise<{ data: Payroll[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;
    const month = params.month || null;
    const year = params.year || null;
    const department = params.department || null;
    const status = params.status || null;
    const employeeId = params.employeeId || null;

    const payrolls = await sql<PayrollRow[]>`
      SELECT ${selectPayrollColumns}
      FROM payrolls
      WHERE (${month}::text IS NULL OR month = ${month})
        AND (${year}::int IS NULL OR year = ${year})
        AND (${department}::text IS NULL OR department = ${department})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${employeeId}::text IS NULL OR "employeeId" = ${employeeId})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM payrolls
      WHERE (${month}::text IS NULL OR month = ${month})
        AND (${year}::int IS NULL OR year = ${year})
        AND (${department}::text IS NULL OR department = ${department})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${employeeId}::text IS NULL OR "employeeId" = ${employeeId})
    `;

    return { data: payrolls.map(toPayrollResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Payroll | null> {
    const [payroll] = await sql<PayrollRow[]>`
      SELECT ${selectPayrollColumns} FROM payrolls WHERE id = ${id}
    `;
    return payroll ? toPayrollResponse(payroll) : null;
  },

  async findByEmployeeMonthYear(employeeId: string, month: string, year: number): Promise<Payroll | null> {
    const [payroll] = await sql<PayrollRow[]>`
      SELECT ${selectPayrollColumns} FROM payrolls WHERE "employeeId" = ${employeeId} AND month = ${month} AND year = ${year}
    `;
    return payroll ? toPayrollResponse(payroll) : null;
  },

  async create(data: CreatePayrollDto): Promise<Payroll> {
    const [payroll] = await sql<PayrollRow[]>`
      INSERT INTO payrolls ("employeeId", name, designation, department, basic, allowances, deductions, month, year, status, "createdBy")
      VALUES (${data.employeeId}, ${data.name}, ${data.designation}, ${data.department}, ${data.basic}, ${data.allowances}, ${data.deductions}, ${data.month}, ${data.year}, ${data.status || 'Pending'}, ${data.createdBy || null})
      RETURNING ${selectPayrollColumns}
    `;
    return toPayrollResponse(payroll);
  },

  async update(id: number, data: Partial<UpdatePayrollDto>): Promise<Payroll | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.basic !== undefined) { updates.push('basic = $' + (values.length + 1)); values.push(data.basic); }
    if (data.allowances !== undefined) { updates.push('allowances = $' + (values.length + 1)); values.push(data.allowances); }
    if (data.deductions !== undefined) { updates.push('deductions = $' + (values.length + 1)); values.push(data.deductions); }
    if (data.status !== undefined) { updates.push('status = $' + (values.length + 1)); values.push(data.status); }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE payrolls SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectPayrollColumns}`;

    const [payroll] = await sql.unsafe(query, values) as PayrollRow[];
    return payroll ? toPayrollResponse(payroll) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM payrolls WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getSummary(month: string, year: number): Promise<PayrollSummary> {
    const payrolls = await sql<PayrollRow[]>`
      SELECT ${selectPayrollColumns} FROM payrolls WHERE month = ${month} AND year = ${year}
    `;

    const grossPayroll = payrolls.reduce((sum, p) => sum + p.basic + p.allowances, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.deductions, 0);
    const netPayroll = payrolls.reduce((sum, p) => sum + p.basic + p.allowances - p.deductions, 0);
    const paidPayroll = payrolls.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.basic + p.allowances - p.deductions, 0);
    const pendingCount = payrolls.filter(p => p.status === 'Pending').length;
    const processedCount = payrolls.filter(p => p.status === 'Processed').length;
    const paidCount = payrolls.filter(p => p.status === 'Paid').length;

    return {
      grossPayroll,
      totalDeductions,
      netPayroll,
      paidPayroll,
      pendingCount,
      processedCount,
      paidCount,
      totalEmployees: payrolls.length,
    };
  },

  async getDepartmentTotals(month: string, year: number): Promise<DepartmentPayroll[]> {
    const payrolls = await sql<PayrollRow[]>`
      SELECT ${selectPayrollColumns} FROM payrolls WHERE month = ${month} AND year = ${year}
    `;

    const deptMap = new Map<string, { totalNet: number; employeeCount: number }>();
    for (const p of payrolls) {
      const net = p.basic + p.allowances - p.deductions;
      const existing = deptMap.get(p.department) || { totalNet: 0, employeeCount: 0 };
      deptMap.set(p.department, {
        totalNet: existing.totalNet + net,
        employeeCount: existing.employeeCount + 1,
      });
    }

    return Array.from(deptMap.entries())
      .map(([department, data]) => ({ department, ...data }))
      .sort((a, b) => b.totalNet - a.totalNet);
  },

  async getMonthlyReport(month: string, year: number): Promise<MonthlyPayrollReport | null> {
    const [report] = await sql<MonthlyPayrollRow[]>`
      SELECT ${selectMonthlyPayrollColumns} FROM monthly_payrolls WHERE month = ${month} AND year = ${year}
    `;
    return report ? toMonthlyPayrollResponse(report) : null;
  },

  async getMonthlyReports(year?: number): Promise<MonthlyPayrollReport[]> {
    const reports = await sql<MonthlyPayrollRow[]>`
      SELECT ${selectMonthlyPayrollColumns}
      FROM monthly_payrolls
      ${year ? sql`WHERE year = ${year}` : sql``}
      ORDER BY year DESC, month DESC
    `;
    return reports.map(toMonthlyPayrollResponse);
  },

  async upsertMonthlyReport(data: Omit<MonthlyPayrollReport, 'id' | 'status'> & { status?: 'Complete' | 'Partial' }): Promise<MonthlyPayrollReport> {
    const reports = await sql<MonthlyPayrollRow[]>`
      INSERT INTO monthly_payrolls (month, year, employees, gross, deductions, net, paid, status)
      VALUES (${data.month}, ${data.year}, ${data.employees}, ${data.gross}, ${data.deductions}, ${data.net}, ${data.paid}, ${data.status || 'Partial'})
      ON CONFLICT (month, year) DO UPDATE SET
        employees = EXCLUDED.employees,
        gross = EXCLUDED.gross,
        deductions = EXCLUDED.deductions,
        net = EXCLUDED.net,
        paid = EXCLUDED.paid,
        status = EXCLUDED.status,
        "updatedAt" = NOW()
      RETURNING ${selectMonthlyPayrollColumns}
    `;
    return toMonthlyPayrollResponse(reports[0]);
  },

  async getEmployeeSalaries(): Promise<EmployeeSalaryReport[]> {
    const salaries = await sql<EmployeeSalaryRow[]>`
      SELECT ${selectEmployeeSalaryColumns} FROM employee_salaries
    `;
    return salaries.map(toEmployeeSalaryResponse);
  },

  async upsertEmployeeSalary(data: Omit<EmployeeSalaryReport, 'id'>): Promise<EmployeeSalaryReport> {
    const salaries = await sql<EmployeeSalaryRow[]>`
      INSERT INTO employee_salaries ("employeeId", name, department, gross, net, status)
      VALUES (${data.employeeId}, ${data.name}, ${data.department}, ${data.gross}, ${data.net}, ${data.status})
      ON CONFLICT ("employeeId") DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        gross = EXCLUDED.gross,
        net = EXCLUDED.net,
        status = EXCLUDED.status,
        "updatedAt" = NOW()
      RETURNING ${selectEmployeeSalaryColumns}
    `;
    return toEmployeeSalaryResponse(salaries[0]);
  },

  async getEmployeeSalaryById(employeeId: string): Promise<EmployeeSalaryReport | null> {
    const [salary] = await sql<EmployeeSalaryRow[]>`
      SELECT ${selectEmployeeSalaryColumns} FROM employee_salaries WHERE "employeeId" = ${employeeId}
    `;
    return salary ? toEmployeeSalaryResponse(salary) : null;
  },

  async getEmployeeSalariesByDepartment(department: string): Promise<EmployeeSalaryReport[]> {
    const salaries = await sql<EmployeeSalaryRow[]>`
      SELECT ${selectEmployeeSalaryColumns} FROM employee_salaries WHERE department = ${department}
    `;
    return salaries.map(toEmployeeSalaryResponse);
  },
};