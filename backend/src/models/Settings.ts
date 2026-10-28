import sql from '../config/postgres.js';

export interface SchoolSettings {
  id: number;
  schoolName: string;
  schoolCode: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolWebsite: string;
  schoolPrincipal: string;
  academicYear: string;
  weekStart: string;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationFee: boolean;
  notificationAttendance: boolean;
  notificationReports: boolean;
  notificationProduct: boolean;
  theme: string;
  density: string;
  securityTwoFactor: boolean;
  securityLoginAlerts: boolean;
  sessionTimeout: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsDto {
  schoolName?: string;
  schoolCode?: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  schoolPrincipal?: string;
  academicYear?: string;
  weekStart?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  notificationEmail?: boolean;
  notificationSms?: boolean;
  notificationFee?: boolean;
  notificationAttendance?: boolean;
  notificationReports?: boolean;
  notificationProduct?: boolean;
  theme?: string;
  density?: string;
  securityTwoFactor?: boolean;
  securityLoginAlerts?: boolean;
  sessionTimeout?: number;
  createdBy?: string;
}

type SettingsRow = Omit<SchoolSettings, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };

function toSettingsResponse(settings: SettingsRow): SchoolSettings {
  return { ...settings, createdAt: new Date(settings.createdAt), updatedAt: new Date(settings.updatedAt) };
}

const selectSettingsColumns = sql`
  id, "schoolName", "schoolCode", "schoolEmail", "schoolPhone", "schoolAddress", "schoolWebsite", "schoolPrincipal",
  "academicYear", "weekStart", language, timezone, "dateFormat", currency,
  "notificationEmail", "notificationSms", "notificationFee", "notificationAttendance", "notificationReports", "notificationProduct",
  theme, density, "securityTwoFactor", "securityLoginAlerts", "sessionTimeout", "createdBy", "createdAt", "updatedAt"
`;

export const settingsRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS school_settings (
        id SERIAL PRIMARY KEY,
        "schoolName" VARCHAR(120) NOT NULL DEFAULT 'School Name',
        "schoolCode" VARCHAR(80) NOT NULL DEFAULT 'SCH-001',
        "schoolEmail" VARCHAR(120) NOT NULL DEFAULT 'admin@school.edu',
        "schoolPhone" VARCHAR(40) NOT NULL DEFAULT '+91 00000 00000',
        "schoolAddress" TEXT,
        "schoolWebsite" VARCHAR(200),
        "schoolPrincipal" VARCHAR(120),
        "academicYear" VARCHAR(20) NOT NULL DEFAULT '2027–28',
        "weekStart" VARCHAR(20) NOT NULL DEFAULT 'Monday',
        language VARCHAR(20) NOT NULL DEFAULT 'English',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
        "dateFormat" VARCHAR(20) NOT NULL DEFAULT 'DD MMM YYYY',
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
        "notificationSms" BOOLEAN NOT NULL DEFAULT true,
        "notificationFee" BOOLEAN NOT NULL DEFAULT true,
        "notificationAttendance" BOOLEAN NOT NULL DEFAULT false,
        "notificationReports" BOOLEAN NOT NULL DEFAULT true,
        "notificationProduct" BOOLEAN NOT NULL DEFAULT false,
        theme VARCHAR(20) NOT NULL DEFAULT 'teal',
        density VARCHAR(20) NOT NULL DEFAULT 'comfortable',
        "securityTwoFactor" BOOLEAN NOT NULL DEFAULT true,
        "securityLoginAlerts" BOOLEAN NOT NULL DEFAULT true,
        "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Insert default row if not exists
    await sql`
      INSERT INTO school_settings (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `;
  },

  async getSettings(): Promise<SchoolSettings | null> {
    const [settings] = await sql<SettingsRow[]>`
      SELECT ${selectSettingsColumns} FROM school_settings WHERE id = 1
    `;
    return settings ? toSettingsResponse(settings) : null;
  },

  async updateSettings(data: UpdateSettingsDto): Promise<SchoolSettings | null> {
    const current = await this.getSettings();
    if (!current) return null;

    const next = {
      schoolName: data.schoolName ?? current.schoolName,
      schoolCode: data.schoolCode ?? current.schoolCode,
      schoolEmail: data.schoolEmail ?? current.schoolEmail,
      schoolPhone: data.schoolPhone ?? current.schoolPhone,
      schoolAddress: data.schoolAddress ?? current.schoolAddress,
      schoolWebsite: data.schoolWebsite ?? current.schoolWebsite,
      schoolPrincipal: data.schoolPrincipal ?? current.schoolPrincipal,
      academicYear: data.academicYear ?? current.academicYear,
      weekStart: data.weekStart ?? current.weekStart,
      language: data.language ?? current.language,
      timezone: data.timezone ?? current.timezone,
      dateFormat: data.dateFormat ?? current.dateFormat,
      currency: data.currency ?? current.currency,
      notificationEmail: data.notificationEmail ?? current.notificationEmail,
      notificationSms: data.notificationSms ?? current.notificationSms,
      notificationFee: data.notificationFee ?? current.notificationFee,
      notificationAttendance: data.notificationAttendance ?? current.notificationAttendance,
      notificationReports: data.notificationReports ?? current.notificationReports,
      notificationProduct: data.notificationProduct ?? current.notificationProduct,
      theme: data.theme ?? current.theme,
      density: data.density ?? current.density,
      securityTwoFactor: data.securityTwoFactor ?? current.securityTwoFactor,
      securityLoginAlerts: data.securityLoginAlerts ?? current.securityLoginAlerts,
      sessionTimeout: data.sessionTimeout ?? current.sessionTimeout
    };

    const [settings] = await sql<SettingsRow[]>`
      UPDATE school_settings
       SET "schoolName" = ${next.schoolName},
           "schoolCode" = ${next.schoolCode},
           "schoolEmail" = ${next.schoolEmail},
           "schoolPhone" = ${next.schoolPhone},
           "schoolAddress" = ${next.schoolAddress},
           "schoolWebsite" = ${next.schoolWebsite},
           "schoolPrincipal" = ${next.schoolPrincipal},
           "academicYear" = ${next.academicYear},
           "weekStart" = ${next.weekStart},
           language = ${next.language},
           timezone = ${next.timezone},
           "dateFormat" = ${next.dateFormat},
           currency = ${next.currency},
           "notificationEmail" = ${next.notificationEmail},
           "notificationSms" = ${next.notificationSms},
           "notificationFee" = ${next.notificationFee},
           "notificationAttendance" = ${next.notificationAttendance},
           "notificationReports" = ${next.notificationReports},
           "notificationProduct" = ${next.notificationProduct},
           theme = ${next.theme},
           density = ${next.density},
           "securityTwoFactor" = ${next.securityTwoFactor},
           "securityLoginAlerts" = ${next.securityLoginAlerts},
           "sessionTimeout" = ${next.sessionTimeout},
           "updatedAt" = NOW()
       WHERE id = 1
       RETURNING ${selectSettingsColumns}
    `;
    return settings ? toSettingsResponse(settings) : null;
  }
};