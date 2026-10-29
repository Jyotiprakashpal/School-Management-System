import sql from '../config/postgres.js';

export interface BackupSettings {
  id: number;
  automaticBackup: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';
  lastBackupAt: Date | null;
  googleDriveConnected: boolean;
  googleDriveToken: string | null;
  emailBackupEnabled: boolean;
  senderEmail: string | null;
  appPassword: string | null;
  backupRecipients: string | null;
  mailServer: string | null;
  mailPort: number | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupRecord {
  id: number;
  fileName: string;
  fileSize: number;
  status: 'completed' | 'failed' | 'in_progress';
  backupType: 'manual' | 'automatic' | 'cloud';
  encrypted: boolean;
  recoveryKey: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface UpdateBackupSettingsDto {
  automaticBackup?: boolean;
  backupFrequency?: 'Daily' | 'Weekly' | 'Monthly';
  googleDriveConnected?: boolean;
  googleDriveToken?: string | null;
  emailBackupEnabled?: boolean;
  senderEmail?: string | null;
  appPassword?: string | null;
  backupRecipients?: string | null;
  mailServer?: string | null;
  mailPort?: number | null;
  createdBy?: string;
}

type BackupSettingsRow = Omit<BackupSettings, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
type BackupRecordRow = Omit<BackupRecord, 'createdAt'> & { createdAt: string };

function toBackupSettingsResponse(row: BackupSettingsRow): BackupSettings {
  return { ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) };
}

function toBackupRecordResponse(row: BackupRecordRow): BackupRecord {
  return { ...row, createdAt: new Date(row.createdAt) };
}

const selectBackupSettingsColumns = sql`
  id, "automaticBackup", "backupFrequency", "lastBackupAt", "googleDriveConnected", "googleDriveToken",
  "emailBackupEnabled", "senderEmail", "appPassword", "backupRecipients", "mailServer", "mailPort",
  "createdBy", "createdAt", "updatedAt"
`;

const selectBackupRecordColumns = sql`
  id, "fileName", "fileSize", status, "backupType", encrypted, "recoveryKey", "createdBy", "createdAt"
`;

export const backupRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS backup_settings (
        id SERIAL PRIMARY KEY,
        "automaticBackup" BOOLEAN NOT NULL DEFAULT true,
        "backupFrequency" VARCHAR(20) NOT NULL DEFAULT 'Daily' CHECK ("backupFrequency" IN ('Daily', 'Weekly', 'Monthly')),
        "lastBackupAt" TIMESTAMPTZ,
        "googleDriveConnected" BOOLEAN NOT NULL DEFAULT false,
        "googleDriveToken" TEXT,
        "emailBackupEnabled" BOOLEAN NOT NULL DEFAULT false,
        "senderEmail" VARCHAR(120),
        "appPassword" VARCHAR(120),
        "backupRecipients" TEXT,
        "mailServer" VARCHAR(120),
        "mailPort" INTEGER,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO backup_settings (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS backup_records (
        id SERIAL PRIMARY KEY,
        "fileName" VARCHAR(255) NOT NULL,
        "fileSize" BIGINT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'in_progress')),
        "backupType" VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK ("backupType" IN ('manual', 'automatic', 'cloud')),
        encrypted BOOLEAN NOT NULL DEFAULT true,
        "recoveryKey" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records("createdAt" DESC)
    `;
  },

  async getBackupSettings(): Promise<BackupSettings | null> {
    const [settings] = await sql<BackupSettingsRow[]>`
      SELECT ${selectBackupSettingsColumns} FROM backup_settings WHERE id = 1
    `;
    return settings ? toBackupSettingsResponse(settings) : null;
  },

  async updateBackupSettings(data: UpdateBackupSettingsDto): Promise<BackupSettings | null> {
    const current = await this.getBackupSettings();
    if (!current) return null;

    const next = {
      automaticBackup: data.automaticBackup ?? current.automaticBackup,
      backupFrequency: data.backupFrequency ?? current.backupFrequency,
      googleDriveConnected: data.googleDriveConnected ?? current.googleDriveConnected,
      googleDriveToken: data.googleDriveToken ?? current.googleDriveToken,
      emailBackupEnabled: data.emailBackupEnabled ?? current.emailBackupEnabled,
      senderEmail: data.senderEmail ?? current.senderEmail,
      appPassword: data.appPassword ?? current.appPassword,
      backupRecipients: data.backupRecipients ?? current.backupRecipients,
      mailServer: data.mailServer ?? current.mailServer,
      mailPort: data.mailPort ?? current.mailPort,
    };

    const [settings] = await sql<BackupSettingsRow[]>`
      UPDATE backup_settings
       SET "automaticBackup" = ${next.automaticBackup},
           "backupFrequency" = ${next.backupFrequency},
           "googleDriveConnected" = ${next.googleDriveConnected},
           "googleDriveToken" = ${next.googleDriveToken},
           "emailBackupEnabled" = ${next.emailBackupEnabled},
           "senderEmail" = ${next.senderEmail},
           "appPassword" = ${next.appPassword},
           "backupRecipients" = ${next.backupRecipients},
           "mailServer" = ${next.mailServer},
           "mailPort" = ${next.mailPort},
           "updatedAt" = NOW()
      WHERE id = 1
      RETURNING ${selectBackupSettingsColumns}
    `;
    return settings ? toBackupSettingsResponse(settings) : null;
  },

  async updateLastBackupAt(): Promise<void> {
    await sql`
      UPDATE backup_settings SET "lastBackupAt" = NOW() WHERE id = 1
    `;
  },

  async createBackupRecord(data: Omit<BackupRecord, 'id' | 'createdAt'>): Promise<BackupRecord> {
    const [record] = await sql<BackupRecordRow[]>`
      INSERT INTO backup_records ("fileName", "fileSize", status, "backupType", encrypted, "recoveryKey", "createdBy")
      VALUES (${data.fileName}, ${data.fileSize}, ${data.status}, ${data.backupType}, ${data.encrypted}, ${data.recoveryKey}, ${data.createdBy})
      RETURNING ${selectBackupRecordColumns}
    `;
    return toBackupRecordResponse(record);
  },

  async getBackupRecords(limit = 50, offset = 0): Promise<{ data: BackupRecord[]; total: number }> {
    const records = await sql<BackupRecordRow[]>`
      SELECT ${selectBackupRecordColumns}
      FROM backup_records
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM backup_records
    `;

    return { data: records.map(toBackupRecordResponse), total: Number(total?.count || 0) };
  },

  async getBackupRecordById(id: number): Promise<BackupRecord | null> {
    const [record] = await sql<BackupRecordRow[]>`
      SELECT ${selectBackupRecordColumns} FROM backup_records WHERE id = ${id}
    `;
    return record ? toBackupRecordResponse(record) : null;
  },

  async deleteBackupRecord(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM backup_records WHERE id = ${id}
    `;
    return result.count > 0;
  },
};