import sql from '../config/postgres.js';

export type NoticeStatus = 'Draft' | 'Published' | 'Scheduled';
export type NoticePriority = 'High' | 'Normal';

export interface Notice {
  id: number;
  title: string;
  body: string;
  audience: string;
  createdBy: string | null;
  publishedOn: string | null;
  expiresOn: string;
  status: NoticeStatus;
  priority: NoticePriority;
  createdAt: string;
  updatedAt: string;
}

export type NoticeInput = Omit<Notice, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { createdBy?: string | null };

export type NoticePage = {
  data: Notice[];
  hasMore: boolean;
  nextCursor: string | null;
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function decodeCursor(cursor?: string): { createdAt: string; id: number } | null {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { createdAt?: unknown; id?: unknown };
    if (typeof value.createdAt !== 'string' || !Number.isInteger(value.id)) return null;
    return { createdAt: value.createdAt, id: Number(value.id) };
  } catch {
    return null;
  }
}

function encodeCursor(notice: Notice): string {
  return Buffer.from(JSON.stringify({ createdAt: notice.createdAt, id: notice.id })).toString('base64url');
}

export const noticeRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        audience VARCHAR(80) NOT NULL,
        "createdBy" VARCHAR(120),
        "publishedOn" DATE,
        "expiresOn" DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Draft',
        priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE notices ADD COLUMN IF NOT EXISTS "createdBy" VARCHAR(120)`;
  },

  async findPage(cursor?: string, requestedLimit = DEFAULT_PAGE_SIZE): Promise<NoticePage> {
    const pageSize = Math.min(Math.max(Number(requestedLimit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const decoded = decodeCursor(cursor);
    const rows = await sql<Notice[]>`
      SELECT id, title, body, audience, "createdBy", "publishedOn", "expiresOn", status, priority,
        "createdAt", "updatedAt"
      FROM notices
      WHERE (${decoded?.createdAt || null}::timestamptz IS NULL
        OR "createdAt" < ${decoded?.createdAt || null}::timestamptz
        OR ("createdAt" = ${decoded?.createdAt || null}::timestamptz AND id < ${decoded?.id || null}))
      ORDER BY "createdAt" DESC, id DESC
      LIMIT ${pageSize + 1}
    `;
    const data = rows.slice(0, pageSize);
    return {
      data,
      hasMore: rows.length > pageSize,
      nextCursor: data.length === pageSize ? encodeCursor(data[data.length - 1]) : null,
    };
  },

  async create(input: NoticeInput): Promise<Notice> {
    const [notice] = await sql<Notice[]>`
      INSERT INTO notices (title, body, audience, "createdBy", "publishedOn", "expiresOn", status, priority)
      VALUES (${input.title}, ${input.body}, ${input.audience}, ${input.createdBy || null}, ${input.publishedOn || null}, ${input.expiresOn}, ${input.status}, ${input.priority})
      RETURNING id, title, body, audience, "createdBy", "publishedOn", "expiresOn", status, priority, "createdAt", "updatedAt"
    `;
    return notice;
  },

  async update(id: number, input: NoticeInput): Promise<Notice | null> {
    const [notice] = await sql<Notice[]>`
      UPDATE notices SET title = ${input.title}, body = ${input.body}, audience = ${input.audience},
        "publishedOn" = ${input.publishedOn || null}, "expiresOn" = ${input.expiresOn},
        status = ${input.status}, priority = ${input.priority}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, title, body, audience, "createdBy", "publishedOn", "expiresOn", status, priority, "createdAt", "updatedAt"
    `;
    return notice || null;
  },

  async remove(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM notices WHERE id = ${id}`;
    return result.count > 0;
  },
};
