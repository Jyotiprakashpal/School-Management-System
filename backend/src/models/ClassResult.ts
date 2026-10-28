import sql from '../config/postgres.js';

export interface ClassResult {
  examId: number;
  examName: string;
  className: string;
  section: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  rollNo: number;
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
  published: boolean;
  publishedAt: Date | null;
  publishedBy: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishResultDto {
  examId: number;
  className: string;
  section: string;
  publishedBy: string;
}

export interface ClassResultQuery {
  page?: number;
  limit?: number;
  examId?: number;
  className?: string;
  section?: string;
  published?: boolean;
}

export interface ClassResultSummary {
  totalStudents: number;
  passed: number;
  failed: number;
  averagePercentage: number;
  passRate: number;
  gradeDistribution: Array<{ grade: string; count: number; range: string }>;
  subjectAverages: Array<{ subject: string; average: number }>;
}

export interface StudentResultRecord {
  admissionNo: string;
  studentName: string;
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
}

type ClassResultRow = Omit<ClassResult, 'subjects' | 'publishedAt' | 'createdAt' | 'updatedAt'> & {
  subjects: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toClassResultResponse(record: ClassResultRow): ClassResult {
  return {
    ...record,
    subjects: JSON.parse(record.subjects || '[]'),
    publishedAt: record.publishedAt ? new Date(record.publishedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

const selectClassResultColumns = sql`
  "examId", "examName", "className", section, "studentId", "admissionNo", "studentName", "rollNo",
  subjects, "totalObtained", "totalMaximum", "overallPercentage", "overallGrade", rank, passed,
  published, "publishedAt", "publishedBy", "createdBy", "createdAt", "updatedAt"
`;

export const classResultRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS class_results (
        "examId" INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        "examName" VARCHAR(120) NOT NULL,
        "className" VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        "studentId" TEXT NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
        "admissionNo" VARCHAR(80) NOT NULL,
        "studentName" VARCHAR(120) NOT NULL,
        "rollNo" INTEGER NOT NULL,
        subjects JSONB NOT NULL,
        "totalObtained" INTEGER NOT NULL DEFAULT 0,
        "totalMaximum" INTEGER NOT NULL DEFAULT 0,
        "overallPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "overallGrade" VARCHAR(10) NOT NULL DEFAULT 'F',
        rank INTEGER NOT NULL DEFAULT 0,
        passed BOOLEAN NOT NULL DEFAULT FALSE,
        published BOOLEAN NOT NULL DEFAULT FALSE,
        "publishedAt" TIMESTAMPTZ,
        "publishedBy" VARCHAR(120),
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("examId", "studentId")
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_results_exam_id ON class_results("examId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_results_class_section ON class_results("className", section)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_results_published ON class_results(published)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_results_rank ON class_results("examId", "className", section, rank)
    `;
  },

  async generateFromMarkEntries(examId: number, className: string, section: string, markEntryRepo: any): Promise<ClassResult[]> {
    // Get mark entries for this exam/class/section
    const markEntries = await sql<any[]>`
      SELECT * FROM mark_entries
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section}
      AND "marksObtained" IS NOT NULL
    `;

    if (markEntries.length === 0) return [];

    // Group by student
    const studentMap = new Map<string, any[]>();
    for (const entry of markEntries) {
      if (!studentMap.has(entry.studentId)) {
        studentMap.set(entry.studentId, []);
      }
      studentMap.get(entry.studentId)!.push(entry);
    }

    const results: any[] = [];
    for (const [studentId, entries] of studentMap) {
      const firstEntry = entries[0];
      const subjects = entries.map(e => ({
        subject: e.subject,
        maximumMarks: e.maximumMarks,
        marksObtained: e.marksObtained,
        percentage: e.percentage ? Number(e.percentage) : null,
        grade: e.grade,
        passed: e.passed,
      }));

      const totalObtained = entries.reduce((sum, e) => sum + (e.marksObtained || 0), 0);
      const totalMaximum = entries.reduce((sum, e) => sum + e.maximumMarks, 0);
      const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0;
      const overallGrade = calculateGrade(overallPercentage);
      const allPassed = entries.every(e => e.passed === true);

      results.push({
        examId: entries[0].examId,
        examName: entries[0].examName,
        className: entries[0].className,
        section: entries[0].section,
        studentId,
        admissionNo: entries[0].admissionNo,
        studentName: entries[0].studentName,
        rollNo: entries[0].rollNo,
        subjects,
        totalObtained,
        totalMaximum,
        overallPercentage: Math.round(overallPercentage * 10) / 10,
        overallGrade: calculateGrade(overallPercentage),
        rank: 0, // Will be set after sorting
        passed: allPassed,
        published: false,
        publishedAt: null,
        publishedBy: null,
      });
    }

    // Sort by percentage and assign ranks
    results.sort((a, b) => b.overallPercentage - a.overallPercentage);
    results.forEach((r, index) => { r.rank = index + 1; });

    return results;
  },

  async upsertMany(results: ClassResult[]): Promise<ClassResult[]> {
    const upserted: ClassResult[] = [];

    for (const result of results) {
      const [upserted] = await sql<any[]>`
        INSERT INTO class_results ("examId", "examName", "className", section, "studentId", "admissionNo", "studentName", "rollNo",
          subjects, "totalObtained", "totalMaximum", "overallPercentage", "overallGrade", rank, passed,
          published, "publishedAt", "publishedBy", "createdBy")
        VALUES (${result.examId}, ${result.examName}, ${result.className}, ${result.section}, ${result.studentId},
          ${result.admissionNo}, ${result.studentName}, ${result.rollNo},
          ${JSON.stringify(result.subjects)}, ${result.totalObtained}, ${result.totalMaximum},
          ${result.overallPercentage}, ${result.overallGrade}, ${result.rank}, ${result.passed},
          ${result.published}, ${result.publishedAt}, ${result.publishedBy}, ${result.createdBy})
        ON CONFLICT ("examId", "studentId") DO UPDATE SET
          "examName" = EXCLUDED."examName",
          "className" = EXCLUDED."className",
          section = EXCLUDED.section,
          "admissionNo" = EXCLUDED."admissionNo",
          "studentName" = EXCLUDED."studentName",
          "rollNo" = EXCLUDED."rollNo",
          subjects = EXCLUDED.subjects,
          "totalObtained" = EXCLUDED."totalObtained",
          "totalMaximum" = EXCLUDED."totalMaximum",
          "overallPercentage" = EXCLUDED."overallPercentage",
          "overallGrade" = EXCLUDED."overallGrade",
          rank = EXCLUDED.rank,
          passed = EXCLUDED.passed,
          published = EXCLUDED.published,
          "publishedAt" = EXCLUDED."publishedAt",
          "publishedBy" = EXCLUDED."publishedBy",
          "createdBy" = EXCLUDED."createdBy",
          "updatedAt" = NOW()
        RETURNING *
      `;
      upserted.push(toClassResultResponse(upserted[0]));
    }

    return upserted;
  },

  async publishResults(examId: number, className: string, section: string, publishedBy: string): Promise<number> {
    const now = new Date();
    const result = await sql`
      UPDATE class_results
      SET published = TRUE, "publishedAt" = ${now}, "publishedBy" = ${publishedBy}, "updatedAt" = NOW()
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section}
    `;
    return result.count;
  },

  async unpublishResults(examId: number, className: string, section: string): Promise<number> {
    const result = await sql`
      UPDATE class_results
      SET published = FALSE, "publishedAt" = NULL, "publishedBy" = NULL, "updatedAt" = NOW()
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section}
    `;
    return result.count;
  },

  async findMany(params: any): Promise<{ data: ClassResult[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;
    const examId = params.examId || null;
    const className = params.className || null;
    const section = params.section || null;
    const published = params.published !== undefined ? params.published : null;

    const results = await sql<any[]>`
      SELECT * FROM class_results
      WHERE (${examId}::int IS NULL OR "examId" = ${examId})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${published}::boolean IS NULL OR published = ${published})
      ORDER BY "examId", "className", section, rank
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM class_results
      WHERE (${examId}::int IS NULL OR "examId" = ${examId})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${published}::boolean IS NULL OR published = ${published})
    `;

    return { data: results.map(toClassResultResponse), total: Number(total?.count || 0) };
  },

  async findByExamClassSection(examId: number, className: string, section: string): Promise<ClassResult[]> {
    const results = await sql<any[]>`
      SELECT * FROM class_results
      WHERE "examId" = ${examId} AND "className" = ${className} AND section = ${section}
      ORDER BY rank
    `;
    return results.map(toClassResultResponse);
  },

  async getStudentResult(examId: number, studentId: string): Promise<ClassResult | null> {
    const [result] = await sql<any[]>`
      SELECT * FROM class_results WHERE "examId" = ${examId} AND "studentId" = ${studentId}
    `;
    return result ? toClassResultResponse(result) : null;
  },

  async getSummary(examId: number, className: string, section: string): Promise<{
    totalStudents: number;
    passed: number;
    failed: number;
    averagePercentage: number;
    passRate: number;
    gradeDistribution: Array<{ grade: string; count: number; range: string }>;
    subjectAverages: Array<{ subject: string; average: number }>;
  }> {
    const results = await this.findByExamClassSection(examId, className, section);
    if (results.length === 0) {
      return {
        totalStudents: 0,
        passed: 0,
        failed: 0,
        averagePercentage: 0,
        passRate: 0,
        gradeDistribution: [],
        subjectAverages: [],
      };
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const averagePercentage = results.reduce((sum, r) => sum + r.overallPercentage, 0) / results.length;
    const passRate = Math.round((results.filter(r => r.passed).length / results.length) * 100);

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
      count: results.filter(r => r.overallGrade === gs.grade).length,
      range: gs.range,
    }));

    // Subject averages
    const allSubjects = new Set<string>();
    results.forEach(r => r.subjects.forEach(s => allSubjects.add(s.subject)));
    
    const subjectAverages = Array.from(allSubjects).map(subject => {
      const subjectResults = results.flatMap(r => r.subjects.filter(s => s.subject === subject && s.percentage !== null));
      const average = subjectResults.length > 0
        ? subjectResults.reduce((sum, s) => sum + (s.percentage || 0), 0) / subjectResults.length
        : 0;
      return { subject, average: Math.round(average * 10) / 10 };
    });

    return {
      totalStudents: results.length,
      passed: results.filter(r => r.passed).length,
      failed,
      averagePercentage: Math.round(averagePercentage * 10) / 10,
      passRate,
      gradeDistribution,
      subjectAverages,
    };
  },

  async getRankList(examId: number, className: string, section: string): Promise<Array<{
    rank: number;
    admissionNo: string;
    studentName: string;
    totalObtained: number;
    totalMaximum: number;
    overallPercentage: number;
    overallGrade: string;
    passed: boolean;
  }>> {
    const results = await this.findByExamClassSection(examId, className, section);
    return results.map(r => ({
      rank: r.rank,
      admissionNo: r.admissionNo,
      studentName: r.studentName,
      totalObtained: r.totalObtained,
      totalMaximum: r.totalMaximum,
      overallPercentage: r.overallPercentage,
      overallGrade: r.overallGrade,
      passed: r.passed,
    }));
  },

  async getStudentReportCard(examId: number, studentId: string): Promise<any | null> {
    const result = await this.getStudentResult(examId, studentId);
    if (!result) return null;

    return {
      studentId: result.studentId,
      admissionNo: result.admissionNo,
      studentName: result.studentName,
      className: result.className,
      section: result.section,
      examName: result.examName,
      subjects: result.subjects,
      totalObtained: result.totalObtained,
      totalMaximum: result.totalMaximum,
      overallPercentage: result.overallPercentage,
      overallGrade: result.overallGrade,
      rank: result.rank,
      passed: result.passed,
    };
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