import sql from '../config/postgres.js';

export interface Role {
  roleId: string;
  roleName: string;
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
  "roleId", "roleName", "createdBy", "createdAt", "updatedAt"
`;

export const roleRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
        "roleId" VARCHAR(50) PRIMARY KEY,
        "roleName" VARCHAR(50) NOT NULL UNIQUE,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    
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
      SELECT "roleId", "roleName", "createdBy", "createdAt", "updatedAt"
      FROM roles WHERE "roleId" = ${roleId}
    `;
    return role ? toRoleResponse(role) : null;
  },

  async findByName(roleName: string): Promise<Role | null> {
    const [role] = await sql<RoleRow[]>`
      SELECT "roleId", "roleName", "createdBy", "createdAt", "updatedAt"
      FROM roles WHERE LOWER("roleName") = LOWER(${roleName.trim()})
    `;
    return role ? toRoleResponse(role) : null;
  },

  async create(data: { roleName: string; createdBy?: string }): Promise<Role> {
    const roleId = `ROLE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const [role] = await sql<RoleRow[]>`
      INSERT INTO roles ("roleId", "roleName", "createdBy")
      VALUES (${roleId}, ${data.roleName}, ${data.createdBy || null})
      RETURNING "roleId", "roleName", "createdBy", "createdAt", "updatedAt"
    `;
    return toRoleResponse(role);
  },

  async update(roleId: string, data: { roleName?: string }): Promise<Role | null> {
    const roleName = data.roleName ?? null;
    const [role] = await sql<RoleRow[]>`
      UPDATE roles
       SET "roleName" = COALESCE(${roleName}, "roleName"),
           "updatedAt" = NOW()
       WHERE "roleId" = ${roleId}
       RETURNING "roleId", "roleName", "createdBy", "createdAt", "updatedAt"
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
