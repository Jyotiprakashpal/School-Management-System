import sql from '../config/postgres.js';

export interface AdmissionEnquiry {
  studentId: string;
  name: string;
  fatherName: string | null;
  mobileNumber: string;
  classInterested: string;
  address: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdmissionEnquiryDto {
  name: string;
  fatherName?: string;
  mobileNumber: string;
  classInterested: string;
  address?: string;
  remarks?: string;
  createdBy?: string;
}

export interface UpdateAdmissionEnquiryDto {
  name?: string;
  fatherName?: string;
  mobileNumber?: string;
  classInterested?: string;
  address?: string;
  remarks?: string;
}

export interface AdmissionEnquiryQuery {
  page?: number;
  limit?: number;
  search?: string;
  classInterested?: string;
}

type EnquiryRow = Omit<AdmissionEnquiry, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };

function toEnquiryResponse(enquiry: EnquiryRow): AdmissionEnquiry {
  return { ...enquiry, createdAt: new Date(enquiry.createdAt), updatedAt: new Date(enquiry.updatedAt) };
}

const selectEnquiryColumns = sql`
  "studentId", name, "fatherName", "mobileNumber", "classInterested", address, remarks, "createdBy", "createdAt", "updatedAt"
`;

export const admissionEnquiryRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS admission_enquiries (
        "studentId" TEXT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        "fatherName" VARCHAR(120),
        "mobileNumber" VARCHAR(40) NOT NULL,
        "classInterested" VARCHAR(50) NOT NULL,
        address TEXT,
        remarks TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Create sequence for auto-generating student IDs
    await sql`
      CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1
    `;
  },

  async generateStudentId(): Promise<string> {
    const [result] = await sql<{ nextval: number }[]>`
      SELECT nextval('student_id_seq') as nextval
    `;
    return `STUDENT${result.nextval}`;
  },

  async findMany(params: AdmissionEnquiryQuery): Promise<{ data: AdmissionEnquiry[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const classInterested = params.classInterested || null;

    const enquiries = await sql<EnquiryRow[]>`
      SELECT ${selectEnquiryColumns}
      FROM admission_enquiries
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "mobileNumber" ILIKE ${search} OR "classInterested" ILIKE ${search})
        AND (${classInterested}::text IS NULL OR "classInterested" = ${classInterested})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM admission_enquiries
      WHERE (${search}::text IS NULL OR name ILIKE ${search} OR "mobileNumber" ILIKE ${search} OR "classInterested" ILIKE ${search})
        AND (${classInterested}::text IS NULL OR "classInterested" = ${classInterested})
    `;

    return { data: enquiries.map(toEnquiryResponse), total: Number(total?.count || 0) };
  },

  async findByStudentId(studentId: string): Promise<AdmissionEnquiry | null> {
    const [enquiry] = await sql<EnquiryRow[]>`
      SELECT ${selectEnquiryColumns} FROM admission_enquiries WHERE "studentId" = ${studentId}
    `;
    return enquiry ? toEnquiryResponse(enquiry) : null;
  },

  async findByMobile(mobileNumber: string): Promise<AdmissionEnquiry | null> {
    const [enquiry] = await sql<EnquiryRow[]>`
      SELECT ${selectEnquiryColumns} FROM admission_enquiries WHERE "mobileNumber" = ${mobileNumber}
    `;
    return enquiry ? toEnquiryResponse(enquiry) : null;
  },

  async create(data: CreateAdmissionEnquiryDto): Promise<AdmissionEnquiry> {
    const studentId = await this.generateStudentId();
    const [enquiry] = await sql<EnquiryRow[]>`
      INSERT INTO admission_enquiries ("studentId", name, "fatherName", "mobileNumber", "classInterested", address, remarks, "createdBy")
      VALUES (${studentId}, ${data.name.trim()}, ${data.fatherName?.trim() || null}, ${data.mobileNumber.trim()}, ${data.classInterested.trim()}, ${data.address?.trim() || null}, ${data.remarks?.trim() || null}, ${data.createdBy || null})
      RETURNING ${selectEnquiryColumns}
    `;
    return toEnquiryResponse(enquiry);
  },

  async update(studentId: string, data: Partial<UpdateAdmissionEnquiryDto>): Promise<AdmissionEnquiry | null> {
    const current = await this.findByStudentId(studentId);
    if (!current) return null;

    const next = {
      name: data.name ?? current.name,
      fatherName: data.fatherName ?? current.fatherName,
      mobileNumber: data.mobileNumber ?? current.mobileNumber,
      classInterested: data.classInterested ?? current.classInterested,
      address: data.address ?? current.address,
      remarks: data.remarks ?? current.remarks
    };

    const [enquiry] = await sql<EnquiryRow[]>`
      UPDATE admission_enquiries
       SET name = ${next.name.trim()},
           "fatherName" = ${next.fatherName?.trim() || null},
           "mobileNumber" = ${next.mobileNumber.trim()},
           "classInterested" = ${next.classInterested.trim()},
           address = ${next.address?.trim() || null},
           remarks = ${next.remarks?.trim() || null},
           "updatedAt" = NOW()
       WHERE "studentId" = ${studentId}
       RETURNING ${selectEnquiryColumns}
    `;
    return enquiry ? toEnquiryResponse(enquiry) : null;
  },

  async delete(studentId: string): Promise<boolean> {
    const rows = await sql<{ "studentId": string }[]>`
      DELETE FROM admission_enquiries WHERE "studentId" = ${studentId} RETURNING "studentId"
    `;
    return rows.length > 0;
  }
};