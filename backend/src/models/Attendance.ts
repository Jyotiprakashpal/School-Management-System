import sql from '../config/postgres.js';

export interface AttendanceRecord {
  id: number;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  rollNo: number;
  date: string;
  status: 'present' | 'absent' | 'leave';
  markedBy: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceDto {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  rollNo: number;
  date: string;
  status: 'present' | 'absent' | 'leave';
  markedBy: string;
  createdBy?: string;
}

export interface UpdateAttendanceDto {
  status?: 'present' | 'absent' | 'leave';
  markedBy?: string;
}

export interface AttendanceQuery {
  page?: number;
  limit?: number;
  className?: string;
  section?: string;
  date?: string;
  status?: 'present' | 'absent' | 'leave';
  studentId?: string;
}

export interface AttendanceSummary {
  className: string;
  section: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  leave: number;
  pending: number;
  attendanceRate: number;
}

export interface ClassRoster {
  admissionNo: string;
  studentName: string;
  rollNo: number;
  status: 'present' | 'absent' | 'leave' | null;
}

type AttendanceRow = Omit<AttendanceRecord, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

function toAttendanceResponse(record: AttendanceRow): AttendanceRecord {
  return {
    ...record,
    date: record.date,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

const selectAttendanceColumns = sql`
  id, "studentId", "admissionNo", "studentName", "className", section, "rollNo",
  date, status, "markedBy", "createdBy", "createdAt", "updatedAt"
`;

export const attendanceRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        "studentId" TEXT NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
        "admissionNo" VARCHAR(80) NOT NULL,
        "studentName" VARCHAR(120) NOT NULL,
        "className" VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        "rollNo" INTEGER NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
        "markedBy" VARCHAR(120) NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("studentId", date)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_attendance_class_section_date ON attendance("className", section, date)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance("studentId", date)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_attendance_class_section ON attendance("className", section)
    `;
  },

async upsertMany(records: CreateAttendanceDto[]): Promise<AttendanceRecord[]> {
    if (records.length === 0) return [];

    const results: AttendanceRecord[] = [];

    for (const record of records) {
      const [attendance] = await sql<AttendanceRow[]>`
        INSERT INTO attendance ("studentId", "admissionNo", "studentName", "className", section, "rollNo", date, status, "markedBy", "createdBy")
        VALUES (${record.studentId}, ${record.admissionNo}, ${record.studentName}, ${record.className}, ${record.section}, ${record.rollNo}, ${record.date}, ${record.status}, ${record.markedBy}, ${record.createdBy || null})
        ON CONFLICT ("studentId", date) DO UPDATE SET
          status = EXCLUDED.status,
          "markedBy" = EXCLUDED."markedBy",
          "updatedAt" = NOW()
        RETURNING ${selectAttendanceColumns}
      `;
      results.push(toAttendanceResponse(attendance));
    }

    return results;
  },

  async findMany(params: AttendanceQuery): Promise<{ data: AttendanceRecord[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;
    const className = params.className || null;
    const section = params.section || null;
    const date = params.date || null;
    const status = params.status || null;
    const studentId = params.studentId || null;

    const records = await sql<AttendanceRow[]>`
      SELECT ${selectAttendanceColumns}
      FROM attendance
      WHERE (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${date}::date IS NULL OR date = ${date})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${studentId}::text IS NULL OR "studentId" = ${studentId})
      ORDER BY date DESC, "studentName"
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM attendance
      WHERE (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${date}::date IS NULL OR date = ${date})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${studentId}::text IS NULL OR "studentId" = ${studentId})
    `;

    return { data: records.map(toAttendanceResponse), total: Number(total?.count || 0) };
  },

  async findByClassSectionDate(className: string, section: string, date: string): Promise<AttendanceRecord[]> {
    const records = await sql<AttendanceRow[]>`
      SELECT ${selectAttendanceColumns}
      FROM attendance
      WHERE "className" = ${className} AND section = ${section} AND date = ${date}
      ORDER BY "rollNo"
    `;
    return records.map(toAttendanceResponse);
  },

  async findByStudentDate(studentId: string, date: string): Promise<AttendanceRecord | null> {
    const [record] = await sql<AttendanceRow[]>`
      SELECT ${selectAttendanceColumns} FROM attendance WHERE "studentId" = ${studentId} AND date = ${date}
    `;
    return record ? toAttendanceResponse(record) : null;
  },

  async getClassRosterWithStatus(className: string, section: string, date: string): Promise<ClassRoster[]> {
    // Get all students for the class/section from users table
    const students = await sql<{ studentId: string; admissionNo: string; studentName: string; rollNo: number }[]>`
      SELECT "userId" as "studentId", "admissionNo", name as "studentName", "rollNo"
      FROM users
      WHERE "className" = ${className} AND section = ${section}
      ORDER BY "rollNo"
    `;

    // Get attendance for the date
    const attendance = await this.findByClassSectionDate(className, section, date);
    const attendanceMap = new Map(attendance.map(a => [a.studentId, a.status]));

    return students.map(s => ({
      admissionNo: s.admissionNo,
      studentName: s.studentName,
      rollNo: s.rollNo,
      status: attendanceMap.get(s.studentId) || null
    }));
  },

  async getSummary(className: string, section: string, date: string): Promise<AttendanceSummary> {
    const roster = await this.getClassRosterWithStatus(className, section, date);
    
    const present = roster.filter(r => r.status === 'present').length;
    const absent = roster.filter(r => r.status === 'absent').length;
    const leave = roster.filter(r => r.status === 'leave').length;
    const pending = roster.filter(r => r.status === null).length;
    const totalStudents = roster.length;
    const attendanceRate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

    return {
      className,
      section,
      date,
      totalStudents,
      present,
      absent,
      leave,
      pending,
      attendanceRate
    };
  },

  async deleteByClassSectionDate(className: string, section: string, date: string): Promise<number> {
    const result = await sql`
      DELETE FROM attendance WHERE "className" = ${className} AND section = ${section} AND date = ${date}
    `;
    return result.count;
  },

  async getStudentHistory(studentId: string, limit: number = 30): Promise<AttendanceRecord[]> {
    const records = await sql<AttendanceRow[]>`
      SELECT ${selectAttendanceColumns}
      FROM attendance
      WHERE "studentId" = ${studentId}
      ORDER BY date DESC
      LIMIT ${limit}
    `;
    return records.map(toAttendanceResponse);
  },

  async getMonthlyReport(className: string, section: string, year: number, month: number): Promise<{
    month: string;
    totalDays: number;
    averageAttendance: number;
    dailyStats: { date: string; present: number; absent: number; leave: number; rate: number }[];
  }> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await sql<AttendanceRow[]>`
      SELECT ${selectAttendanceColumns}
      FROM attendance
      WHERE "className" = ${className} AND section = ${section}
        AND date >= ${startOfMonth.toISOString().split('T')[0]}
        AND date <= ${endOfMonth.toISOString().split('T')[0]}
      ORDER BY date
    `;

    const dailyMap = new Map<string, { present: number; absent: number; leave: number; total: number }>();
    
    for (const record of records) {
      const dateStr = record.date;
      const existing = dailyMap.get(dateStr) || { present: 0, absent: 0, leave: 0, total: 0 };
      
      if (record.status === 'present') existing.present++;
      else if (record.status === 'absent') existing.absent++;
      else if (record.status === 'leave') existing.leave++;
      
      existing.total++;
      dailyMap.set(dateStr, existing);
    }

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
        rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalDays = dailyStats.length;
    const averageAttendance = totalDays > 0 
      ? Math.round(dailyStats.reduce((sum, d) => sum + d.rate, 0) / totalDays)
      : 0;

    return {
      month: new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      totalDays,
      averageAttendance,
      dailyStats
    };
  }
};