import sql from '../config/postgres.js';

export interface ReportTemplate {
  id: number;
  title: string;
  description: string;
  category: 'Finance' | 'Academic' | 'Attendance' | 'Students';
  format: string;
  type: 'chart' | 'fees' | 'people' | 'attendance';
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReport {
  id: number;
  templateId: number | null;
  title: string;
  description: string;
  category: string;
  format: string;
  period: string;
  size: string;
  status: 'Ready' | 'Scheduled' | 'Generating';
  configuration: Record<string, any>;
  filePath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportTemplateDto {
  title: string;
  description: string;
  category: 'Finance' | 'Academic' | 'Attendance' | 'Students';
  format: string;
  type: 'chart' | 'fees' | 'people' | 'attendance';
}

export interface CreateGeneratedReportDto {
  templateId?: number;
  title: string;
  description: string;
  category: string;
  format: string;
  period: string;
  configuration: Record<string, any>;
  status?: 'Ready' | 'Scheduled';
}

export interface ReportQuery {
  page?: number;
  limit?: number;
  category?: string;
  status?: 'Ready' | 'Scheduled' | 'Generating';
  search?: string;
}

type ReportTemplateRow = Omit<ReportTemplate, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type GeneratedReportRow = Omit<GeneratedReport, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toReportTemplateResponse(template: ReportTemplateRow): ReportTemplate {
  return {
    ...template,
    createdAt: new Date(template.createdAt),
    updatedAt: new Date(template.updatedAt),
  };
}

function toGeneratedReportResponse(report: GeneratedReportRow): GeneratedReport {
  return {
    ...report,
    configuration: typeof report.configuration === 'string' ? JSON.parse(report.configuration) : report.configuration,
    createdAt: new Date(report.createdAt),
    updatedAt: new Date(report.updatedAt),
  };
}

const selectReportTemplateColumns = sql`
  id, title, description, category, format, type, "createdAt", "updatedAt"
`;

const selectGeneratedReportColumns = sql`
  id, "templateId", title, description, category, format, period, size, status, configuration, "filePath", "createdAt", "updatedAt"
`;

export const reportRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS report_templates (
        id SERIAL PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('Finance', 'Academic', 'Attendance', 'Students')),
        format VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('chart', 'fees', 'people', 'attendance')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS generated_reports (
        id SERIAL PRIMARY KEY,
        "templateId" INTEGER REFERENCES report_templates(id) ON DELETE SET NULL,
        title VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(20) NOT NULL,
        format VARCHAR(20) NOT NULL,
        period VARCHAR(100) NOT NULL,
        size VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'Generating' CHECK (status IN ('Ready', 'Scheduled', 'Generating')),
        configuration JSONB NOT NULL DEFAULT '{}',
        "filePath" VARCHAR(500),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_reports_template_id ON generated_reports("templateId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_reports_category ON generated_reports(category)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports("createdAt" DESC)
    `;
  },

  async seedTemplates(): Promise<void> {
    const count = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM report_templates
    `;
    if (Number(count[0]?.count || 0) > 0) return;

    const templates = [
      { title: 'Class-wise Fee Summary', description: 'Collection, pending dues, and payment completion by class.', category: 'Finance', format: 'PDF / CSV', type: 'fees' },
      { title: 'Income vs Expense', description: 'Monthly financial performance with income and spending comparison.', category: 'Finance', format: 'PDF', type: 'chart' },
      { title: 'Fee Defaulters', description: 'Students with outstanding fee balances and contact details.', category: 'Finance', format: 'PDF / CSV', type: 'fees' },
      { title: 'Expense Ledger', description: 'Detailed school expenditure grouped by category and payment mode.', category: 'Finance', format: 'PDF / CSV', type: 'chart' },
      { title: 'Student Attendance', description: 'Monthly attendance percentage, absences, and late arrivals.', category: 'Attendance', format: 'PDF / CSV', type: 'attendance' },
      { title: 'Session Student Register', description: 'Student enrollment by class, section, gender, and status.', category: 'Students', format: 'CSV', type: 'people' },
      { title: 'Class Result Analysis', description: 'Subject performance, class averages, grades, and pass rates.', category: 'Academic', format: 'PDF', type: 'chart' },
      { title: 'Exam Marks Register', description: 'Complete marks register for a selected exam and class.', category: 'Academic', format: 'PDF / CSV', type: 'chart' },
    ];

    for (const t of templates) {
      await sql`
        INSERT INTO report_templates (title, description, category, format, type)
        VALUES (${t.title}, ${t.description}, ${t.category}, ${t.format}, ${t.type})
        ON CONFLICT DO NOTHING
      `;
    }
  },

  async findManyTemplates(params: { category?: string; search?: string }): Promise<ReportTemplate[]> {
    const category = params.category || null;
    const search = params.search ? '%' + params.search + '%' : null;

    const templates = await sql<ReportTemplateRow[]>`
      SELECT ${selectReportTemplateColumns}
      FROM report_templates
      WHERE (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR title ILIKE ${search} OR description ILIKE ${search})
      ORDER BY category, title
    `;
    return templates.map(toReportTemplateResponse);
  },

  async findTemplateById(id: number): Promise<ReportTemplate | null> {
    const [template] = await sql<ReportTemplateRow[]>`
      SELECT ${selectReportTemplateColumns} FROM report_templates WHERE id = ${id}
    `;
    return template ? toReportTemplateResponse(template) : null;
  },

  async createTemplate(data: CreateReportTemplateDto): Promise<ReportTemplate> {
    const [template] = await sql<ReportTemplateRow[]>`
      INSERT INTO report_templates (title, description, category, format, type)
      VALUES (${data.title}, ${data.description}, ${data.category}, ${data.format}, ${data.type})
      RETURNING ${selectReportTemplateColumns}
    `;
    return toReportTemplateResponse(template);
  },

  async findManyGenerated(params: ReportQuery): Promise<{ data: GeneratedReport[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const category = params.category || null;
    const status = params.status || null;
    const search = params.search ? '%' + params.search + '%' : null;

    const reports = await sql<GeneratedReportRow[]>`
      SELECT ${selectGeneratedReportColumns}
      FROM generated_reports
      WHERE (${category}::text IS NULL OR category = ${category})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${search}::text IS NULL OR title ILIKE ${search} OR description ILIKE ${search})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM generated_reports
      WHERE (${category}::text IS NULL OR category = ${category})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${search}::text IS NULL OR title ILIKE ${search} OR description ILIKE ${search})
    `;

    return { data: reports.map(toGeneratedReportResponse), total: Number(total?.count || 0) };
  },

  async findGeneratedById(id: number): Promise<GeneratedReport | null> {
    const [report] = await sql<GeneratedReportRow[]>`
      SELECT ${selectGeneratedReportColumns} FROM generated_reports WHERE id = ${id}
    `;
    return report ? toGeneratedReportResponse(report) : null;
  },

  async createGenerated(data: CreateGeneratedReportDto): Promise<GeneratedReport> {
    const [report] = await sql<GeneratedReportRow[]>`
      INSERT INTO generated_reports ("templateId", title, description, category, format, period, configuration, status)
      VALUES (${data.templateId || null}, ${data.title}, ${data.description}, ${data.category}, ${data.format}, ${data.period}, ${JSON.stringify(data.configuration)}, ${data.status || 'Generating'})
      RETURNING ${selectGeneratedReportColumns}
    `;
    return toGeneratedReportResponse(report);
  },

  async updateGenerated(id: number, data: Partial<GeneratedReport>): Promise<GeneratedReport | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push(`title = $${values.length + 1}`); values.push(data.title); }
    if (data.description !== undefined) { updates.push(`description = $${values.length + 1}`); values.push(data.description); }
    if (data.category !== undefined) { updates.push(`category = $${values.length + 1}`); values.push(data.category); }
    if (data.format !== undefined) { updates.push(`format = $${values.length + 1}`); values.push(data.format); }
    if (data.period !== undefined) { updates.push(`period = $${values.length + 1}`); values.push(data.period); }
    if (data.size !== undefined) { updates.push(`size = $${values.length + 1}`); values.push(data.size); }
    if (data.status !== undefined) { updates.push(`status = $${values.length + 1}`); values.push(data.status); }
    if (data.configuration !== undefined) { updates.push(`configuration = $${values.length + 1}`); values.push(JSON.stringify(data.configuration)); }
    if (data.filePath !== undefined) { updates.push(`"filePath" = $${values.length + 1}`); values.push(data.filePath); }

    if (updates.length === 0) return this.findGeneratedById(id);

    updates.push(`"updatedAt" = NOW()`);
    values.push(id);

    const query = `UPDATE generated_reports SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectGeneratedReportColumns}`;
    const [report] = await sql.unsafe(query, values) as GeneratedReportRow[];
    return report ? toGeneratedReportResponse(report) : null;
  },

  async deleteGenerated(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM generated_reports WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getStats(): Promise<{
    totalTemplates: number;
    totalGenerated: number;
    readyCount: number;
    scheduledCount: number;
    thisMonthCount: number;
  }> {
    const [totalTemplates] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM report_templates
    `;
    const [totalGenerated] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM generated_reports
    `;
    const [readyCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM generated_reports WHERE status = 'Ready'
    `;
    const [scheduledCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM generated_reports WHERE status = 'Scheduled'
    `;
    const [thisMonthCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM generated_reports WHERE "createdAt" >= date_trunc('month', CURRENT_DATE)
    `;

    return {
      totalTemplates: Number(totalTemplates?.count || 0),
      totalGenerated: Number(totalGenerated?.count || 0),
      readyCount: Number(readyCount?.count || 0),
      scheduledCount: Number(scheduledCount?.count || 0),
      thisMonthCount: Number(thisMonthCount?.count || 0),
    };
  },
};