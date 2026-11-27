import sql from '../config/postgres.js';

export const SESSION_IDLE_MINUTES = 15;

export interface UserSession {
  id: number;
  userId: number;
  username: string;
  user: string;
  device: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
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
        location TEXT NOT NULL DEFAULT 'Unknown location',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "lastActive" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Existing installations may still have the original VARCHAR limit. Keep
    // the complete reverse-geocoded address so landmarks are not truncated.
    await sql`ALTER TABLE user_sessions ALTER COLUMN location TYPE TEXT`;
    await sql`ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`;
    await sql`ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions("userId")`;
  },

  async create(data: { userId: number; token: string; device: string; location: string; latitude?: number | null; longitude?: number | null }): Promise<void> {
    await sql`
      INSERT INTO user_sessions ("userId", token, device, location, latitude, longitude)
      VALUES (${data.userId}, ${data.token}, ${data.device}, ${data.location}, ${data.latitude ?? null}, ${data.longitude ?? null})
    `;
  },

  async findAll(): Promise<UserSession[]> {
    return sql<UserSession[]>`
      SELECT s.id, s."userId" AS "userId", u.username, u.name AS "user",
        s.device, s.location, s.latitude, s.longitude, s.token, s."createdAt" AS "createdAt", s."lastActive" AS "lastActive",
        CASE WHEN s."lastActive" > NOW() - (${SESSION_IDLE_MINUTES} * INTERVAL '1 minute') THEN 'Active' ELSE 'Inactive' END AS active
      FROM user_sessions s
      INNER JOIN users u ON u.id = s."userId"
      WHERE s."lastActive" > NOW() - (${SESSION_IDLE_MINUTES} * INTERVAL '1 minute')
      ORDER BY s."lastActive" DESC
    `;
  },

  async findPage(cursor?: string, limit = 20): Promise<{ data: UserSession[]; hasMore: boolean }> {
    // The user-management panel represents active sessions. Remove sessions
    // that have been inactive for the same period used by the status query so
    // timed-out sessions cannot remain visible indefinitely.
    await sql`
      DELETE FROM user_sessions
      WHERE "lastActive" <= NOW() - (${SESSION_IDLE_MINUTES} * INTERVAL '1 minute')
    `;
    const pageSize = Math.min(100, Math.max(1, limit));
    const rows = await sql<UserSession[]>`
      SELECT s.id, s."userId" AS "userId", u.username, u.name AS "user",
        s.device, s.location, s.latitude, s.longitude, s.token, s."createdAt" AS "createdAt", s."lastActive" AS "lastActive",
        CASE WHEN s."lastActive" > NOW() - (${SESSION_IDLE_MINUTES} * INTERVAL '1 minute') THEN 'Active' ELSE 'Inactive' END AS active
      FROM user_sessions s
      INNER JOIN users u ON u.id = s."userId"
      WHERE s."lastActive" > NOW() - (${SESSION_IDLE_MINUTES} * INTERVAL '1 minute')
        AND (${cursor || null}::timestamptz IS NULL OR s."lastActive" < ${cursor || null}::timestamptz)
      ORDER BY s."lastActive" DESC
      LIMIT ${pageSize + 1}
    `;
    return { data: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
  },

  async terminate(id: number): Promise<string | null> {
    const [session] = await sql<{ token: string }[]>`
      DELETE FROM user_sessions
      WHERE id = ${id}
      RETURNING token
    `;
    return session?.token || null;
  },

  async terminateByToken(token: string): Promise<{ id: number; token: string } | null> {
    const [session] = await sql<{ id: number; token: string }[]>`
      DELETE FROM user_sessions
      WHERE token = ${token}
      RETURNING id, token
    `;
    return session || null;
  },

  async touchByToken(token: string): Promise<boolean> {
    const result = await sql`
      UPDATE user_sessions
      SET "lastActive" = NOW()
      WHERE token = ${token}
        AND "lastActive" > NOW() - (${SESSION_IDLE_MINUTES} * INTERVAL '1 minute')
    `;
    return result.count > 0;
  },
};
