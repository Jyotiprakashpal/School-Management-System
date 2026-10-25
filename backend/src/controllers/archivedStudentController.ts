import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  archivedStudentRepository,
  ArchivedStudent,
  CreateArchivedStudentDto,
  UpdateArchivedStudentDto,
  ArchivedStudentQuery
} from '../models/ArchivedStudent.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'archived_student';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'archived_student' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedArchivedStudents {
  data: ArchivedStudent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateArchivedStudentBody = (body: Partial<CreateArchivedStudentDto>): string | null => {
  if (typeof body.admissionNo !== 'string' || !body.admissionNo.trim()) return 'Admission number is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Student name is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Last class is required';
  return null;
};

export const getAllArchivedStudents = async (req: Request<{}, {}, {}, ArchivedStudentQuery>, res: Response<PaginatedArchivedStudents | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const passingYear = req.query.passingYear as string;
    const className = req.query.className as string;
    const reason = req.query.reason as string;

    const { data, total } = await archivedStudentRepository.findMany({ page, limit, search, passingYear, className, reason });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all archived students error:', error);
    res.status(500).json({ error: 'Failed to fetch archived students' });
  }
};

export const getArchivedStudentById = async (req: Request<{ id: string }>, res: Response<ArchivedStudent | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid archive ID' });
    }

    const student = await archivedStudentRepository.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Archived student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get archived student by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch archived student' });
  }
};

export const getArchivedStudentByAdmissionNo = async (req: Request<{ admissionNo: string }>, res: Response<ArchivedStudent | { error: string }>) => {
  try {
    const { admissionNo } = req.params;
    if (!admissionNo) {
      return res.status(400).json({ error: 'Admission number is required' });
    }

    const student = await archivedStudentRepository.findByAdmissionNo(admissionNo);
    if (!student) {
      return res.status(404).json({ error: 'Archived student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get archived student by admissionNo error:', error);
    res.status(500).json({ error: 'Failed to fetch archived student' });
  }
};

export const getArchivedStudentByTcNumber = async (req: Request<{ tcNumber: string }>, res: Response<ArchivedStudent | { error: string }>) => {
  try {
    const { tcNumber } = req.params;
    if (!tcNumber) {
      return res.status(400).json({ error: 'TC number is required' });
    }

    const student = await archivedStudentRepository.findByTcNumber(tcNumber);
    if (!student) {
      return res.status(404).json({ error: 'Archived student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get archived student by TC number error:', error);
    res.status(500).json({ error: 'Failed to fetch archived student' });
  }
};

export const getArchivedStudentsStats = async (_req: Request, res: Response<{
  totalArchived: number;
  latestYear: string | null;
  latestYearCount: number;
  tcIssuedCount: number;
  passedOutCount: number;
  otherReasonsCount: number;
} | { error: string }>) => {
  try {
    const stats = await archivedStudentRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get archived students stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getArchivedStudentsYears = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const years = await archivedStudentRepository.getYears();
    res.json(years);
  } catch (error) {
    console.error('Get archived students years error:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
};

export const createArchivedStudent = async (req: Request<{}, ArchivedStudent | { error: string }, CreateArchivedStudentDto>, res: Response<ArchivedStudent | { error: string }>) => {
  try {
    const validationError = validateArchivedStudentBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingStudent = await archivedStudentRepository.findByAdmissionNo(req.body.admissionNo);
    if (existingStudent) {
      return res.status(409).json({ error: 'Archived student with this admission number already exists' });
    }

    if (req.body.tcNumber) {
      const existingTc = await archivedStudentRepository.findByTcNumber(req.body.tcNumber);
      if (existingTc) {
        return res.status(409).json({ error: 'Archived student with this TC number already exists' });
      }
    }

    const student = await archivedStudentRepository.create(req.body);

    // Emit real-time event
    getIO(req).to('archived_students').emit('archived_student:created', student);

    // Create notification
    await createNotification(req, {
      title: 'Student Archived',
      message: `Student ${student.name} (${student.admissionNo}) has been archived`,
      type: 'success',
      entityType: 'archived_student',
      entityId: student.admissionNo
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Create archived student error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Archived student with this admission number or TC number already exists' });
    }
    res.status(500).json({ error: 'Failed to create archived student' });
  }
};

export const updateArchivedStudent = async (req: Request<{ id: string }, ArchivedStudent | { error: string }, UpdateArchivedStudentDto>, res: Response<ArchivedStudent | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid archive ID' });
    }

    const student = await archivedStudentRepository.update(id, req.body);

    if (!student) {
      return res.status(404).json({ error: 'Archived student not found' });
    }

    // Emit real-time event
    getIO(req).to('archived_students').emit('archived_student:updated', student);

    // Create notification
    await createNotification(req, {
      title: 'Archive Record Updated',
      message: `Archive record for ${student.name} (${student.admissionNo}) has been updated`,
      type: 'info',
      entityType: 'archived_student',
      entityId: student.admissionNo
    });

    res.json(student);
  } catch (error) {
    console.error('Update archived student error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Archive record with this admission number or TC number already exists' });
    }
    res.status(500).json({ error: 'Failed to update archived student' });
  }
};

export const deleteArchivedStudent = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid archive ID' });
    }

    const student = await archivedStudentRepository.findById(id);

    await archivedStudentRepository.delete(id);

    // Emit real-time event
    getIO(req).to('archived_students').emit('archived_student:deleted', { id });

    // Create notification
    if (student) {
      await createNotification(req, {
        title: 'Archive Record Deleted',
        message: `Archive record for ${student.name} (${student.admissionNo}) has been deleted`,
        type: 'warning',
        entityType: 'archived_student',
        entityId: student.admissionNo
      });
    }

    res.json({ message: 'Archived student deleted successfully' });
  } catch (error) {
    console.error('Delete archived student error:', error);
    res.status(500).json({ error: 'Failed to delete archived student' });
  }
};