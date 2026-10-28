import sql from '../config/postgres.js';

export interface MarkEntry {
  id: number;
  examId: number;
  examName: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  rollNo: number;
  subject: string;
  maximumMarks: number;
  marksObtained: number | null;
  grade: string | null;
  percentage: number | null;
  passed: boolean | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMarkEntryDto {
  examId: number;
  examName: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  rollNo: number;
  subject: string;
  maximumMarks: number;
  marksObtained: number | null;
  remarks?: string;
  createdBy?: string;
}

export interface UpdateMarkEntryDto {
  marksObtained?: number | null;
  remarks?: string;
}

export interface BulkMarkEntryDto {
  examId: number;
  examName: string;
  className: string;
  section: string;
  subject: string;
  maximumMarks: number;
  entries: Array<{
    studentId: string;
    admissionNo: string;
    studentName: string;
    rollNo: number;
    marksObtained: number | null;
    remarks?: string;
    createdBy?: string;
  }>;
}

export interface MarkEntryQuery {
  page?: number;
  limit?: number;
  examId?: number;
  examName?: string;
  className?: string;
  section?: string;
  subject?: string;
  studentId?: string;
}

export interface MarksSummary {
  totalStudents: number;
  entered: number;
  pending: number;
  average: number;
  highest: number;
  lowest: number;
  passed: number;
  failed: number;
  passRate: number;
  gradeDistribution: Array<{ grade: string; count: number; range: string }>;
}

export interface SubjectStats {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
  passed: number;
  failed: number;
  passRate: number;
}

type MarkEntryRow = Omit<MarkEntry, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toMarkEntryResponse(entry: MarkEntryRow): MarkEntry {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
    createdBy: entry.createdBy || null,
  };
}

const selectMarkEntryColumns = sql`
  id, "examId", "examName", "studentId", "admissionNo", "studentName", "className", section, "rollNo",
  subject, "maximumMarks", "marksObtained", grade, percentage, passed, remarks, "createdBy", "createdAt", "updatedAt"
`;

export const markEntryRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS mark_entries (
        id SERIAL PRIMARY KEY,
        "examId" INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        "examName" VARCHAR(120) NOT NULL,
        "studentId" TEXT NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
        "admissionNo" VARCHAR(80) NOT NULL,
        "studentName" VARCHAR(120) NOT NULL,
        "className" VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        "rollNo" INTEGER NOT NULL,
        subject VARCHAR(120) NOT NULL,
        "maximumMarks" INTEGER NOT NULL,
        "marksObtained" INTEGER,
        grade VARCHAR(10),
        percentage DECIMAL(5,2),
        passed BOOLEAN,
        remarks TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("examId", "studentId", subject)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mark_entries_exam_id ON mark_entries("examId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mark_entries_student_id ON mark_entries("studentId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mark_entries_class_section_subject ON mark_entries("className", section, subject)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mark_entries_exam_class_subject ON mark_entries("examId", "className", section, subject)
    `;
  },

  async findMany(params: MarkEntryQuery): Promise<{ data: MarkEntry[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;
    const examId = params.examId || null;
    const examName = params.examName || null;
    const className = params.className || null;
    const section = params.section || null;
    const subject = params.subject || null;
    const studentId = params.studentId || null;

    const entries = await sql<MarkEntryRow[]>`
      SELECT ${selectMarkEntryColumns}
      FROM mark_entries
      WHERE (${examId}::int IS NULL OR "examId" = ${examId})
        AND (${examName}::text IS NULL OR "examName" ILIKE ${'%' + examName + '%'})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${subject}::text IS NULL OR subject = ${subject})
        AND (${studentId}::text IS NULL OR "studentId" = ${studentId})
      ORDER BY "className", section, "rollNo"
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM mark_entries
      WHERE (${examId}::int IS NULL OR "examId" = ${examId})
        AND (${examName}::text IS NULL OR "examName" ILIKE ${'%' + examName + '%'})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${subject}::text IS NULL OR subject = ${subject})
        AND (${studentId}::text IS NULL OR "studentId" = ${studentId})
    `;

    return { data: entries.map(toMarkEntryResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<MarkEntry | null> {
    const [entry] = await sql<MarkEntryRow[]>`
      SELECT ${selectMarkEntryColumns} FROM mark_entries WHERE id = ${id}
    `;
    return entry ? toMarkEntryResponse(entry) : null;
  },

  async findByExamClassSubject(examId: number, className: string, section: string, subject: string): Promise<MarkEntry[]> {
    const entries = await sql<MarkEntryRow[]>`
      SELECT ${selectMarkEntryColumns}
      FROM mark_entries
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section} AND subject = ${subject}
      ORDER BY "rollNo"
    `;
    return entries.map(toMarkEntryResponse);
  },

  async findByStudentExam(studentId: string, examId: number): Promise<MarkEntry[]> {
    const entries = await sql<MarkEntryRow[]>`
      SELECT ${selectMarkEntryColumns}
      FROM mark_entries
      WHERE "studentId" = ${studentId} AND "examId" = ${examId}
      ORDER BY subject
    `;
    return entries.map(toMarkEntryResponse);
  },

  async create(data: CreateMarkEntryDto): Promise<MarkEntry> {
    const { marksObtained, maximumMarks, ...rest } = data;
    const percentage = marksObtained !== null && marksObtained !== undefined ? ((marksObtained / maximumMarks) * 100).toFixed(2) : null;
    const grade = marksObtained !== null && marksObtained !== undefined ? calculateGrade((marksObtained / maximumMarks) * 100) : null;
    const passed = marksObtained !== null && marksObtained !== undefined ? (marksObtained / maximumMarks) * 100 >= 35 : null;

    const [entry] = await sql<MarkEntryRow[]>`
      INSERT INTO mark_entries ("examId", "examName", "studentId", "admissionNo", "studentName", "className", section, "rollNo", subject, "maximumMarks", "marksObtained", grade, percentage, passed, remarks, "createdBy")
      VALUES (${data.examId}, ${data.examName}, ${data.studentId}, ${data.admissionNo}, ${data.studentName}, ${data.className}, ${data.section}, ${data.rollNo}, ${data.subject}, ${data.maximumMarks}, ${marksObtained}, ${grade}, ${percentage}, ${passed}, ${data.remarks || null}, ${data.createdBy || null})
      ON CONFLICT ("examId", "studentId", subject) DO UPDATE SET
        "marksObtained" = EXCLUDED."marksObtained",
        "maximumMarks" = EXCLUDED."maximumMarks",
        grade = EXCLUDED.grade,
        percentage = EXCLUDED.percentage,
        passed = EXCLUDED.passed,
        remarks = EXCLUDED.remarks,
        "updatedAt" = NOW()
      RETURNING ${selectMarkEntryColumns}
    `;
    return toMarkEntryResponse(entry);
  },

  async bulkCreate(data: BulkMarkEntryDto): Promise<MarkEntry[]> {
    const results: MarkEntry[] = [];
    
    for (const entry of data.entries) {
      const marksObtained = entry.marksObtained;
      const percentage = marksObtained !== null ? ((marksObtained / data.maximumMarks) * 100).toFixed(2) : null;
      const grade = marksObtained !== null ? calculateGrade((marksObtained / data.maximumMarks) * 100) : null;
      const passed = marksObtained !== null ? (marksObtained / data.maximumMarks) * 100 >= 35 : null;

      const [created] = await sql<MarkEntryRow[]>`
        INSERT INTO mark_entries ("examId", "examName", "studentId", "admissionNo", "studentName", "className", section, "rollNo", subject, "maximumMarks", "marksObtained", grade, percentage, passed, remarks, "createdBy")
        VALUES (${data.examId}, ${data.examName}, ${entry.studentId}, ${entry.admissionNo}, ${entry.studentName}, ${data.className}, ${data.section}, ${entry.rollNo}, ${data.subject}, ${data.maximumMarks}, ${marksObtained}, ${grade}, ${percentage}, ${passed}, ${entry.remarks || null}, ${entry.createdBy || null})
        ON CONFLICT ("examId", "studentId", subject) DO UPDATE SET
          "marksObtained" = EXCLUDED."marksObtained",
          "maximumMarks" = EXCLUDED."maximumMarks",
          grade = EXCLUDED.grade,
          percentage = EXCLUDED.percentage,
          passed = EXCLUDED.passed,
          remarks = EXCLUDED.remarks,
          "updatedAt" = NOW()
        RETURNING ${selectMarkEntryColumns}
      `;
      results.push(toMarkEntryResponse(created));
    }

    return results;
  },

  async update(id: number, data: Partial<UpdateMarkEntryDto>): Promise<MarkEntry | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const marksObtained = data.marksObtained ?? current.marksObtained;
    const maximumMarks = current.maximumMarks;
    const percentage = marksObtained !== null ? ((marksObtained / maximumMarks) * 100).toFixed(2) : null;
    const grade = marksObtained !== null ? calculateGrade((marksObtained / maximumMarks) * 100) : null;
    const passed = marksObtained !== null ? (marksObtained / maximumMarks) * 100 >= 35 : null;

    const [entry] = await sql<MarkEntryRow[]>`
      UPDATE mark_entries
       SET "marksObtained" = ${marksObtained},
           remarks = ${data.remarks ?? current.remarks},
           grade = ${grade},
           percentage = ${percentage},
           passed = ${passed},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectMarkEntryColumns}
    `;
    return entry ? toMarkEntryResponse(entry) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM mark_entries WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async getSummary(examId: number, className: string, section: string, subject: string): Promise<MarksSummary> {
    const entries = await sql<MarkEntryRow[]>`
      SELECT ${selectMarkEntryColumns}
      FROM mark_entries
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section} AND subject = ${subject}
    `;

    const scoredEntries = entries.filter(e => e.marksObtained !== null);
    const scores = scoredEntries.map(e => e.marksObtained!);
    const maxMarks = entries.length > 0 ? entries[0].maximumMarks : 100;
    const passMark = maxMarks * 0.35;

    const passed = scores.filter(s => s >= passMark).length;
    const failed = scores.filter(s => s < passMark).length;

    const gradeScale = [
      { grade: 'A+', min: 90, range: '90-100%' },
      { grade: 'A', min: 80, range: '80-89%' },
      { grade: 'B+', min: 70, range: '70-79%' },
      { grade: 'B', min: 60, range: '60-69%' },
      { grade: 'C', min: 50, range: '50-59%' },
      { grade: 'D', min: 35, range: '35-49%' },
      { grade: 'F', min: 0, range: '0-34%' },
    ];

    const gradeDistribution = gradeScale.map(gs => ({
      grade: gs.grade,
      count: scores.filter(s => {
        const pct = (s / entries[0]?.maximumMarks || 100) * 100;
        return pct >= gs.min && (gradeScale.find(g => g.min > gs.min) ? pct < gradeScale.find(g => g.min > gs.min)!.min : true);
      }).length,
      range: gs.range,
    }));

    return {
      totalStudents: entries.length,
      entered: scoredEntries.length,
      pending: entries.length - scoredEntries.length,
      average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highest: scores.length > 0 ? Math.max(...scores) : 0,
      lowest: scores.length > 0 ? Math.min(...scores) : 0,
      passed,
      failed,
      passRate: scoredEntries.length > 0 ? Math.round((passed / scoredEntries.length) * 100) : 0,
      gradeDistribution,
    };
  },

  async getSubjectStats(examId: number, className: string, section: string): Promise<SubjectStats[]> {
    const subjects = await sql<{ subject: string }[]>`
      SELECT DISTINCT subject FROM mark_entries WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section}
    `;

    const stats: SubjectStats[] = [];
    for (const { subject } of subjects) {
      const entries = await this.findByExamClassSubject(examId, className, section, subject);
      const summary = await this.getSummary(examId, className, section, subject);
      stats.push({
        subject,
        average: summary.average,
        highest: summary.highest,
        lowest: summary.lowest,
        passed: summary.passed,
        failed: summary.failed,
        passRate: summary.passRate,
      });
    }
    return stats;
  },

  async getStudentReportCard(studentId: string, examId: number): Promise<{
    studentId: string;
    admissionNo: string;
    studentName: string;
    className: string;
    section: string;
    examName: string;
    subjects: Array<{
      subject: string;
      maximumMarks: number;
      marksObtained: number | null;
      percentage: number | null;
      grade: string | null;
      passed: boolean | null;
    }>;
    totalObtained: number;
    totalMaximum: number;
    overallPercentage: number;
    overallGrade: string;
    rank: number;
    passed: boolean;
  } | null> {
    const entries = await this.findByStudentExam(studentId, examId);
    if (entries.length === 0) return null;

    const exam = entries[0];
    const totalObtained = entries.reduce((sum, e) => sum + (e.marksObtained || 0), 0);
    const totalMaximum = entries.reduce((sum, e) => sum + e.maximumMarks, 0);
    const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0;
    const overallGrade = calculateGrade(overallPercentage);
    const allPassed = entries.every(e => e.passed === true);

    // Get rank by calculating all students' percentages for this exam
    const allStudents = await sql<{ studentId: string; totalObtained: number; totalMaximum: number }[]>`
      SELECT "studentId", SUM("marksObtained") as "totalObtained", SUM("maximumMarks") as "totalMaximum"
      FROM mark_entries
      WHERE "examId" = ${examId} AND "marksObtained" IS NOT NULL
      GROUP BY "studentId"
    `;

    const studentPercentages = allStudents.map(s => ({
      studentId: s.studentId,
      percentage: s.totalMaximum > 0 ? (Number(s.totalObtained) / Number(s.totalMaximum)) * 100 : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    const rank = studentPercentages.findIndex(s => s.studentId === studentId) + 1;

    return {
      studentId,
      admissionNo: entries[0].admissionNo,
      studentName: entries[0].studentName,
      className: entries[0].className,
      section: entries[0].section,
      examName: entries[0].examName,
      subjects: entries.map(e => ({
        subject: e.subject,
        maximumMarks: e.maximumMarks,
        marksObtained: e.marksObtained,
        percentage: e.percentage ? Number(e.percentage) : null,
        grade: e.grade,
        passed: e.passed,
      })),
      totalObtained,
      totalMaximum,
      overallPercentage: Math.round(overallPercentage * 10) / 10,
      overallGrade: calculateGrade(overallPercentage),
      rank: rank > 0 ? rank : 0,
      passed: allPassed,
    };
  },

  async getClassRankList(examId: number, className: string, section: string): Promise<Array<{
    rank: number;
    studentId: string;
    admissionNo: string;
    studentName: string;
    totalObtained: number;
    totalMaximum: number;
    percentage: number;
    grade: string;
    passed: boolean;
  }>> {
    const students = await sql<{ studentId: string; admissionNo: string; studentName: string; totalObtained: number; totalMaximum: number }[]>`
      SELECT "studentId", "admissionNo", "studentName", SUM("marksObtained") as "totalObtained", SUM("maximumMarks") as "totalMaximum"
      FROM mark_entries
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section} AND "marksObtained" IS NOT NULL
      GROUP BY "studentId", "admissionNo", "studentName"
    `;

    const ranked = students
      .map(s => ({
        ...s,
        percentage: s.totalMaximum > 0 ? (Number(s.totalObtained) / Number(s.totalMaximum)) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .map((s, index) => ({
        rank: index + 1,
        studentId: s.studentId,
        admissionNo: s.admissionNo,
        studentName: s.studentName,
        totalObtained: s.totalObtained,
        totalMaximum: s.totalMaximum,
        percentage: Math.round(s.percentage * 10) / 10,
        grade: calculateGrade(s.percentage),
        passed: s.percentage >= 35,
      }));

    return ranked;
  },
};

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
}