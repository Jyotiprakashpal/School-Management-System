import sql from '../config/postgres.js';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: 'Superadmin' | 'Admin' | 'Operator' | 'Accountant';
  status: 'Active' | 'Suspended';
  lastLogin: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  username: string;
  name: string;
  password: string;
  role?: 'Superadmin' | 'Admin' | 'Operator' | 'Accountant';
  status?: 'Active' | 'Suspended';
  createdBy?: string;
}

export interface UpdateUserDto {
  username?: string;
  name?: string;
  role?: 'Superadmin' | 'Admin' | 'Operator' | 'Accountant';
  status?: 'Active' | 'Suspended';
  password?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'Superadmin' | 'Admin' | 'Operator' | 'Accountant';
  status?: 'Active' | 'Suspended';
}

type UserRow = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toUserResponse(user: any): User {
  return {
    ...user,
    id: Number(user.id),
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
  };
}

const selectUserColumns = sql`
  id, username, name, email, role, status, "lastLogin", "createdBy", "createdAt", "updatedAt"
`;

export const userRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(40) NOT NULL DEFAULT 'Operator' CHECK (role IN ('Superadmin', 'Admin', 'Operator', 'Accountant')),
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
        "lastLogin" TIMESTAMPTZ,
        "resetToken" VARCHAR(255),
        "resetTokenExpiry" TIMESTAMPTZ,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    
    // Add missing columns if they don't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
      ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
      ADD COLUMN IF NOT EXISTS "resetToken" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users("resetToken")
    `;
  },

  async findMany(params: UserQuery): Promise<{ data: User[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const role = params.role || null;
    const status = params.status || null;

    const users = await sql<any[]>`
      SELECT ${selectUserColumns}
      FROM users
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR username ILIKE ${search})
        AND (${role}::text IS NULL OR role = ${role})
        AND (${status}::text IS NULL OR status = ${status})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM users
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR username ILIKE ${search})
        AND (${role}::text IS NULL OR role = ${role})
        AND (${status}::text IS NULL OR status = ${status})
    `;

    return { data: users.map(toUserResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<User | null> {
    const [user] = await sql<any[]>`
      SELECT ${selectUserColumns} FROM users WHERE id = ${id}
    `;
    return user ? toUserResponse(user) : null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await sql<any[]>`
      SELECT ${selectUserColumns} FROM users WHERE username = ${username}
    `;
    return user ? toUserResponse(user) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await sql<any[]>`
      SELECT ${selectUserColumns} FROM users WHERE email = ${email}
    `;
    return user ? toUserResponse(user) : null;
  },

  async create(data: CreateUserDto): Promise<User> {
    const [passwordHash] = await sql<{ crypt: string }[]>`
      SELECT crypt(${data.password}, gen_salt('bf'))
    `;
    const [user] = await sql<any[]>`
      INSERT INTO users (username, name, password_hash, role, status, "createdBy")
      VALUES (${data.username.trim()}, ${data.name.trim()}, ${passwordHash.crypt}, ${data.role || 'Operator'}, ${data.status || 'Active'}, ${data.createdBy || null})
      RETURNING ${selectUserColumns}
    `;
    return toUserResponse(user);
  },

  async update(id: number, data: Partial<UpdateUserDto>): Promise<User | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.username !== undefined) { updates.push('username = $' + (values.length + 1)); values.push(data.username.trim()); }
    if (data.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(data.name.trim()); }
    if (data.role !== undefined) { updates.push('role = $' + (values.length + 1)); values.push(data.role); }
    if (data.status !== undefined) { updates.push('status = $' + (values.length + 1)); values.push(data.status); }
    if (data.password !== undefined) {
      updates.push('password_hash = $' + (values.length + 1));
      const [hash] = await sql<{ crypt: string }[]>`
        SELECT crypt(${data.password}, gen_salt('bf'))
      `;
      values.push(hash.crypt);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectUserColumns}`;
    const [user] = await sql.unsafe(query, values);
    return user ? toUserResponse(user) : null;
  },

  async delete(id: number): Promise<boolean> {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM users WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  },

  async generateResetToken(email: string): Promise<{ token: string; expiry: Date } | null> {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour expiry
    
    const result = await sql`
      UPDATE users 
      SET "resetToken" = ${token}, "resetTokenExpiry" = ${expiry.toISOString()}
      WHERE email = ${email}
      RETURNING id
    `;
    
    if (result.length === 0) return null;
    return { token, expiry };
  },

  async findByResetToken(token: string): Promise<User | null> {
    const [user] = await sql<any[]>`
      SELECT ${selectUserColumns} FROM users 
      WHERE "resetToken" = ${token} AND "resetTokenExpiry" > NOW()
    `;
    return user ? toUserResponse(user) : null;
  },

  async resetPassword(token: string, newPassword: string): Promise<User | null> {
    const [hash] = await sql<{ crypt: string }[]>`
      SELECT crypt(${newPassword}, gen_salt('bf'))
    `;
    
    const [user] = await sql<any[]>`
      UPDATE users 
      SET password_hash = ${hash.crypt}, 
          "resetToken" = NULL, 
          "resetTokenExpiry" = NULL,
          "updatedAt" = NOW()
      WHERE "resetToken" = ${token} AND "resetTokenExpiry" > NOW()
      RETURNING ${selectUserColumns}
    `;
    return user ? toUserResponse(user) : null;
  },

  async clearResetToken(userId: number): Promise<void> {
    await sql`
      UPDATE users 
      SET "resetToken" = NULL, "resetTokenExpiry" = NULL, "updatedAt" = NOW()
      WHERE id = ${userId}
    `;
  },

  async updateLastLogin(userId: number): Promise<void> {
    await sql`
      UPDATE users SET "lastLogin" = NOW() WHERE id = ${userId}
    `;
  },

  async updateLastLoginByUsername(username: string): Promise<void> {
    await sql`
      UPDATE users SET "lastLogin" = NOW() WHERE username = ${username}
    `;
  }
};