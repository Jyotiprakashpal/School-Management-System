import sql from '../config/postgres.js';

export interface Staff {
  id: number;
  staffId: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'On Leave';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffDto {
  staffId?: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  salary: number;
  joiningDate: string;
  status?: 'Active' | 'On Leave';
}

export interface UpdateStaffDto {
  name?: string;
  designation?: string;
  department?: string;
  phone?: string;
  email?: string;
  salary?: number;
  joiningDate?: string;
  status?: 'Active' | 'On Leave';
}

export interface StaffQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: 'Active' | 'On Leave';
}

type StaffRow = Omit<Staff, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toStaffResponse(staff: StaffRow): Staff {
  return {
    ...staff,
    createdAt: new Date(staff.createdAt),
    updatedAt: new Date(staff.updatedAt),
  };
}

const selectStaffColumns = sql`
  id, "staffId", name, designation, department, phone, email, salary, "joiningDate", status, "createdAt", "updatedAt"
`;

export const staffRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        "staffId" VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        designation VARCHAR(120) NOT NULL,
        department VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(120) NOT NULL,
        salary DECIMAL(10,2) NOT NULL,
        "joiningDate" DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_staff_staff_id ON staff("staffId")
    `;
  },

  async findMany(params: StaffQuery): Promise<{ data: Staff[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const department = params.department || null;
    const status = params.status || null;

    const staff = await sql<StaffRow[]>`
      SELECT ${selectStaffColumns}
      FROM staff
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "staffId" ILIKE ${search} OR phone ILIKE ${search} OR designation ILIKE ${search})
        AND (${department}::text IS NULL OR department = ${department})
        AND (${status}::text IS NULL OR status = ${status})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM staff
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "staffId" ILIKE ${search} OR phone ILIKE ${search} OR designation ILIKE ${search})
        AND (${department}::text IS NULL OR department = ${department})
        AND (${status}::text IS NULL OR status = ${status})
    `;

    return { data: staff.map(toStaffResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Staff | null> {
    const [staff] = await sql<StaffRow[]>`
      SELECT ${selectStaffColumns} FROM staff WHERE id = ${id}
    `;
    return staff ? toStaffResponse(staff) : null;
  },

  async findByStaffId(staffId: string): Promise<Staff | null> {
    const [staff] = await sql<StaffRow[]>`
      SELECT ${selectStaffColumns} FROM staff WHERE "staffId" = ${staffId}
    `;
    return staff ? toStaffResponse(staff) : null;
  },

  async create(data: CreateStaffDto): Promise<Staff> {
    const staffId = data.staffId || `EMP-${Date.now()}`;
    const [staff] = await sql<StaffRow[]>`
      INSERT INTO staff ("staffId", name, designation, department, phone, email, salary, "joiningDate", status)
      VALUES (${staffId}, ${data.name}, ${data.designation}, ${data.department}, ${data.phone}, ${data.email}, ${data.salary}, ${data.joiningDate}, ${data.status || 'Active'})
      RETURNING ${selectStaffColumns}
    `;
    return toStaffResponse(staff);
  },

  async update(id: number, data: Partial<UpdateStaffDto>): Promise<Staff | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(data.name); }
    if (data.designation !== undefined) { updates.push('designation = $' + (values.length + 1)); values.push(data.designation); }
    if (data.department !== undefined) { updates.push('department = $' + (values.length + 1)); values.push(data.department); }
    if (data.phone !== undefined) { updates.push('phone = $' + (values.length + 1)); values.push(data.phone); }
    if (data.email !== undefined) { updates.push('email = $' + (values.length + 1)); values.push(data.email); }
    if (data.salary !== undefined) { updates.push('salary = $' + (values.length + 1)); values.push(data.salary); }
    if (data.joiningDate !== undefined) { updates.push('"joiningDate" = $' + (values.length + 1)); values.push(data.joiningDate); }
    if (data.status !== undefined) { updates.push('status = $' + (values.length + 1)); values.push(data.status); }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE staff SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectStaffColumns}`;
    const [staff] = await sql.unsafe(query, values) as StaffRow[];
    return staff ? toStaffResponse(staff) : null;
  },

  async updateStatus(id: number, status: 'Active' | 'On Leave'): Promise<Staff | null> {
    const [staff] = await sql<StaffRow[]>`
      UPDATE staff
       SET status = ${status}, "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectStaffColumns}
    `;
    return staff ? toStaffResponse(staff) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM staff WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getStats(): Promise<{
    total: number;
    active: number;
    onLeave: number;
    monthlyPayroll: number;
    departments: Array<{ department: string; count: number }>;
  }> {
    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM staff
    `;
    const [active] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM staff WHERE status = 'Active'
    `;
    const [onLeave] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM staff WHERE status = 'On Leave'
    `;
    const [monthlyPayroll] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM(salary), 0)::text AS sum FROM staff WHERE status = 'Active'
    `;
    const departmentTotals = await sql<{ department: string; count: string }[]>`
      SELECT department, COUNT(*)::text AS count FROM staff GROUP BY department ORDER BY COUNT(*) DESC
    `;

    return {
      total: Number(total?.count || 0),
      active: Number(active?.count || 0),
      onLeave: Number(onLeave?.count || 0),
      monthlyPayroll: Number(monthlyPayroll?.sum || 0),
      departments: departmentTotals.map(d => ({ department: d.department, count: Number(d.count) })),
    };
  },

  async getDepartments(): Promise<string[]> {
    const result = await sql<{ department: string }[]>`
      SELECT DISTINCT department FROM staff ORDER BY department
    `;
    return result.map(r => r.department);
  },
};