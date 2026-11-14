import sql from '../config/postgres.js';

export interface Notification {
  id: number;
  userId: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'user' | 'student' | 'enquiry' | 'admission' | 'settings' | 'system' | 'document' | 'role';
  entityId: string | null;
  isRead: boolean;
  createdBy: string | null;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  entityType: 'user' | 'student' | 'enquiry' | 'admission' | 'settings' | 'system' | 'document' | 'role';
  entityId?: string;
  createdBy?: string;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  userId?: string;
  isRead?: boolean;
  type?: string;
  entityType?: string;
  cursor?: string;
}

type NotificationRow = Omit<Notification, 'createdAt'> & { createdAt: string };

function toNotificationResponse(notification: NotificationRow): Notification {
  return { ...notification, createdAt: new Date(notification.createdAt) };
}

const selectNotificationColumns = sql`
  id, "userId", title, message, type, "entityType", "entityId", "isRead", "createdBy", "createdAt"
`;

export const notificationRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        "userId" TEXT REFERENCES users("userId") ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        "entityType" VARCHAR(20) NOT NULL,
        "entityId" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Existing deployments may have created this table before all notification
    // fields were introduced. Keep the activity API compatible with them.
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "userId" TEXT`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(200) DEFAULT 'Account activity'`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT DEFAULT 'An account change was recorded'`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'info'`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "entityType" VARCHAR(20) DEFAULT 'user'`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "entityId" TEXT`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "createdBy" TEXT`;
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW()`;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt" DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications("isRead")
    `;
  },

  async seedActivity(): Promise<void> {
    const [{ count }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM notifications`;
    if (count > 0) return;

    const [user] = await sql<{ userId: string; name: string }[]>`
      SELECT "userId", name FROM users ORDER BY id LIMIT 1
    `;
    if (!user) return;

    await this.create({
      userId: user.userId,
      createdBy: user.userId,
      title: 'Account activity',
      message: `${user.name} account is ready to use`,
      type: 'success',
      entityType: 'user',
      entityId: user.userId,
    });
  },

  async create(data: CreateNotificationDto): Promise<Notification> {
    const [notification] = await sql<NotificationRow[]>`
      INSERT INTO notifications ("userId", title, message, type, "entityType", "entityId", "createdBy")
      VALUES (${data.userId || null}, ${data.title}, ${data.message}, ${data.type || 'info'}, ${data.entityType}, ${data.entityId || null}, ${data.createdBy || null})
      RETURNING ${selectNotificationColumns}
    `;
    return toNotificationResponse(notification);
  },

  async createForAllUsers(data: Omit<CreateNotificationDto, 'userId'>): Promise<Notification[]> {
    const users = await sql<{ userId: string }[]>`
      SELECT "userId" FROM users
    `;
    
    if (users.length === 0) return [];
    
    const notifications = await sql<NotificationRow[]>`
      INSERT INTO notifications ("userId", title, message, type, "entityType", "entityId")
      SELECT u."userId", ${data.title}, ${data.message}, ${data.type || 'info'}, ${data.entityType}, ${data.entityId || null}
      FROM users u
      RETURNING ${selectNotificationColumns}
    `;
    return notifications.map(toNotificationResponse);
  },

  async findMany(params: NotificationQuery): Promise<{ data: Notification[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;
    const userId = params.userId || null;
    const isRead = params.isRead !== undefined ? params.isRead : null;
    const type = params.type || null;
    const entityType = params.entityType || null;
    const cursor = params.cursor || null;

    const notifications = await sql<NotificationRow[]>`
      SELECT ${selectNotificationColumns}
      FROM notifications
      WHERE (${userId}::text IS NULL OR "userId" = ${userId})
        AND (${isRead}::boolean IS NULL OR "isRead" = ${isRead})
        AND (${type}::text IS NULL OR type = ${type})
        AND (${entityType}::text IS NULL OR "entityType" = ${entityType})
        AND (${cursor}::timestamptz IS NULL OR "createdAt" < ${cursor}::timestamptz)
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM notifications
      WHERE (${userId}::text IS NULL OR "userId" = ${userId})
        AND (${isRead}::boolean IS NULL OR "isRead" = ${isRead})
        AND (${type}::text IS NULL OR type = ${type})
        AND (${entityType}::text IS NULL OR "entityType" = ${entityType})
    `;

    return { data: notifications.map(toNotificationResponse), total: Number(total?.count || 0) };
  },

  async findUnreadCount(userId: string): Promise<number> {
    const [result] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM notifications
      WHERE "userId" = ${userId} AND "isRead" = false
    `;
    return Number(result?.count || 0);
  },

  async markAsRead(id: number, userId: string): Promise<Notification | null> {
    const [notification] = await sql<NotificationRow[]>`
      UPDATE notifications
       SET "isRead" = true
       WHERE id = ${id} AND ("userId" = ${userId} OR "userId" IS NULL)
       RETURNING ${selectNotificationColumns}
    `;
    return notification ? toNotificationResponse(notification) : null;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const result = await sql`
      UPDATE notifications
       SET "isRead" = true
       WHERE "userId" = ${userId} AND "isRead" = false
    `;
    return result.count;
  },

  async delete(id: number, userId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM notifications
       WHERE id = ${id} AND ("userId" = ${userId} OR "userId" IS NULL)
    `;
    return result.count > 0;
  }
};
