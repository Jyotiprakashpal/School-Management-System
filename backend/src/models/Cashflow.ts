import sql from '../config/postgres.js';

export interface Cashflow {
  id: number;
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  mode: string;
  reference: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense extends Cashflow {
  voucher: string;
  payee: string;
  status: 'Approved' | 'Pending';
  studentId?: string;
}

export interface CreateCashflowDto {
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  mode: string;
  reference?: string;
  academicYear?: string;
}

export interface CreateExpenseDto extends CreateCashflowDto {
  voucher?: string;
  payee: string;
  status?: 'Approved' | 'Pending';
}

export interface UpdateCashflowDto {
  category?: string;
  description?: string;
  amount?: number;
  date?: string;
  mode?: string;
  reference?: string;
}

export interface UpdateExpenseDto extends UpdateCashflowDto {
  payee?: string;
  status?: 'Approved' | 'Pending';
}

export interface CashflowQuery {
  page?: number;
  limit?: number;
  type?: 'Income' | 'Expense';
  category?: string;
  search?: string;
  academicYear?: string;
  fromDate?: string;
  toDate?: string;
  status?: 'Approved' | 'Pending';
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  budgetUsed: number;
  monthlyBudget: number;
}

type CashflowRow = Omit<Cashflow, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type ExpenseRow = Omit<Expense, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toCashflowResponse(cashflow: CashflowRow): Cashflow {
  return {
    ...cashflow,
    createdAt: new Date(cashflow.createdAt),
    updatedAt: new Date(cashflow.updatedAt),
  };
}

function toExpenseResponse(expense: ExpenseRow): Expense {
  return {
    ...expense,
    createdAt: new Date(expense.createdAt),
    updatedAt: new Date(expense.updatedAt),
  };
}

const selectCashflowColumns = sql`
  id, type, category, description, amount, date, mode, reference, "academicYear", "createdAt", "updatedAt"
`;

const selectExpenseColumns = sql`
  id, type, category, description, amount, date, mode, reference, "academicYear", voucher, payee, status, "createdAt", "updatedAt"
`;

export const cashflowRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS cashflows (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK (type IN ('Income', 'Expense')),
        category VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        mode VARCHAR(50) NOT NULL,
        reference VARCHAR(100),
        "academicYear" VARCHAR(20) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cashflows_type ON cashflows(type)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cashflows_category ON cashflows(category)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cashflows_date ON cashflows(date)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cashflows_academic_year ON cashflows("academicYear")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cashflows_type_date ON cashflows(type, date)
    `;
  },

  async findMany(params: CashflowQuery): Promise<{ data: Cashflow[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const type = params.type || null;
    const category = params.category || null;
    const search = params.search ? '%' + params.search + '%' : null;
    const academicYear = params.academicYear || null;
    const fromDate = params.fromDate || null;
    const toDate = params.toDate || null;
    const status = params.status || null;

    const whereClause = sql`
      WHERE (${type}::text IS NULL OR type = ${type})
        AND (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR description ILIKE ${search} OR reference ILIKE ${search} OR category ILIKE ${search})
        AND (${academicYear}::text IS NULL OR "academicYear" = ${academicYear})
        AND (${fromDate}::date IS NULL OR date >= ${fromDate})
        AND (${toDate}::date IS NULL OR date <= ${toDate})
    `;

    const cashflows = await sql<CashflowRow[]>`
      SELECT ${selectCashflowColumns}
      FROM cashflows
      ${whereClause}
      ORDER BY date DESC, "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM cashflows
      ${whereClause}
    `;

    return { data: cashflows.map(toCashflowResponse), total: Number(total?.count || 0) };
  },

  async findExpenseMany(params: CashflowQuery): Promise<{ data: Expense[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const category = params.category || null;
    const search = params.search ? '%' + params.search + '%' : null;
    const academicYear = params.academicYear || null;
    const fromDate = params.fromDate || null;
    const toDate = params.toDate || null;
    const status = params.status || null;

    const whereClause = sql`
      WHERE type = 'Expense'
        AND (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR description ILIKE ${search} OR reference ILIKE ${search} OR category ILIKE ${search} OR voucher ILIKE ${search} OR payee ILIKE ${search})
        AND (${academicYear}::text IS NULL OR "academicYear" = ${academicYear})
        AND (${fromDate}::date IS NULL OR date >= ${fromDate})
        AND (${toDate}::date IS NULL OR date <= ${toDate})
        AND (${status}::text IS NULL OR status = ${status})
    `;

    const expenses = await sql<ExpenseRow[]>`
      SELECT ${selectExpenseColumns}
      FROM cashflows
      ${whereClause}
      ORDER BY date DESC, "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM cashflows
      ${whereClause}
    `;

    return { data: expenses.map(toExpenseResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Cashflow | null> {
    const [cashflow] = await sql<CashflowRow[]>`
      SELECT ${selectCashflowColumns} FROM cashflows WHERE id = ${id}
    `;
    return cashflow ? toCashflowResponse(cashflow) : null;
  },

  async findExpenseById(id: number): Promise<Expense | null> {
    const [expense] = await sql<ExpenseRow[]>`
      SELECT ${selectExpenseColumns} FROM cashflows WHERE id = ${id} AND type = 'Expense'
    `;
    return expense ? toExpenseResponse(expense) : null;
  },

  async findByVoucher(voucher: string): Promise<Expense | null> {
    const [expense] = await sql<ExpenseRow[]>`
      SELECT ${selectExpenseColumns} FROM cashflows WHERE voucher = ${voucher} AND type = 'Expense'
    `;
    return expense ? toExpenseResponse(expense) : null;
  },

  async createCashflow(data: CreateCashflowDto): Promise<Cashflow> {
    const academicYear = data.academicYear || '2026–27';
    const reference = data.reference || `${data.type === 'Income' ? 'INC' : 'EXP'}-${Date.now()}`;
    
    const [cashflow] = await sql<CashflowRow[]>`
      INSERT INTO cashflows (type, category, description, amount, date, mode, reference, "academicYear")
      VALUES (${data.type}, ${data.category}, ${data.description}, ${data.amount}, ${data.date}, ${data.mode}, ${reference}, ${academicYear})
      RETURNING ${selectCashflowColumns}
    `;
    return toCashflowResponse(cashflow);
  },

  async createExpense(data: CreateExpenseDto): Promise<Expense> {
    const academicYear = data.academicYear || '2026–27';
    const reference = data.reference || `EXP-${Date.now()}`;
    const voucher = data.voucher || `EXP-${Date.now()}`;
    
    const [expense] = await sql<ExpenseRow[]>`
      INSERT INTO cashflows (type, category, description, amount, date, mode, reference, "academicYear", voucher, payee, status)
      VALUES ('Expense', ${data.category}, ${data.description}, ${data.amount}, ${data.date}, ${data.mode}, ${reference}, ${academicYear}, ${voucher}, ${data.payee}, ${data.status || 'Pending'})
      RETURNING ${selectExpenseColumns}
    `;
    return toExpenseResponse(expense);
  },

  async updateCashflow(id: number, data: Partial<UpdateCashflowDto>): Promise<Cashflow | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.category !== undefined) { updates.push('category = $' + (values.length + 1)); values.push(data.category); }
    if (data.description !== undefined) { updates.push('description = $' + (values.length + 1)); values.push(data.description); }
    if (data.amount !== undefined) { updates.push('amount = $' + (values.length + 1)); values.push(data.amount); }
    if (data.date !== undefined) { updates.push('date = $' + (values.length + 1)); values.push(data.date); }
    if (data.mode !== undefined) { updates.push('mode = $' + (values.length + 1)); values.push(data.mode); }
    if (data.reference !== undefined) { updates.push('reference = $' + (values.length + 1)); values.push(data.reference); }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE cashflows SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectCashflowColumns}`;

    const [cashflow] = await sql.unsafe(query, values) as CashflowRow[];
    return cashflow ? toCashflowResponse(cashflow) : null;
  },

  async updateExpense(id: number, data: Partial<UpdateExpenseDto>): Promise<Expense | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.category !== undefined) { updates.push('category = $' + (values.length + 1)); values.push(data.category); }
    if (data.description !== undefined) { updates.push('description = $' + (values.length + 1)); values.push(data.description); }
    if (data.amount !== undefined) { updates.push('amount = $' + (values.length + 1)); values.push(data.amount); }
    if (data.date !== undefined) { updates.push('date = $' + (values.length + 1)); values.push(data.date); }
    if (data.mode !== undefined) { updates.push('mode = $' + (values.length + 1)); values.push(data.mode); }
    if (data.reference !== undefined) { updates.push('reference = $' + (values.length + 1)); values.push(data.reference); }
    if (data.payee !== undefined) { updates.push('payee = $' + (values.length + 1)); values.push(data.payee); }
    if (data.status !== undefined) { updates.push('status = $' + (values.length + 1)); values.push(data.status); }

    if (updates.length === 0) {
      return this.findExpenseById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE cashflows SET ${updates.join(', ')} WHERE id = $${values.length} AND type = 'Expense' RETURNING ${selectExpenseColumns}`;

    const [expense] = await sql.unsafe(query, values) as ExpenseRow[];
    return expense ? toExpenseResponse(expense) : null;
  },

  async approveExpense(id: number): Promise<Expense | null> {
    const [expense] = await sql<ExpenseRow[]>`
      UPDATE cashflows
       SET status = 'Approved', "updatedAt" = NOW()
       WHERE id = ${id} AND type = 'Expense'
       RETURNING ${selectExpenseColumns}
    `;
    return expense ? toExpenseResponse(expense) : null;
  },

  async deleteCashflow(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM cashflows WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getSummary(academicYear: string, fromDate?: string, toDate?: string): Promise<CashflowSummary> {
    const whereClause = sql`
      WHERE "academicYear" = ${academicYear}
        ${fromDate ? sql`AND date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND date <= ${toDate}` : sql``}
    `;

    const [incomeTotal] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(amount), 0)::text AS sum FROM cashflows ${whereClause} AND type = 'Income'
    `;

    const [expenseTotal] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(amount), 0)::text AS sum FROM cashflows ${whereClause} AND type = 'Expense'
    `;

    const monthlyData = await sql<{ month: string; income: string; expense: string }[]>`
      SELECT 
        to_char(date, 'Mon') as month,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount END), 0)::text as income,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount END), 0)::text as expense
      FROM cashflows
      ${whereClause}
      GROUP BY to_char(date, 'Mon'), date_trunc('month', date)
      ORDER BY date_trunc('month', date)
    `;

    const categoryBreakdown = await sql<{ category: string; amount: string }[]>`
      SELECT category, SUM(amount)::text as amount
      FROM cashflows
      ${whereClause} AND type = 'Expense'
      GROUP BY category
      ORDER BY SUM(amount) DESC
    `;

    const totalIncome = Number(incomeTotal?.sum || 0);
    const totalExpense = Number(expenseTotal?.sum || 0);
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      monthlyData: monthlyData.map(m => ({
        month: m.month,
        income: Number(m.income),
        expense: Number(m.expense),
      })),
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c.category,
        amount: Number(c.amount),
        percentage: totalExpense > 0 ? Math.round((Number(c.amount) / totalExpense) * 100) : 0,
      })),
      budgetUsed: 0,
      monthlyBudget: 0,
    };
  },

  async getExpenseStats(academicYear: string, fromDate?: string, toDate?: string): Promise<{
    totalExpense: number;
    approvedSpend: number;
    pendingSpend: number;
    categoryTotals: Array<{ category: string; amount: number }>;
    monthlySpend: number;
    budgetUsed: number;
  }> {
    const whereClause = sql`
      WHERE "academicYear" = ${academicYear}
        AND type = 'Expense'
        ${fromDate ? sql`AND date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND date <= ${toDate}` : sql``}
    `;

    const [monthlySpend] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(amount), 0)::text AS sum FROM cashflows ${whereClause}
    `;

    const [approvedSpend] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(amount), 0)::text AS sum FROM cashflows ${whereClause} AND status = 'Approved'
    `;

    const [pendingSpend] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(amount), 0)::text AS sum FROM cashflows ${whereClause} AND status = 'Pending'
    `;

    const categoryTotals = await sql<{ category: string; amount: string }[]>`
      SELECT category, SUM(amount)::text as amount
      FROM cashflows
      ${whereClause}
      GROUP BY category
      ORDER BY SUM(amount) DESC
    `;

    return {
      totalExpense: Number(monthlySpend?.sum || 0),
      approvedSpend: Number(approvedSpend?.sum || 0),
      pendingSpend: Number(pendingSpend?.sum || 0),
      categoryTotals: categoryTotals.map(c => ({ category: c.category, amount: Number(c.amount) })),
      monthlySpend: Number(monthlySpend?.sum || 0),
      budgetUsed: 0,
    };
  },
};