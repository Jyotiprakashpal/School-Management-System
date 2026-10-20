import { Request, Response } from 'express';
import {
  studentRepository,
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  StudentQuery,
  isFeeHeadArray
} from '../models/Student.js';

interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const parseStudentId = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateStudentBody = (body: Partial<CreateStudentDto>): string | null => {
  if (typeof body.name !== 'string' || !body.name.trim()) return 'name is required';
  if (typeof body.adm !== 'string' || !body.adm.trim()) return 'adm is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'className is required';
  if (typeof body.father !== 'string' || !body.father.trim()) return 'father is required';
  if (typeof body.phone !== 'string' || !body.phone.trim()) return 'phone is required';
  if (body.fees !== undefined && !isFeeHeadArray(body.fees)) return 'fees must be an array of valid fee heads';
  return null;
};

export const getAllStudents = async (req: Request<{}, {}, {}, StudentQuery>, res: Response<PaginatedStudents | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const className = req.query.className as string;

    const { data, total } = await studentRepository.findMany({ page, limit, search, className });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudentById = async (req: Request<{ id: string }>, res: Response<Student | { error: string }>) => {
  try {
    const id = parseStudentId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const student = await studentRepository.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const createStudent = async (req: Request<{}, Student | { error: string }, CreateStudentDto>, res: Response<Student | { error: string }>) => {
  try {
    const { name, adm, className, father, phone, fees } = req.body;

    const validationError = validateStudentBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!name || !adm || !className || !father || !phone) {
      return res.status(400).json({ error: 'Missing required fields: name, adm, className, father, phone' });
    }

    const existingStudent = await studentRepository.findByAdm(adm);
    if (existingStudent) {
      return res.status(409).json({ error: 'Student with this admission number already exists' });
    }

    const student = await studentRepository.create({
      name,
      adm,
      className,
      father,
      phone,
      fees: fees || []
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Student with this admission number already exists' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const updateStudent = async (req: Request<{ id: string }, Student | { error: string }, UpdateStudentDto>, res: Response<Student | { error: string }>) => {
  try {
    const id = parseStudentId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const { name, adm, className, father, phone, fees } = req.body;

    const validationError = validateStudentBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const student = await studentRepository.update(id, { name, adm, className, father, phone, fees });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Student with this admission number already exists' });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req: Request<{ id: string }>, res: Response<void | { error: string }>) => {
  try {
    const id = parseStudentId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    await studentRepository.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};
