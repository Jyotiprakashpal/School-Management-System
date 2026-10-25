import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  studentRepository,
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  StudentQuery
} from '../models/Student.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'student';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'student'
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateStudentBody = (body: Partial<CreateStudentDto>): string | null => {
  if (typeof body.userId !== 'string' || !body.userId.trim()) return 'userId is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'name is required';
  if (typeof body.admissionNo !== 'string' || !body.admissionNo.trim()) return 'admissionNo is required';
  if (typeof body.fatherName !== 'string' || !body.fatherName.trim()) return 'fatherName is required';
  if (typeof body.class !== 'string' || !body.class.trim()) return 'class is required';
  if (typeof body.section !== 'string' || !body.section.trim()) return 'section is required';
  if (typeof body.phone !== 'string' || !body.phone.trim()) return 'phone is required';
  if (typeof body.gender !== 'string' || !body.gender.trim()) return 'gender is required';
  if (body.admissionDate === undefined || body.admissionDate === '') return 'admissionDate is required';
  return null;
};

export const getAllStudents = async (req: Request<{}, {}, {}, StudentQuery>, res: Response<PaginatedStudents | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const className = req.query.class as string;
    const section = req.query.section as string;
    const userId = req.query.userId as string;

    const { data, total } = await studentRepository.findMany({ page, limit, search, class: className, section, userId });

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

export const getStudentByCompositeKey = async (req: Request<{ userId: string; admissionNo: string }>, res: Response<Student | { error: string }>) => {
  try {
    const { userId, admissionNo } = req.params;
    if (!userId || !admissionNo) {
      return res.status(400).json({ error: 'userId and admissionNo are required' });
    }

    const student = await studentRepository.findByCompositeKey(userId, admissionNo);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const getStudentByAdmissionNo = async (req: Request<{ admissionNo: string }>, res: Response<Student | { error: string }>) => {
  try {
    const { admissionNo } = req.params;
    if (!admissionNo) {
      return res.status(400).json({ error: 'admissionNo is required' });
    }

    const student = await studentRepository.findByAdmissionNo(admissionNo);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get student by admissionNo error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const createStudent = async (req: Request<{}, Student | { error: string }, CreateStudentDto>, res: Response<Student | { error: string }>) => {
  try {
    const { userId, name, admissionNo, fatherName, class: className, section, phone, gender, admissionDate } = req.body;

    const validationError = validateStudentBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingStudent = await studentRepository.findByAdmissionNo(admissionNo);
    if (existingStudent) {
      return res.status(409).json({ error: 'Student with this admission number already exists' });
    }

    const student = await studentRepository.create({
      userId,
      name,
      admissionNo,
      fatherName,
      class: className,
      section,
      phone,
      gender,
      admissionDate
    });

    // Emit real-time event
    getIO(req).to('students').emit('student:created', student);

    // Create notification
    await createNotification(req, {
      userId,
      title: 'New Student Added',
      message: `Student ${name} (${admissionNo}) has been added to class ${className}-${section}`,
      type: 'success',
      entityType: 'student',
      entityId: `${userId}-${admissionNo}`
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Student with this admission number already exists' });
    }
    if ((error as { code?: string })?.code === '23503') {
      return res.status(400).json({ error: 'Invalid userId: user does not exist' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const updateStudent = async (req: Request<{ userId: string; admissionNo: string }, Student | { error: string }, UpdateStudentDto>, res: Response<Student | { error: string }>) => {
  try {
    const { userId, admissionNo } = req.params;
    if (!userId || !admissionNo) {
      return res.status(400).json({ error: 'userId and admissionNo are required' });
    }

    const { name, admissionNo: newAdmissionNo, fatherName, class: className, section, phone, gender, admissionDate } = req.body;

    if (newAdmissionNo !== undefined && (typeof newAdmissionNo !== 'string' || !newAdmissionNo.trim())) {
      return res.status(400).json({ error: 'admissionNo must be a non-empty string' });
    }
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    if (fatherName !== undefined && (typeof fatherName !== 'string' || !fatherName.trim())) {
      return res.status(400).json({ error: 'fatherName must be a non-empty string' });
    }
    if (className !== undefined && (typeof className !== 'string' || !className.trim())) {
      return res.status(400).json({ error: 'class must be a non-empty string' });
    }
    if (section !== undefined && (typeof section !== 'string' || !section.trim())) {
      return res.status(400).json({ error: 'section must be a non-empty string' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || !phone.trim())) {
      return res.status(400).json({ error: 'phone must be a non-empty string' });
    }
    if (gender !== undefined && (typeof gender !== 'string' || !gender.trim())) {
      return res.status(400).json({ error: 'gender must be a non-empty string' });
    }
    if (admissionDate !== undefined && (typeof admissionDate !== 'string' || !admissionDate.trim())) {
      return res.status(400).json({ error: 'admissionDate must be a non-empty string' });
    }

    const student = await studentRepository.update(userId, admissionNo, { name, admissionNo: newAdmissionNo, fatherName, class: className, section, phone, gender, admissionDate });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Emit real-time event
    getIO(req).to('students').emit('student:updated', student);

    // Create notification
    await createNotification(req, {
      userId,
      title: 'Student Updated',
      message: `Student ${student.name} (${student.admissionNo}) has been updated`,
      type: 'info',
      entityType: 'student',
      entityId: `${userId}-${admissionNo}`
    });

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Student with this admission number already exists' });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req: Request<{ userId: string; admissionNo: string }>, res: Response<void | { error: string }>) => {
  try {
    const { userId, admissionNo } = req.params;
    if (!userId || !admissionNo) {
      return res.status(400).json({ error: 'userId and admissionNo are required' });
    }

    const student = await studentRepository.findByCompositeKey(userId, admissionNo);

    await studentRepository.delete(userId, admissionNo);

    // Emit real-time event
    getIO(req).to('students').emit('student:deleted', { userId, admissionNo });

    // Create notification
    if (student) {
      await createNotification(req, {
        userId,
        title: 'Student Deleted',
        message: `Student ${student.name} (${admissionNo}) has been deleted`,
        type: 'warning',
        entityType: 'student',
        entityId: `${userId}-${admissionNo}`
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};