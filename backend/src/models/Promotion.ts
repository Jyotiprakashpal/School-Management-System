import sql from '../config/postgres.js';

export interface PromotionMove {
  id: number;
  promotionId: number;
  admissionNo: string;
  name: string;
  previousClass: string;
  targetClass: string;
  createdBy: string | null;
  createdAt: Date;
}

export interface PromotionBatch {
  id: number;
  academicYear: string;
  fromClass: string;
  createdBy: string | null;
  createdAt: Date;
  moves?: PromotionMove[];
}

export interface CreatePromotionDto {
  academicYear: string;
  fromClass: string;
  moves: Omit<PromotionMove, 'id' | 'promotionId' | 'createdAt'>[];
  createdBy?: string;
}

export interface PromotionQuery {
  page?: number;
  limit?: number;
  academicYear?: string;
  fromClass?: string;
}

type PromotionBatchRow = Omit<PromotionBatch, 'createdAt' | 'moves'> & { createdAt: string };

function toPromotionBatchResponse(batch: PromotionBatchRow): PromotionBatch {
  return { ...batch, createdAt: new Date(batch.createdAt) };
}

export const promotionRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS promotion_batches (
        id SERIAL PRIMARY KEY,
        "academicYear" VARCHAR(20) NOT NULL,
        "fromClass" VARCHAR(50) NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE promotion_batches ADD COLUMN IF NOT EXISTS "createdBy" TEXT`;
    await sql`ALTER TABLE promotion_batches ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_promotion_batches_academic_year ON promotion_batches("academicYear")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_promotion_batches_from_class ON promotion_batches("fromClass")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_promotion_batches_created_at ON promotion_batches("createdAt" DESC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS promotion_moves (
        id SERIAL PRIMARY KEY,
        "promotionId" INTEGER NOT NULL REFERENCES promotion_batches(id) ON DELETE CASCADE,
        "admissionNo" VARCHAR(80) NOT NULL,
        name VARCHAR(120) NOT NULL,
        "previousClass" VARCHAR(50) NOT NULL,
        "targetClass" VARCHAR(50) NOT NULL,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE promotion_moves ADD COLUMN IF NOT EXISTS "createdBy" TEXT`;
    await sql`ALTER TABLE promotion_moves ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_promotion_moves_promotion_id ON promotion_moves("promotionId")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_promotion_moves_admission_no ON promotion_moves("admissionNo")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_promotion_moves_target_class ON promotion_moves("targetClass")
    `;
    const [{ count }] = await sql<{ count: string }[]>`SELECT COUNT(*)::text AS count FROM promotion_batches`;
    if (Number(count) === 0) {
      const [student] = await sql<{ admissionNo: string; fullName: string; className: string }[]>`
        SELECT "admissionNo", "fullName", "className"
        FROM admissions
        WHERE "className" IS NOT NULL AND "className" <> ''
        ORDER BY id
        LIMIT 1
      `;
      if (student) {
        const [nextClass] = await sql<{ name: string }[]>`
          SELECT name FROM school_classes
          WHERE active = TRUE AND name <> ${student.className}
          ORDER BY id
          LIMIT 1
        `;
        if (nextClass) {
          const [batch] = await sql<{ id: number }[]>`
            INSERT INTO promotion_batches ("academicYear", "fromClass", "createdBy")
            VALUES (${`${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`}, ${student.className}, 'System')
            RETURNING id
          `;
          await sql`
            INSERT INTO promotion_moves ("promotionId", "admissionNo", name, "previousClass", "targetClass", "createdBy")
            VALUES (${batch.id}, ${student.admissionNo}, ${student.fullName}, ${student.className}, ${nextClass.name}, 'System')
          `;
          await sql`
            UPDATE admissions SET "className" = ${nextClass.name}, "updatedAt" = NOW()
            WHERE "admissionNo" = ${student.admissionNo}
          `;
        }
      }
    }
  },

  async findMany(params: PromotionQuery): Promise<{ data: PromotionBatch[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const academicYear = params.academicYear || null;
    const fromClass = params.fromClass || null;

    const batches = await sql<PromotionBatchRow[]>`
      SELECT id, "academicYear", "fromClass", "createdBy", "createdAt"
      FROM promotion_batches
      WHERE (${academicYear}::text IS NULL OR "academicYear" = ${academicYear})
        AND (${fromClass}::text IS NULL OR "fromClass" = ${fromClass})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM promotion_batches
      WHERE (${academicYear}::text IS NULL OR "academicYear" = ${academicYear})
        AND (${fromClass}::text IS NULL OR "fromClass" = ${fromClass})
    `;

    // Fetch moves for each batch
    const batchIds = batches.map(b => b.id);
    let movesMap: Record<number, PromotionMove[]> = {};
    
    if (batchIds.length > 0) {
      const moves = await sql<PromotionMove[]>`
        SELECT id, "promotionId", "admissionNo", name, "previousClass", "targetClass", "createdBy", "createdAt"
        FROM promotion_moves
        WHERE "promotionId" IN ${sql(batchIds)}
        ORDER BY "createdAt"
      `;
      
      movesMap = moves.reduce((acc, move) => {
        if (!acc[move.promotionId]) acc[move.promotionId] = [];
        acc[move.promotionId].push(move);
        return acc;
      }, {} as Record<number, PromotionMove[]>);
    }

    const data = batches.map(batch => ({
      ...toPromotionBatchResponse(batch),
      moves: movesMap[batch.id] || []
    }));

    return { data, total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<PromotionBatch | null> {
    const [batch] = await sql<PromotionBatchRow[]>`
      SELECT id, "academicYear", "fromClass", "createdBy", "createdAt" FROM promotion_batches WHERE id = ${id}
    `;
    if (!batch) return null;

    const moves = await sql<PromotionMove[]>`
      SELECT id, "promotionId", "admissionNo", name, "previousClass", "targetClass", "createdBy", "createdAt"
      FROM promotion_moves
      WHERE "promotionId" = ${id}
      ORDER BY "createdAt"
    `;

    return { ...toPromotionBatchResponse(batch), moves };
  },

  async create(data: CreatePromotionDto): Promise<PromotionBatch> {
    const [batch] = await sql<PromotionBatchRow[]>`
      INSERT INTO promotion_batches ("academicYear", "fromClass", "createdBy")
      VALUES (${data.academicYear}, ${data.fromClass}, ${data.createdBy || null})
      RETURNING id, "academicYear", "fromClass", "createdBy", "createdAt"
    `;

    if (data.moves.length > 0) {
      for (const move of data.moves) {
        await sql`
          INSERT INTO promotion_moves ("promotionId", "admissionNo", name, "previousClass", "targetClass", "createdBy")
          VALUES (${batch.id}, ${move.admissionNo}, ${move.name}, ${move.previousClass}, ${move.targetClass}, ${move.createdBy || null})
        `;
        await sql`
          UPDATE admissions
          SET "className" = ${move.targetClass}, "updatedAt" = NOW()
          WHERE "admissionNo" = ${move.admissionNo}
        `;
      }
    }

    return this.findById(batch.id) as Promise<PromotionBatch>;
  },

  async delete(id: number): Promise<boolean> {
    const moves = await sql<{ admissionNo: string; previousClass: string }[]>`
      SELECT "admissionNo", "previousClass" FROM promotion_moves WHERE "promotionId" = ${id}
    `;
    for (const move of moves) {
      await sql`
        UPDATE admissions
        SET "className" = ${move.previousClass}, "updatedAt" = NOW()
        WHERE "admissionNo" = ${move.admissionNo}
      `;
    }
    const rows = await sql<{ id: number }[]>`
      DELETE FROM promotion_batches WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  },

  async getStats(): Promise<{
    totalPromotions: number;
    totalBatches: number;
    latestAcademicYear: string | null;
    latestBatchCount: number;
  }> {
    const [totalPromotions] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM promotion_moves
    `;

    const [totalBatches] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM promotion_batches
    `;

    const [latestYear] = await sql<{ academicYear: string }[]>`
      SELECT "academicYear" FROM promotion_batches ORDER BY "createdAt" DESC LIMIT 1
    `;

    const [latestBatchCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM promotion_batches WHERE "academicYear" = ${latestYear?.academicYear || ''}
    `;

    return {
      totalPromotions: Number(totalPromotions?.count || 0),
      totalBatches: Number(totalBatches?.count || 0),
      latestAcademicYear: latestYear?.academicYear || null,
      latestBatchCount: Number(latestBatchCount?.count || 0),
    };
  },
};
