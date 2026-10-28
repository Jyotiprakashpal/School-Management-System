import sql from '../config/postgres.js';

export interface Admission {
  id: number;
  admissionNo: string;
  formNumber: string | null;
  fullName: string;
  fatherName: string | null;
  motherName: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string | null;
  aadhaar: string | null;
  pen: string | null;
  className: string | null;
  section: string | null;
  status: string | null;
  admissionDate: Date | null;
  category: string | null;
  religion: string | null;
  nationality: string | null;
  academicYear: string | null;
  mobile: string | null;
  altMobile: string | null;
  email: string | null;
  address: string | null;
  pinCode: string | null;
  district: string | null;
  state: string | null;
  transportFee: number | null;
  studentPhoto: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdmissionDto {
  admissionNo: string;
  formNumber?: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  bloodGroup?: string;
  aadhaar?: string;
  pen?: string;
  className?: string;
  section?: string;
  status?: string;
  admissionDate?: string | Date;
  category?: string;
  religion?: string;
  nationality?: string;
  academicYear?: string;
  mobile?: string;
  altMobile?: string;
  email?: string;
  address?: string;
  pinCode?: string;
  district?: string;
  state?: string;
  transportFee?: number;
  studentPhoto?: string;
  remarks?: string;
  createdBy?: string;
}

export interface UpdateAdmissionDto {
  admissionNo?: string;
  formNumber?: string;
  fullName?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  bloodGroup?: string;
  aadhaar?: string;
  pen?: string;
  className?: string;
  section?: string;
  status?: string;
  admissionDate?: string | Date;
  category?: string;
  religion?: string;
  nationality?: string;
  academicYear?: string;
  mobile?: string;
  altMobile?: string;
  email?: string;
  address?: string;
  pinCode?: string;
  district?: string;
  state?: string;
  transportFee?: number;
  studentPhoto?: string;
  remarks?: string;
}

export interface AdmissionQuery {
  page?: number;
  limit?: number;
  search?: string;
  className?: string;
  section?: string;
  status?: string;
  category?: string;
}

type AdmissionRow = Omit<Admission, 'dateOfBirth' | 'admissionDate' | 'createdAt' | 'updatedAt'> & {
  dateOfBirth: string | null;
  admissionDate: string | null;
  createdAt: string;
  updatedAt: string;
};

function toAdmissionResponse(admission: AdmissionRow): Admission {
  return {
    ...admission,
    dateOfBirth: admission.dateOfBirth ? new Date(admission.dateOfBirth) : null,
    admissionDate: admission.admissionDate ? new Date(admission.admissionDate) : null,
    createdAt: new Date(admission.createdAt),
    updatedAt: new Date(admission.updatedAt),
  };
}

const selectAdmissionColumns = sql`
  id, "admissionNo", "formNumber", "fullName", "fatherName", "motherName", "dateOfBirth",
  gender, "bloodGroup", aadhaar, pen, "className", section, status, "admissionDate",
  category, religion, nationality, "academicYear", mobile, "altMobile", email, address,
  "pinCode", district, state, "transportFee", "studentPhoto", remarks, "createdBy", "createdAt", "updatedAt"
`;

export const admissionRepository = {
  async initializeTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS admissions (
        id SERIAL PRIMARY KEY,
        "admissionNo" VARCHAR(80) NOT NULL UNIQUE,
        "formNumber" VARCHAR(80),
        "fullName" VARCHAR(120) NOT NULL,
        "fatherName" VARCHAR(120),
        "motherName" VARCHAR(120),
        "dateOfBirth" DATE,
        gender VARCHAR(20),
        "bloodGroup" VARCHAR(10),
        aadhaar VARCHAR(20),
        pen VARCHAR(40),
        "className" VARCHAR(50),
        section VARCHAR(10),
        status VARCHAR(20) DEFAULT 'Active',
        "admissionDate" DATE,
        category VARCHAR(20),
        religion VARCHAR(30),
        nationality VARCHAR(50),
        "academicYear" VARCHAR(20),
        mobile VARCHAR(40),
        "altMobile" VARCHAR(40),
        email VARCHAR(120),
        address TEXT,
        "pinCode" VARCHAR(10),
        district VARCHAR(80),
        state VARCHAR(80),
        "transportFee" INTEGER DEFAULT 0,
        "studentPhoto" TEXT,
        remarks TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admissions_admission_no ON admissions("admissionNo")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admissions_full_name ON admissions("fullName")
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admissions_class_section ON admissions("className", section)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admissions_mobile ON admissions(mobile)
    `;
  },

  async findMany(params: AdmissionQuery): Promise<{ data: Admission[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? '%' + params.search + '%' : null;
    const className = params.className || null;
    const section = params.section || null;
    const status = params.status || null;
    const category = params.category || null;

    const admissions = await sql<AdmissionRow[]>`
      SELECT ${selectAdmissionColumns}
      FROM admissions
      WHERE (${search}::text IS NULL OR "fullName" ILIKE ${search} OR "admissionNo" ILIKE ${search} OR mobile ILIKE ${search} OR "fatherName" ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${category}::text IS NULL OR category = ${category})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [total] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM admissions
      WHERE (${search}::text IS NULL OR "fullName" ILIKE ${search} OR "admissionNo" ILIKE ${search} OR mobile ILIKE ${search} OR "fatherName" ILIKE ${search})
        AND (${className}::text IS NULL OR "className" = ${className})
        AND (${section}::text IS NULL OR section = ${section})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${category}::text IS NULL OR category = ${category})
    `;

    return { data: admissions.map(toAdmissionResponse), total: Number(total?.count || 0) };
  },

  async findById(id: number): Promise<Admission | null> {
    const [admission] = await sql<AdmissionRow[]>`
      SELECT ${selectAdmissionColumns} FROM admissions WHERE id = ${id}
    `;
    return admission ? toAdmissionResponse(admission) : null;
  },

  async findByAdmissionNo(admissionNo: string): Promise<Admission | null> {
    const [admission] = await sql<AdmissionRow[]>`
      SELECT ${selectAdmissionColumns} FROM admissions WHERE "admissionNo" = ${admissionNo}
    `;
    return admission ? toAdmissionResponse(admission) : null;
  },

  async create(data: CreateAdmissionDto): Promise<Admission> {
    const [admission] = await sql<AdmissionRow[]>`
      INSERT INTO admissions (
        "admissionNo", "formNumber", "fullName", "fatherName", "motherName", "dateOfBirth",
        gender, "bloodGroup", aadhaar, pen, "className", section, status, "admissionDate",
        category, religion, nationality, "academicYear", mobile, "altMobile", email, address,
        "pinCode", district, state, "transportFee", "studentPhoto", remarks, "createdBy"
      )
      VALUES (
        ${data.admissionNo}, ${data.formNumber || null}, ${data.fullName}, ${data.fatherName || null},
        ${data.motherName || null}, ${data.dateOfBirth || null}, ${data.gender || null},
        ${data.bloodGroup || null}, ${data.aadhaar || null}, ${data.pen || null},
        ${data.className || null}, ${data.section || null}, ${data.status || 'Active'},
        ${data.admissionDate || null}, ${data.category || null}, ${data.religion || null},
        ${data.nationality || null}, ${data.academicYear || null}, ${data.mobile || null},
        ${data.altMobile || null}, ${data.email || null}, ${data.address || null},
        ${data.pinCode || null}, ${data.district || null}, ${data.state || null},
        ${data.transportFee || 0}, ${data.studentPhoto || null}, ${data.remarks || null}, ${data.createdBy || null}
      )
      RETURNING ${selectAdmissionColumns}
    `;
    return toAdmissionResponse(admission);
  },

  async update(id: number, data: Partial<UpdateAdmissionDto>): Promise<Admission | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const next = {
      admissionNo: data.admissionNo ?? current.admissionNo,
      formNumber: data.formNumber ?? current.formNumber,
      fullName: data.fullName ?? current.fullName,
      fatherName: data.fatherName ?? current.fatherName,
      motherName: data.motherName ?? current.motherName,
      dateOfBirth: data.dateOfBirth ?? current.dateOfBirth,
      gender: data.gender ?? current.gender,
      bloodGroup: data.bloodGroup ?? current.bloodGroup,
      aadhaar: data.aadhaar ?? current.aadhaar,
      pen: data.pen ?? current.pen,
      className: data.className ?? current.className,
      section: data.section ?? current.section,
      status: data.status ?? current.status,
      admissionDate: data.admissionDate ?? current.admissionDate,
      category: data.category ?? current.category,
      religion: data.religion ?? current.religion,
      nationality: data.nationality ?? current.nationality,
      academicYear: data.academicYear ?? current.academicYear,
      mobile: data.mobile ?? current.mobile,
      altMobile: data.altMobile ?? current.altMobile,
      email: data.email ?? current.email,
      address: data.address ?? current.address,
      pinCode: data.pinCode ?? current.pinCode,
      district: data.district ?? current.district,
      state: data.state ?? current.state,
      transportFee: data.transportFee ?? current.transportFee,
      studentPhoto: data.studentPhoto ?? current.studentPhoto,
      remarks: data.remarks ?? current.remarks,
    };

    const [admission] = await sql<AdmissionRow[]>`
      UPDATE admissions
       SET "admissionNo" = ${next.admissionNo},
           "formNumber" = ${next.formNumber},
           "fullName" = ${next.fullName},
           "fatherName" = ${next.fatherName},
           "motherName" = ${next.motherName},
           "dateOfBirth" = ${next.dateOfBirth},
           gender = ${next.gender},
           "bloodGroup" = ${next.bloodGroup},
           aadhaar = ${next.aadhaar},
           pen = ${next.pen},
           "className" = ${next.className},
           section = ${next.section},
           status = ${next.status},
           "admissionDate" = ${next.admissionDate},
           category = ${next.category},
           religion = ${next.religion},
           nationality = ${next.nationality},
           "academicYear" = ${next.academicYear},
           mobile = ${next.mobile},
           "altMobile" = ${next.altMobile},
           email = ${next.email},
           address = ${next.address},
           "pinCode" = ${next.pinCode},
           district = ${next.district},
           state = ${next.state},
           "transportFee" = ${next.transportFee},
           "studentPhoto" = ${next.studentPhoto},
           remarks = ${next.remarks},
           "updatedAt" = NOW()
       WHERE id = ${id}
       RETURNING ${selectAdmissionColumns}
    `;
    return admission ? toAdmissionResponse(admission) : null;
  },

  async delete(id: number): Promise<boolean> {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM admissions WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }
};