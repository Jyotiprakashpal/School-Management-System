import sql from '../config/postgres.js';

export interface User {
  userId: string;
  username: string;
  name: string;
  role: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  userId: string;
  username: string;
  name: string;
  role?: string;
  createdBy?: string;
}

export interface UpdateUserDto {
  username?: string;
  name?: string;
  role?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

type UserRow = Omit<User, 'userId'> & { "userId": string };

function toUserResponse(user: UserRow): User {
  return { ...user, userId: user["userId"] };
}

const selectUserColumns = sql`
  "userId", username, name, role, "createdBy", "createdAt", "updatedAt"
`;

export const userRepository = {
  async findMany(params: UserQuery): Promise<{ data: User[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const role = params.role || null;

    const users = await sql<UserRow[]>`
      SELECT ${selectUserColumns}
      FROM users
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR username ILIKE ${search})
        AND (${role}::text IS NULL OR role = ${role})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM users
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR username ILIKE ${search})
        AND (${role}::text IS NULL OR role = ${role})
    `;

    return { data: users.map(toUserResponse), total: Number(total?.count || 0) };
  },

  async findById(userId: string): Promise<User | null> {
    const [user] = await sql<UserRow[]>`
      SELECT ${selectUserColumns} FROM users WHERE "userId" = ${userId}
    `;
    return user ? toUserResponse(user) : null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await sql<UserRow[]>`
      SELECT ${selectUserColumns} FROM users WHERE username = ${username}
    `;
    return user ? toUserResponse(user) : null;
  },

  async create(data: CreateUserDto): Promise<User> {
    const [user] = await sql<UserRow[]>`
      INSERT INTO users ("userId", username, name, role, "createdBy")
      VALUES (${data.userId}, ${data.username.trim()}, ${data.name.trim()}, ${data.role || 'user'}, ${data.createdBy || null})
      RETURNING ${selectUserColumns}
    `;
    return toUserResponse(user);
  },

  async update(userId: string, data: Partial<UpdateUserDto>): Promise<User | null> {
    const current = await this.findById(userId);
    if (!current) return null;

    const next = {
      username: data.username ?? current.username,
      name: data.name ?? current.name,
      role: data.role ?? current.role
    };

    const [user] = await sql<UserRow[]>`
      UPDATE users
       SET username = ${next.username.trim()},
           name = ${next.name.trim()},
           role = ${next.role},
           "updatedAt" = NOW()
       WHERE "userId" = ${userId}
       RETURNING ${selectUserColumns}
    `;
    return user ? toUserResponse(user) : null;
  },

  async delete(userId: string): Promise<boolean> {
    const rows = await sql<{ "userId": string }[]>`
      DELETE FROM users WHERE "userId" = ${userId} RETURNING "userId"
    `;
    return rows.length > 0;
  }
};