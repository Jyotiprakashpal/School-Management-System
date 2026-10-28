import sql from '../config/postgres.js';

export interface ExamSchedule {
  id: number;
  examId: number | null;
  examName: string;
  subject: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  invigilator: string;
  maxMarks: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamScheduleDto {
  examId?: number;
  examName: string;
  subject: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  invigilator: string;
  maxMarks: number;
  createdBy?: string;
}

export interface UpdateExamScheduleDto {
  examId?: number;
  examName?: string;
  subject?: string;
  className?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  invigilator?: string;
  maxMarks?: number;
}

export interface ExamScheduleQuery {
  page?: number;
  limit?: number;
  examId?: number;
  examName?: string;
  className?: string;
  subject?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  room?: string;
  invigilator?: string;
}

export interface ExamScheduleStats {
  totalPapers: number;
  examDays: number;
  roomsUsed: number;
  invigilators: number;
  totalMarks: number;
}

export interface NextPaper {
  id: number;
  examName: string;
  subject: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  invigilator: string;
  maxMarks: number;
}

export interface RoomUsage {
  room: string;
  count: number;
}

type ExamScheduleRow = Omit<ExamSchedule, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

export const examScheduleRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS exam_schedules (
        id SERIAL PRIMARY KEY,
        "examId" INTEGER REFERENCES exams(id) ON DELETE SET NULL,
        "examName" VARCHAR(120) NOT NULL,
        subject VARCHAR(120) NOT NULL,
        "className" VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        "startTime" TIME NOT NULL,
        "endTime" TIME NOT NULL,
        room VARCHAR(50) NOT NULL,
        invigilator VARCHAR(120) NOT NULL,
        "maxMarks" INTEGER NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_id ON exam_schedules("examId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_name ON exam_schedules("examName")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exam_schedules_class_name ON exam_schedules("className")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exam_schedules_date ON exam_schedules(date)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exam_schedules_room_date ON exam_schedules(room, date)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_exam_schedules_invigilator_date ON exam_schedules(invigilator, date)
    `;
  },

  async findMany(params: ExamScheduleQuery): Promise<{ data: ExamSchedule[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;
    const examId = params.examId || null;
    const examName = params.examName || null;
    const className = params.className || null;
    const subject = params.subject || null;
    const date = params.date || null;
    const startDate = params.startDate || null;
    const endDate = params.endDate || null;
    const room = params.room || null;
    const invigilator = params.invigilator || null;

    const schedules = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns}
      FROM exam_schedules
      WHERE (${examId}::int IS NULL OR "examId" = ${examId})
        AND (${examName}::text IS NULL OR "examName" ILIKE ${'%' + examName + '%'})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${subject}::text IS NULL OR subject ILIKE ${'%' + subject + '%'})
        AND (${date}::date IS NULL OR date = ${date})
        AND (${startDate}::date IS NULL OR date >= ${startDate})
        AND (${endDate}::date IS NULL OR date <= ${endDate})
        AND (${room}::text IS NULL OR room = ${room})
        AND (${invigilator}::text IS NULL OR invigilator ILIKE ${'%' + invigilator + '%'})
      ORDER BY date, "startTime"
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM exam_schedules
      WHERE (${examId}::int IS NULL OR "examId" = ${examId})
        AND (${examName}::text IS NULL OR "examName" ILIKE ${'%' + examName + '%'})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${subject}::text IS NULL OR subject ILIKE ${'%' + subject + '%'})
        AND (${date}::date IS NULL OR date = ${date})
        AND (${startDate}::date IS NULL OR date >= ${startDate})
        AND (${endDate}::date IS NULL OR date <= ${endDate})
        AND (${room}::text IS NULL OR room = ${room})
        AND (${invigilator}::text IS NULL OR invigilator ILIKE ${'%' + invigilator + '%'})
    `;

    return { data: schedules.map(toExamScheduleResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<ExamSchedule | null> {
    const [schedule] = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules WHERE id = ${id}
    `;
    return schedule ? toExamScheduleResponse(schedule) : null;
  },

  async findByExamId(examId: number): Promise<ExamSchedule[]> {
    const schedules = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules WHERE "examId" = ${examId} ORDER BY date, "startTime"
    `;
    return schedules.map(toExamScheduleResponse);
  },

  async findByClassDate(className: string, date: string): Promise<ExamSchedule[]> {
    const schedules = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules WHERE "className" = ${className} AND date = ${date} ORDER BY "startTime"
    `;
    return schedules.map(toExamScheduleResponse);
  },

  async findByRoomDate(room: string, date: string): Promise<ExamSchedule[]> {
    const schedules = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules WHERE room = ${room} AND date = ${date} ORDER BY "startTime"
    `;
    return schedules.map(toExamScheduleResponse);
  },

  async findByInvigilatorDate(invigilator: string, date: string): Promise<ExamSchedule[]> {
    const schedules = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules WHERE invigilator = ${invigilator} AND date = ${date} ORDER BY "startTime"
    `;
    return schedules.map(toExamScheduleResponse);
  },

  async checkRoomConflict(room: string, date: string, startTime: string, endTime: string, excludeId?: number): Promise<boolean> {
    const schedules = await sql<{ id: number }[]>`
      SELECT id FROM exam_schedules
      WHERE room = ${room} AND date = ${date}
        AND "startTime" < ${endTime} AND "endTime" > ${startTime}
        ${excludeId ? sql`AND id != ${excludeId}` : sql``}
    `;
    return schedules.length > 0;
  },

  async checkInvigilatorConflict(invigilator: string, date: string, startTime: string, endTime: string, excludeId?: number): Promise<boolean> {
    const schedules = await sql<{ id: number }[]>`
      SELECT id FROM exam_schedules
      WHERE invigilator = ${invigilator} AND date = ${date}
        AND "startTime" < ${endTime} AND "endTime" > ${startTime}
        ${excludeId ? sql`AND id != ${excludeId}` : sql``}
    `;
    return schedules.length > 0;
  },

  async checkDuplicateSubject(examName: string, className: string, subject: string, excludeId?: number): Promise<boolean> {
    const schedules = await sql<{ id: number }[]>`
      SELECT id FROM exam_schedules
      WHERE "examName" = ${examName} AND "className" = ${className} AND subject = ${subject}
        ${excludeId ? sql`AND id != ${excludeId}` : sql``}
    `;
    return schedules.length > 0;
  },

  async create(data: CreateExamScheduleDto): Promise<ExamSchedule> {
    const [schedule] = await sql<ExamScheduleRow[]>`
      INSERT INTO exam_schedules ("examId", "examName", subject, "className", date, "startTime", "endTime", room, invigilator, "maxMarks", "createdBy")
      VALUES (${data.examId || null}, ${data.examName}, ${data.subject}, ${data.className}, ${data.date}, ${data.startTime}, ${data.endTime}, ${data.room}, ${data.invigilator}, ${data.maxMarks}, ${data.createdBy || null})
      RETURNING ${selectExamScheduleColumns}
    `;
    return toExamScheduleResponse(schedule);
  },

  async update(id: number, data: Partial<UpdateExamScheduleDto>): Promise<ExamSchedule | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      examId: data.examId ?? current.examId,
      examName: data.examName ?? current.examName,
      subject: data.subject ?? current.subject,
      className: data.className ?? current.className,
      date: data.date ?? current.date,
      startTime: data.startTime ?? current.startTime,
      endTime: data.endTime ?? current.endTime,
      room: data.room ?? current.room,
      invigilator: data.invigilator ?? current.invigilator,
      maxMarks: data.maxMarks ?? current.maxMarks,
    };

    const [schedule] = await sql<ExamScheduleRow[]>`
      UPDATE exam_schedules
       SET "examId" = ${next.examId},
           "examName" = ${next.examName},
           subject = ${next.subject},
           "className" = ${next.className},
           date = ${next.date},
           "startTime" = ${next.startTime},
           "endTime" = ${next.endTime},
           room = ${next.room},
           invigilator = ${next.invigilator},
           "maxMarks" = ${next.maxMarks},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectExamScheduleColumns}
    `;
    return schedule ? toExamScheduleResponse(schedule) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM exam_schedules WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async deleteByExamId(examId: number): Promise<number> {
    const result = await sql`
      DELETE FROM exam_schedules WHERE "examId" = ${examId}
    `;
    return result.count;
  },

  async getStats(examName?: string, className?: string): Promise<ExamScheduleStats> {
    let whereClause = sql``;
    if (examName) whereClause = sql`WHERE "examName" = ${examName}`;
    if (className) whereClause = whereClause ? sql`${whereClause} AND "className" = ${className}` : sql`WHERE "className" = ${className}`;

    const [totalPapers] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exam_schedules ${whereClause}
    `;

    const [examDays] = await sql<{ count: string }[]>`
      SELECT COUNT(DISTINCT date)::text AS count FROM exam_schedules ${whereClause}
    `;

    const [roomsUsed] = await sql<{ count: string }[]>`
      SELECT COUNT(DISTINCT room)::text AS count FROM exam_schedules ${whereClause}
    `;

    const [invigilators] = await sql<{ count: string }[]>`
      SELECT COUNT(DISTINCT invigilator)::text AS count FROM exam_schedules ${whereClause}
    `;

    const [totalMarks] = await sql<{ sum: string }[]>`
      SELECT COALESCE(SUM("maxMarks"), 0)::text AS sum FROM exam_schedules ${whereClause}
    `;

    return {
      totalPapers: Number(totalPapers?.count || 0),
      examDays: Number(examDays?.count || 0),
      roomsUsed: Number(roomsUsed?.count || 0),
      invigilators: Number(invigilators?.count || 0),
      totalMarks: Number(totalMarks?.sum || 0),
    };
  },

  async getNextPaper(examName?: string, className?: string): Promise<ExamSchedule | null> {
    let whereClause = sql`WHERE date >= CURRENT_DATE`;
    if (examName) whereClause = sql`${whereClause} AND "examName" = ${examName}`;
    if (className) whereClause = sql`${whereClause} AND "className" = ${className}`;

    const [schedule] = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules ${whereClause} ORDER BY date, "startTime" LIMIT 1
    `;
    return schedule ? toExamScheduleResponse(schedule) : null;
  },

  async getCompletedCount(examName?: string, className?: string): Promise<number> {
    let whereClause = sql`WHERE date < CURRENT_DATE`;
    if (examName) whereClause = sql`${whereClause} AND "examName" = ${examName}`;
    if (className) whereClause = sql`${whereClause} AND "className" = ${className}`;

    const [count] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exam_schedules ${whereClause}
    `;
    return Number(count?.count || 0);
  },

  async getRoomUsage(examName?: string, className?: string): Promise<RoomUsage[]> {
    let whereClause = sql``;
    if (examName) whereClause = sql`WHERE "examName" = ${examName}`;
    if (className) whereClause = whereClause ? sql`${whereClause} AND "className" = ${className}` : sql`WHERE "className" = ${className}`;

    const usage = await sql<{ room: string; count: string }[]>`
      SELECT room, COUNT(*)::text AS count FROM exam_schedules ${whereClause} GROUP BY room ORDER BY count DESC
    `;
    return usage.map(u => ({ room: u.room, count: Number(u.count) }));
  },

  async getNextPaperWithDetails(examName?: string, className?: string): Promise<NextPaper | null> {
    let whereClause = sql`WHERE date >= CURRENT_DATE`;
    if (examName) whereClause = sql`${whereClause} AND "examName" = ${examName}`;
    if (className) whereClause = sql`${whereClause} AND "className" = ${className}`;

    const [schedule] = await sql<ExamScheduleRow[]>`
      SELECT ${selectExamScheduleColumns} FROM exam_schedules ${whereClause} ORDER BY date, "startTime" LIMIT 1
    `;
    return schedule ? toExamScheduleResponse(schedule) : null;
  },

  async getRoomUsageStats(examName?: string, className?: string): Promise<RoomUsage[]> {
    return this.getRoomUsage(examName, className);
  },

  async getCompletedPapersCount(examName?: string, className?: string): Promise<number> {
    let whereClause = sql`WHERE date < CURRENT_DATE`;
    if (examName) whereClause = sql`${whereClause} AND "examName" = ${examName}`;
    if (className) whereClause = sql`${whereClause} AND "className" = ${className}`;

    const [count] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM exam_schedules ${whereClause}
    `;
    return Number(count?.count || 0);
  },
};

function toExamScheduleResponse(schedule: ExamScheduleRow): ExamSchedule {
  return {
    ...schedule,
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
  };
}

const selectExamScheduleColumns = sql`
  id, "examId", "examName", subject, "className", date, "startTime", "endTime", room, invigilator, "maxMarks", "createdBy", "createdAt", "updatedAt"
`;