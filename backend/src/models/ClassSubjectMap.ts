import sql from '../config/postgres.js';

export interface ClassSubjectMap {
  id: number;
  className: string;
  section: string;
  year: string;
  subjectId: number | null;
  subjectCode: string;
  subjectName: string;
  teacher: string;
  periods: number;
  type: 'Required' | 'Optional';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassSubjectMapDto {
  className: string;
  section: string;
  year: string;
  subjectCode: string;
  subjectName: string;
  teacher: string;
  periods: number;
  type: 'Required' | 'Optional';
}

export interface UpdateClassSubjectMapDto {
  subjectCode?: string;
  subjectName?: string;
  teacher?: string;
  periods?: number;
  type?: 'Required' | 'Optional';
}

export interface ClassSubjectMapQuery {
  page?: number;
  limit?: number;
  className?: string;
  section?: string;
  year?: string;
  teacher?: string;
  type?: string;
}

export interface ClassSubjectMapStats {
  totalSubjects: number;
  totalPeriods: number;
  teachers: number;
  unassigned: number;
  optionalCount: number;
  capacityPercent: number;
  overCapacity: boolean;
  teacherLoad: Array<{ teacher: string; periods: number }>;
}

type ClassSubjectMapRow = Omit<ClassSubjectMap, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function toClassSubjectMapResponse(map: ClassSubjectMapRow): ClassSubjectMap {
  return {
    ...map,
    createdAt: new Date(map.createdAt),
    updatedAt: new Date(map.updatedAt),
  };
}

const selectClassSubjectMapColumns = sql`
  id, "className", section, year, "subjectId", "subjectCode", "subjectName", teacher, periods, type, "createdAt", "updatedAt"
`;

export const classSubjectMapRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS class_subject_maps (
        id SERIAL PRIMARY KEY,
        "className" VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        year VARCHAR(20) NOT NULL,
        "subjectId" INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
        "subjectCode" VARCHAR(20) NOT NULL,
        "subjectName" VARCHAR(120) NOT NULL,
        teacher VARCHAR(120) NOT NULL DEFAULT 'Unassigned',
        periods INTEGER NOT NULL DEFAULT 1,
        type VARCHAR(20) NOT NULL DEFAULT 'Required' CHECK (type IN ('Required', 'Optional')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("className", section, year, "subjectCode")
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_subject_maps_class_section_year ON class_subject_maps("className", section, year)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_subject_maps_subject_id ON class_subject_maps("subjectId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_class_subject_maps_teacher ON class_subject_maps(teacher)
    `;
  },

  async findMany(params: ClassSubjectMapQuery): Promise<{ data: ClassSubjectMap[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;
    const className = params.className || null;
    const section = params.section || null;
    const year = params.year || null;
    const teacher = params.teacher || null;
    const type = params.type || null;

    const maps = await sql<ClassSubjectMapRow[]>`
      SELECT ${selectClassSubjectMapColumns}
      FROM class_subject_maps
      WHERE (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${year}::text IS NULL OR year = ${year})
        AND (${teacher}::text IS NULL OR teacher ILIKE ${'%' + teacher + '%'})
        AND (${type}::text IS NULL OR type = ${type})
      ORDER BY "className", section, "subjectCode"
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM class_subject_maps
      WHERE (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${year}::text IS NULL OR year = ${year})
        AND (${teacher}::text IS NULL OR teacher ILIKE ${'%' + teacher + '%'})
        AND (${type}::text IS NULL OR type = ${type})
    `;

    return { data: maps.map(toClassSubjectMapResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<ClassSubjectMap | null> {
    const [map] = await sql<ClassSubjectMapRow[]>`
      SELECT ${selectClassSubjectMapColumns} FROM class_subject_maps WHERE id = ${id}
    `;
    return map ? toClassSubjectMapResponse(map) : null;
  },

  async findByClassSectionYear(className: string, section: string, year: string): Promise<ClassSubjectMap[]> {
    const maps = await sql<ClassSubjectMapRow[]>`
      SELECT ${selectClassSubjectMapColumns}
      FROM class_subject_maps
      WHERE "className" = ${className} AND section = ${section} AND year = ${year}
      ORDER BY "subjectCode"
    `;
    return maps.map(toClassSubjectMapResponse);
  },

  async checkDuplicate(className: string, section: string, year: string, subjectCode: string, excludeId?: number): Promise<boolean> {
    const [result] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM class_subject_maps
      WHERE "className" = ${className} AND section = ${section} AND year = ${year} AND "subjectCode" = ${subjectCode}
        ${excludeId ? sql`AND id != ${excludeId}` : sql``}
    `;
    return Number(result?.count || 0) > 0;
  },

  async create(data: CreateClassSubjectMapDto): Promise<ClassSubjectMap> {
    // Try to find subject by code
    const subject = await sql<{ id: number }[]>`
      SELECT id FROM subjects WHERE code = ${data.subjectCode.toUpperCase()}
    `;
    const subjectId = subject.length > 0 ? subject[0].id : null;

    const [map] = await sql<ClassSubjectMapRow[]>`
      INSERT INTO class_subject_maps ("className", section, year, "subjectId", "subjectCode", "subjectName", teacher, periods, type)
      VALUES (${data.className}, ${data.section}, ${data.year}, ${subjectId}, ${data.subjectCode.toUpperCase()}, ${data.subjectName}, ${data.teacher}, ${data.periods}, ${data.type})
      RETURNING ${selectClassSubjectMapColumns}
    `;
    return toClassSubjectMapResponse(map);
  },

  async update(id: number, data: Partial<UpdateClassSubjectMapDto>): Promise<ClassSubjectMap | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      subjectCode: data.subjectCode?.toUpperCase() ?? current.subjectCode,
      subjectName: data.subjectName ?? current.subjectName,
      teacher: data.teacher ?? current.teacher,
      periods: data.periods ?? current.periods,
      type: data.type ?? current.type,
    };

    // Try to find subject by code
    let subjectId = current.subjectId;
    if (next.subjectCode !== current.subjectCode) {
      const subject = await sql<{ id: number }[]>`
        SELECT id FROM subjects WHERE code = ${next.subjectCode.toUpperCase()}
      `;
      subjectId = subject.length > 0 ? subject[0].id : null;
    }

    const [map] = await sql<ClassSubjectMapRow[]>`
      UPDATE class_subject_maps
       SET "subjectCode" = ${next.subjectCode},
           "subjectName" = ${next.subjectName},
           teacher = ${next.teacher},
           periods = ${next.periods},
           type = ${next.type},
           "subjectId" = ${subjectId},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectClassSubjectMapColumns}
    `;
    return map ? toClassSubjectMapResponse(map) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM class_subject_maps WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async deleteByClassSectionYear(className: string, section: string, year: string): Promise<number> {
    const result = await sql`
      DELETE FROM class_subject_maps WHERE "className" = ${className} AND section = ${section} AND year = ${year}
    `;
    return result.count;
  },

  async copyFrom(sourceClassName: string, sourceSection: string, sourceYear: string, targetClassName: string, targetSection: string, targetYear: string): Promise<{ copied: number; skipped: number }> {
    const sourceMaps = await this.findByClassSectionYear(sourceClassName, sourceSection, sourceYear);
    
    if (sourceMaps.length === 0) {
      throw new Error(`No subject mappings found for ${sourceClassName}-${sourceSection} in ${sourceYear}`);
    }

    let copied = 0;
    let skipped = 0;

    for (const map of sourceMaps) {
      const isDuplicate = await this.checkDuplicate(targetClassName, targetSection, targetYear, map.subjectCode);
      if (isDuplicate) {
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO class_subject_maps ("className", section, year, "subjectId", "subjectCode", "subjectName", teacher, periods, type)
        VALUES (${targetClassName}, ${targetSection}, ${targetYear}, ${map.subjectId}, ${map.subjectCode}, ${map.subjectName}, ${map.teacher}, ${map.periods}, ${map.type})
      `;
      copied++;
    }

    return { copied, skipped };
  },

  async getStats(className: string, section: string, year: string): Promise<ClassSubjectMapStats> {
    const maps = await this.findByClassSectionYear(className, section, year);
    
    const totalSubjects = maps.length;
    const totalPeriods = maps.reduce((sum, m) => sum + m.periods, 0);
    const teacherSet = new Set(maps.filter(m => m.teacher !== 'Unassigned').map(m => m.teacher));
    const teachers = teacherSet.size;
    const unassigned = maps.filter(m => m.teacher === 'Unassigned').length;
    const optionalCount = maps.filter(m => m.type === 'Optional').length;
    const capacityPercent = Math.min(100, Math.round((totalPeriods / 36) * 100));
    const overCapacity = totalPeriods > 36;

    const teacherLoadMap = new Map<string, number>();
    for (const map of maps) {
      if (map.teacher !== 'Unassigned') {
        teacherLoadMap.set(map.teacher, (teacherLoadMap.get(map.teacher) || 0) + map.periods);
      }
    }
    const teacherLoad = Array.from(teacherLoadMap.entries())
      .map(([teacher, periods]) => ({ teacher, periods }))
      .sort((a, b) => b.periods - a.periods);

    return {
      totalSubjects,
      totalPeriods,
      teachers,
      unassigned,
      optionalCount,
      capacityPercent,
      overCapacity,
      teacherLoad,
    };
  },

  async getYears(): Promise<string[]> {
    const result = await sql<{ year: string }[]>`
      SELECT DISTINCT year FROM class_subject_maps ORDER BY year DESC
    `;
    return result.map(r => r.year);
  },

  async getClasses(): Promise<string[]> {
    const result = await sql<{ className: string }[]>`
      SELECT DISTINCT "className" FROM class_subject_maps ORDER BY "className"
    `;
    return result.map(r => r.className);
  },

  async getSections(): Promise<string[]> {
    const result = await sql<{ section: string }[]>`
      SELECT DISTINCT section FROM class_subject_maps ORDER BY section
    `;
    return result.map(r => r.section);
  },

  async getTeachers(): Promise<string[]> {
    const result = await sql<{ teacher: string }[]>`
      SELECT DISTINCT teacher FROM class_subject_maps WHERE teacher != 'Unassigned' ORDER BY teacher
    `;
    return result.map(r => r.teacher);
  },
};