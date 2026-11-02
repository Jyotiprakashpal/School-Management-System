import sql from '../config/postgres.js';

export interface Document {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  category: string;
  tags: string[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentDto {
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  category: string;
  tags?: string[];
  uploadedBy: string;
}

export interface UpdateDocumentDto {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface DocumentQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  uploadedBy?: string;
}

type DocumentRow = Omit<Document, 'createdAt' | 'updatedAt' | 'tags'> & {
  tags: string;
  createdAt: string;
  updatedAt: string;
};

function toDocumentResponse(row: DocumentRow): Document {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

const selectDocumentColumns = sql`
  id, title, description, "fileName", "originalFileName", "mimeType", "fileSize", "filePath", category, tags, "uploadedBy", "createdAt", "updatedAt"
`;

export const documentRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "fileName" VARCHAR(255) NOT NULL,
        "originalFileName" VARCHAR(255) NOT NULL,
        "mimeType" VARCHAR(100) NOT NULL,
        "fileSize" BIGINT NOT NULL,
        "filePath" TEXT NOT NULL,
        category VARCHAR(100),
        tags JSONB DEFAULT '[]',
        "uploadedBy" TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents("uploadedBy")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents("createdAt" DESC)
    `;
  },

  async findMany(params: DocumentQuery): Promise<{ data: Document[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const category = params.category || null;
    const uploadedBy = params.uploadedBy || null;

    const documents = await sql<DocumentRow[]>`
      SELECT ${selectDocumentColumns}
      FROM documents
      WHERE (${search}::text IS NULL OR title ILIKE ${search} OR description ILIKE ${search} OR "originalFileName" ILIKE ${search})
        AND (${category}::text IS NULL OR category = ${category})
        AND (${uploadedBy}::text IS NULL OR "uploadedBy" = ${uploadedBy})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM documents
      WHERE (${search}::text IS NULL OR title ILIKE ${search} OR description ILIKE ${search} OR "originalFileName" ILIKE ${search})
        AND (${category}::text IS NULL OR category = ${category})
        AND (${uploadedBy}::text IS NULL OR "uploadedBy" = ${uploadedBy})
    `;

    return { data: documents.map(toDocumentResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Document | null> {
    const [document] = await sql<DocumentRow[]>`
      SELECT ${selectDocumentColumns} FROM documents WHERE id = ${id}
    `;
    return document ? toDocumentResponse(document) : null;
  },

  async create(data: CreateDocumentDto): Promise<Document> {
    const [document] = await sql<DocumentRow[]>`
      INSERT INTO documents (title, description, "fileName", "originalFileName", "mimeType", "fileSize", "filePath", category, tags, "uploadedBy")
      VALUES (${data.title}, ${data.description || null}, ${data.fileName}, ${data.originalFileName}, ${data.mimeType}, ${data.fileSize}, ${data.filePath}, ${data.category}, ${JSON.stringify(data.tags || [])}, ${data.uploadedBy})
      RETURNING ${selectDocumentColumns}
    `;
    return toDocumentResponse(document);
  },

  async update(id: number, data: Partial<UpdateDocumentDto>): Promise<Document | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push('title = $' + (values.length + 1)); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = $' + (values.length + 1)); values.push(data.description); }
    if (data.category !== undefined) { updates.push('category = $' + (values.length + 1)); values.push(data.category); }
    if (data.tags !== undefined) { updates.push('tags = $' + (values.length + 1)); values.push(JSON.stringify(data.tags)); }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const query = `UPDATE documents SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING ${selectDocumentColumns}`;
    const result = await sql.unsafe(query, values) as DocumentRow[];
    const document = result[0];
    return document ? toDocumentResponse(document) : null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM documents WHERE id = ${id}
    `;
    return result.count > 0;
  },
};