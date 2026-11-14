import sql from '../config/postgres.js';

export interface UserSession {
  id: number;
  userId: number;
  username: string;
  user: string;
  device: string;
  location: string;
  active: string;
  token: string;
  createdAt: string;
  lastActive: string;
}

export const userSessionRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        device VARCHAR(120) NOT NULL DEFAULT 'Unknown device',
        location VARCHAR(160) NOT NULL DEFAULT 'Unknown location',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "lastActive" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions("userId")`;
  },

  async create(data: { userId: number; token: string; device: string; location: string }): Promise<void> {
    await sql`
      INSERT INTO user_sessions ("userId", token, device, location)
      VALUES (${data.userId}, ${data.token}, ${data.device}, ${data.location})
    `;
  },

  async findAll(): Promise<UserSession[]> {
    return sql<UserSession[]>`
      SELECT s.id, s."userId" AS "userId", u.username, u.name AS "user",
        s.device, s.location, s.token, s."createdAt" AS "createdAt", s."lastActive" AS "lastActive",
        CASE WHEN s."lastActive" > NOW() - INTERVAL '15 minutes' THEN 'Active' ELSE 'Inactive' END AS active
      FROM user_sessions s
      INNER JOIN users u ON u.id = s."userId"
      WHERE s."lastActive" > NOW() - INTERVAL '30 days'
      ORDER BY s."lastActive" DESC
    `;
  },

  async findPage(cursor?: string, limit = 20): Promise<{ data: UserSession[]; hasMore: boolean }> {
    const pageSize = Math.min(100, Math.max(1, limit));
    const rows = await sql<UserSession[]>`
      SELECT s.id, s."userId" AS "userId", u.username, u.name AS "user",
        s.device, s.location, s.token, s."createdAt" AS "createdAt", s."lastActive" AS "lastActive",
        CASE WHEN s."lastActive" > NOW() - INTERVAL '15 minutes' THEN 'Active' ELSE 'Inactive' END AS active
      FROM user_sessions s
      INNER JOIN users u ON u.id = s."userId"
      WHERE s."lastActive" > NOW() - INTERVAL '30 days'
        AND (${cursor || null}::timestamptz IS NULL OR s."lastActive" < ${cursor || null}::timestamptz)
      ORDER BY s."lastActive" DESC
      LIMIT ${pageSize + 1}
    `;
    return { data: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
  },

  async terminate(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM user_sessions WHERE id = ${id}`;
    return result.count > 0;
  },
};
