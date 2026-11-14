import sql from '../config/postgres.js';

export interface Role {
  roleId: string;
  roleName: string;
  permissions: Record<string, boolean>;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleDto {
  roleName: string;
  createdBy?: string;
}

export interface UpdateRoleDto {
  roleName?: string;
}

export interface RoleQuery {
  page?: number;
  limit?: number;
  search?: string;
}

type RoleRow = Omit<Role, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toRoleResponse(role: RoleRow): Role {
  return {
    ...role,
    createdAt: new Date(role.createdAt),
    updatedAt: new Date(role.updatedAt),
  };
}

const selectRoleColumns = sql`
  "roleId", "roleName", permissions, "createdBy", "createdAt", "updatedAt"
`;

export const roleRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
        "roleId" VARCHAR(50) PRIMARY KEY,
        "roleName" VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb`;

    const modules = {
      "Student Management": true,
      "Fee Collection": true,
      Attendance: true,
      Examinations: true,
      Reports: true,
      "Staff & Payroll": true,
      Notices: true,
      "System Settings": true,
    };
    for (const [roleName, permissions] of Object.entries({
      Superadmin: modules,
      Admin: modules,
      Operator: { ...modules, Examinations: false, Reports: false, "Staff & Payroll": false, "System Settings": false },
      Accountant: { ...modules, "Student Management": false, Attendance: false, Examinations: false, "Staff & Payroll": false, "System Settings": false },
      Teacher: { ...modules, "Fee Collection": false, "Staff & Payroll": false, "System Settings": false },
      Student: { "Student Management": true, "Fee Collection": false, Attendance: true, Examinations: true, Reports: true, "Staff & Payroll": false, Notices: true, "System Settings": false },
    })) {
      const roleId = `ROLE-${roleName.toUpperCase()}`;
      await sql`
        INSERT INTO roles ("roleId", "roleName", permissions)
        VALUES (${roleId}, ${roleName}, ${sql.json(permissions)})
        ON CONFLICT ("roleName") DO NOTHING
      `;
    }
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_roles_name ON roles("roleName")
    `;
  },

  async findMany(params: RoleQuery): Promise<{ data: Role[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search?.trim() ? `%${params.search.trim()}%` : null;

    const roles = await sql<RoleRow[]>`
      SELECT ${selectRoleColumns}
      FROM roles
      WHERE (${search}::text IS NULL OR "roleName" ILIKE ${search})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM roles
      WHERE (${search}::text IS NULL OR "roleName" ILIKE ${search})
    `;

    return { data: roles.map(toRoleResponse), total: Number(total?.count || 0) };
  },

  async findById(roleId: string): Promise<Role | null> {
    const [role] = await sql<RoleRow[]>`
      SELECT ${selectRoleColumns}
      FROM roles WHERE "roleId" = ${roleId}
    `;
    return role ? toRoleResponse(role) : null;
  },

  async findByName(roleName: string): Promise<Role | null> {
    const [role] = await sql<RoleRow[]>`
      SELECT ${selectRoleColumns}
      FROM roles WHERE LOWER("roleName") = LOWER(${roleName.trim()})
    `;
    return role ? toRoleResponse(role) : null;
  },

  async create(data: { roleName: string; permissions?: Record<string, boolean>; createdBy?: string }): Promise<Role> {
    const roleId = `ROLE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const [role] = await sql<RoleRow[]>`
      INSERT INTO roles ("roleId", "roleName", permissions, "createdBy")
      VALUES (${roleId}, ${data.roleName}, ${sql.json(data.permissions || {})}, ${data.createdBy || null})
      RETURNING ${selectRoleColumns}
    `;
    return toRoleResponse(role);
  },

  async update(roleId: string, data: { roleName?: string; permissions?: Record<string, boolean> }): Promise<Role | null> {
    const roleName = data.roleName ?? null;
    const permissions = data.permissions === undefined ? null : sql.json(data.permissions);
    const [role] = await sql<RoleRow[]>`
      UPDATE roles
       SET "roleName" = COALESCE(${roleName}, "roleName"),
           permissions = COALESCE(${permissions}, permissions),
           "updatedAt" = NOW()
       WHERE "roleId" = ${roleId}
       RETURNING ${selectRoleColumns}
    `;
    return role ? toRoleResponse(role) : null;
  },

  async delete(roleId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM roles WHERE "roleId" = ${roleId}
    `;
    return result.count > 0;
  },
};
