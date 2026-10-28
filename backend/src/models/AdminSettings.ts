import sql from '../config/postgres.js';

export interface Backup {
  id: number;
  name: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'full' | 'incremental' | 'manual' | 'scheduled';
  filePath: string | null;
  encryptionKey: string | null;
  cloudPath: string | null;
  emailSent: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSettings {
  id: number;
  automaticBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetentionDays: number;
  encryptionEnabled: boolean;
  cloudBackupEnabled: boolean;
  cloudProvider: 'google_drive' | 'aws_s3' | 'azure_blob' | null;
  cloudConnected: boolean;
  emailBackupEnabled: boolean;
  emailSender: string | null;
  emailAppPassword: string | null;
  emailRecipients: string | null;
  mailServer: string | null;
  mailPort: number | null;
  lastBackupAt: Date | null;
  lastBackupSize: string | null;
  nextBackupAt: Date | null;
  recoveryKey: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBackupDto {
  type?: 'full' | 'incremental' | 'manual';
  name?: string;
  createdBy?: string;
}

export interface UpdateAdminSettingsDto {
  automaticBackup?: boolean;
  backupFrequency?: 'daily' | 'weekly' | 'monthly';
  backupRetentionDays?: number;
  encryptionEnabled?: boolean;
  cloudBackupEnabled?: boolean;
  cloudProvider?: 'google_drive' | 'aws_s3' | 'azure_blob' | null;
  emailBackupEnabled?: boolean;
  emailSender?: string;
  emailAppPassword?: string;
  emailRecipients?: string;
  mailServer?: string;
  mailPort?: number;
  recoveryKey?: string;
}

export interface BackupQuery {
  page?: number;
  limit?: number;
  status?: 'completed' | 'failed' | 'in_progress';
  type?: 'full' | 'incremental' | 'manual' | 'scheduled';
}

type BackupRow = Omit<Backup, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type AdminSettingsRow = Omit<AdminSettings, 'lastBackupAt' | 'nextBackupAt' | 'createdAt' | 'updatedAt'> & {
  lastBackupAt: string | null;
  nextBackupAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toBackupResponse(row: BackupRow): Backup {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function toAdminSettingsResponse(row: AdminSettingsRow): AdminSettings {
  return {
    ...row,
    lastBackupAt: row.lastBackupAt ? new Date(row.lastBackupAt) : null,
    nextBackupAt: row.nextBackupAt ? new Date(row.nextBackupAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

const selectBackupColumns = sql`
  id, name, size, status, type, "filePath", "encryptionKey", "cloudPath", "emailSent", "createdBy", "createdAt", "updatedAt"
`;

const selectAdminSettingsColumns = sql`
  id, "automaticBackup", "backupFrequency", "backupRetentionDays", "encryptionEnabled",
  "cloudBackupEnabled", "cloudProvider", "cloudConnected", "emailBackupEnabled",
  "emailSender", "emailAppPassword", "emailRecipients", "mailServer", "mailPort",
  "lastBackupAt", "lastBackupSize", "nextBackupAt", "recoveryKey", "createdBy", "createdAt", "updatedAt"
`;

export const adminSettingsRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        "automaticBackup" BOOLEAN NOT NULL DEFAULT TRUE,
        "backupFrequency" VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK ("backupFrequency" IN ('daily', 'weekly', 'monthly')),
        "backupRetentionDays" INTEGER NOT NULL DEFAULT 30,
        "encryptionEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
        "cloudBackupEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
        "cloudProvider" VARCHAR(20) CHECK ("cloudProvider" IN ('google_drive', 'aws_s3', 'azure_blob')),
        "cloudConnected" BOOLEAN NOT NULL DEFAULT FALSE,
        "emailBackupEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
        "emailSender" VARCHAR(120),
        "emailAppPassword" VARCHAR(200),
        "emailRecipients" TEXT,
        "mailServer" VARCHAR(100),
        "mailPort" INTEGER,
        "lastBackupAt" TIMESTAMPTZ,
        "lastBackupSize" VARCHAR(20),
        "nextBackupAt" TIMESTAMPTZ,
        "recoveryKey" VARCHAR(500),
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        size VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('completed', 'failed', 'in_progress')),
        type VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (type IN ('full', 'incremental', 'manual', 'scheduled')),
        "filePath" VARCHAR(500),
        "encryptionKey" VARCHAR(500),
        "cloudPath" VARCHAR(500),
        "emailSent" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups("createdAt" DESC)
    `;
  },

  async getSettings(): Promise<AdminSettings | null> {
    const [settings] = await sql<AdminSettingsRow[]>`
      SELECT ${selectAdminSettingsColumns} FROM admin_settings WHERE id = 1
    `;
    if (!settings) {
      // Create default settings
      const [newSettings] = await sql<AdminSettingsRow[]>`
        INSERT INTO admin_settings (id) VALUES (1)
        RETURNING ${selectAdminSettingsColumns}
      `;
      return toAdminSettingsResponse(newSettings);
    }
    return toAdminSettingsResponse(settings);
  },

  async updateSettings(data: Partial<UpdateAdminSettingsDto>): Promise<AdminSettings> {
    const current = await this.getSettings();
    if (!current) throw new Error('Admin settings not found');

    const updates: string[] = [];
    const values: any[] = [];

    if (data.automaticBackup !== undefined) { updates.push('"automaticBackup" = $' + (values.length + 1)); values.push(data.automaticBackup); }
    if (data.backupFrequency !== undefined) { updates.push('"backupFrequency" = $' + (values.length + 1)); values.push(data.backupFrequency); }
    if (data.backupRetentionDays !== undefined) { updates.push('"backupRetentionDays" = $' + (values.length + 1)); values.push(data.backupRetentionDays); }
    if (data.encryptionEnabled !== undefined) { updates.push('"encryptionEnabled" = $' + (values.length + 1)); values.push(data.encryptionEnabled); }
    if (data.cloudBackupEnabled !== undefined) { updates.push('"cloudBackupEnabled" = $' + (values.length + 1)); values.push(data.cloudBackupEnabled); }
    if (data.cloudProvider !== undefined) { updates.push('"cloudProvider" = $' + (values.length + 1)); values.push(data.cloudProvider); }
    if (data.emailBackupEnabled !== undefined) { updates.push('"emailBackupEnabled" = $' + (values.length + 1)); values.push(data.emailBackupEnabled); }
    if (data.emailSender !== undefined) { updates.push('"emailSender" = $' + (values.length + 1)); values.push(data.emailSender); }
    if (data.emailAppPassword !== undefined) { updates.push('"emailAppPassword" = $' + (values.length + 1)); values.push(data.emailAppPassword); }
    if (data.emailRecipients !== undefined) { updates.push('"emailRecipients" = $' + (values.length + 1)); values.push(data.emailRecipients); }
    if (data.mailServer !== undefined) { updates.push('"mailServer" = $' + (values.length + 1)); values.push(data.mailServer); }
    if (data.mailPort !== undefined) { updates.push('"mailPort" = $' + (values.length + 1)); values.push(data.mailPort); }
    if (data.recoveryKey !== undefined) { updates.push('"recoveryKey" = $' + (values.length + 1)); values.push(data.recoveryKey); }

    if (updates.length === 0) {
      return current;
    }

    updates.push('"updatedAt" = NOW()');
    values.push(1);

    const query = `UPDATE admin_settings SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectAdminSettingsColumns}`;
    const settings = await sql.unsafe(query, values) as AdminSettingsRow[];
    return toAdminSettingsResponse(settings[0]);
  },

  async getBackups(params: BackupQuery = {}): Promise<{ data: Backup[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const status = params.status || null;
    const type = params.type || null;

    const backups = await sql<BackupRow[]>`
      SELECT ${selectBackupColumns}
      FROM backups
      WHERE (${status}::text IS NULL OR status = ${status})
        AND (${type}::text IS NULL OR type = ${type})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM backups
      WHERE (${status}::text IS NULL OR status = ${status})
        AND (${type}::text IS NULL OR type = ${type})
    `;

    return { data: backups.map(toBackupResponse), total: Number(total?.count || 0) };
  },

  async createBackup(data: CreateBackupDto): Promise<Backup> {
    const name = data.name || `backup_${Date.now()}`;
    const backups = await sql<BackupRow[]>`
      INSERT INTO backups (name, type, status)
      VALUES (${name}, ${data.type || 'manual'}, 'in_progress')
      RETURNING ${selectBackupColumns}
    `;
    return toBackupResponse(backups[0]);
  },

  async updateBackup(id: number, data: Partial<Backup>): Promise<Backup | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(data.name); }
    if (data.size !== undefined) { updates.push('size = $' + (values.length + 1)); values.push(data.size); }
    if (data.status !== undefined) { updates.push('status = $' + (values.length + 1)); values.push(data.status); }
    if (data.type !== undefined) { updates.push('type = $' + (values.length + 1)); values.push(data.type); }
    if (data.filePath !== undefined) { updates.push('"filePath" = $' + (values.length + 1)); values.push(data.filePath); }
    if (data.encryptionKey !== undefined) { updates.push('"encryptionKey" = $' + (values.length + 1)); values.push(data.encryptionKey); }
    if (data.cloudPath !== undefined) { updates.push('"cloudPath" = $' + (values.length + 1)); values.push(data.cloudPath); }
    if (data.emailSent !== undefined) { updates.push('"emailSent" = $' + (values.length + 1)); values.push(data.emailSent); }

    if (updates.length === 0) return this.getBackupById(id);

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE backups SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectBackupColumns}`;
    const backup = await sql.unsafe(query, values) as BackupRow[];
    return backup.length > 0 ? toBackupResponse(backup[0]) : null;
  },

  async getBackupById(id: number): Promise<Backup | null> {
    const backups = await sql<BackupRow[]>`
      SELECT ${selectBackupColumns} FROM backups WHERE id = ${id}
    `;
    return backups.length > 0 ? toBackupResponse(backups[0]) : null;
  },

  async deleteBackup(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM backups WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getStats(): Promise<{
    totalBackups: number;
    completedBackups: number;
    failedBackups: number;
    inProgressBackups: number;
    totalSize: string;
    lastBackupAt: Date | null;
    lastBackupSize: string | null;
  }> {
    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM backups
    `;
    const [completed] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM backups WHERE status = 'completed'
    `;
    const [failed] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM backups WHERE status = 'failed'
    `;
    const [inProgress] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM backups WHERE status = 'in_progress'
    `;
    const [lastBackup] = await sql<{ createdAt: string; size: string }[]>`
      SELECT "createdAt", size FROM backups WHERE status = 'completed' ORDER BY "createdAt" DESC LIMIT 1
    `;

    return {
      totalBackups: Number(total?.count || 0),
      completedBackups: Number(completed?.count || 0),
      failedBackups: Number(failed?.count || 0),
      inProgressBackups: Number(inProgress?.count || 0),
      totalSize: '0 MB', // Could calculate from sum of sizes
      lastBackupAt: lastBackup?.createdAt ? new Date(lastBackup.createdAt) : null,
      lastBackupSize: lastBackup?.size || null,
    };
  },

  async generateRecoveryKey(): Promise<string> {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    await sql`
      UPDATE admin_settings SET "recoveryKey" = ${key}, "updatedAt" = NOW() WHERE id = 1
    `;
    return key;
  },

  async updateLastBackup(size: string): Promise<void> {
    const nextBackup = new Date();
    nextBackup.setDate(nextBackup.getDate() + 1);
    nextBackup.setHours(6, 0, 0, 0); // 6 AM next day

    await sql`
      UPDATE admin_settings
      SET "lastBackupAt" = NOW(), "lastBackupSize" = ${size}, "nextBackupAt" = ${nextBackup.toISOString()}, "updatedAt" = NOW()
      WHERE id = 1
    `;
  },

  async updateCloudConnection(connected: boolean): Promise<void> {
    await sql`
      UPDATE admin_settings SET "cloudConnected" = ${connected}, "updatedAt" = NOW() WHERE id = 1
    `;
  },

  async generateBackupFile(): Promise<{ name: string; size: string }> {
    // Simulate backup file generation
    await new Promise(resolve => setTimeout(resolve, 100));
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const name = `school_full_${timestamp}.zip`;
    const size = `${(Math.random() * 5 + 20).toFixed(1)} MB`;
    return { name, size };
  },
};