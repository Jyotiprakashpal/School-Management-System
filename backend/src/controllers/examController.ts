import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  examRepository,
  Exam,
  CreateExamDto,
  UpdateExamDto,
  ExamQuery
} from '../models/Exam.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'exam';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'exam' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedExams {
  data: Exam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateExamBody = (body: Partial<CreateExamDto>): string | null => {
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Exam name is required';
  if (typeof body.term !== 'string' || !body.term.trim()) return 'Term is required';
  if (typeof body.session !== 'string' || !body.session.trim()) return 'Academic session is required';
  if (typeof body.classes !== 'string' || !body.classes.trim()) return 'Classes are required';
  if (typeof body.startDate !== 'string' || !body.startDate.trim()) return 'Start date is required';
  if (typeof body.endDate !== 'string' || !body.endDate.trim()) return 'End date is required';
  if (body.endDate < body.startDate) return 'End date must be after start date';
  return null;
};

export const getAllExams = async (req: Request<{}, {}, {}, ExamQuery>, res: Response<PaginatedExams | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const session = req.query.session as string;
    const status = req.query.status as 'Upcoming' | 'Active' | 'Completed';

    const { data, total } = await examRepository.findMany({ page, limit, search, session, status });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

export const getExamById = async (req: Request<{ id: string }>, res: Response<Exam | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const exam = await examRepository.findById(id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    res.json(exam);
  } catch (error) {
    console.error('Get exam by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
};

export const getExamStats = async (_req: Request, res: Response<{
  total: number;
  upcoming: number;
  active: number;
  completed: number;
} | { error: string }>) => {
  try {
    const stats = await examRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get exam stats error:', error);
    res.status(500).json({ error: 'Failed to fetch exam stats' });
  }
};

export const getActiveOrNextExam = async (_req: Request, res: Response<Exam | { error: string } | null>) => {
  try {
    const exam = await examRepository.getActiveOrNext();
    res.json(exam);
  } catch (error) {
    console.error('Get active/next exam error:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
};

export const createExam = async (req: Request<{}, Exam | { error: string }, CreateExamDto>, res: Response<Exam | { error: string }>) => {
  try {
    const validationError = validateExamBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingExam = await examRepository.findByNameSession(req.body.name, req.body.session);
    if (existingExam) {
      return res.status(409).json({ error: 'Exam with this name and session already exists' });
    }

    const exam = await examRepository.create(req.body);

    getIO(req).to('exams').emit('exam:created', exam);

    await createNotification(req, {
      title: 'Exam Created',
      message: `Exam "${exam.name}" has been created for ${exam.session}`,
      type: 'success',
      entityType: 'exam',
      entityId: exam.id.toString()
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Exam with this name and session already exists' });
    }
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

export const updateExam = async (req: Request<{ id: string }, Exam | { error: string }, UpdateExamDto>, res: Response<Exam | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    if (req.body.startDate && req.body.endDate && req.body.endDate < req.body.startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const exam = await examRepository.update(id, req.body);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    getIO(req).to('exams').emit('exam:updated', exam);

    await createNotification(req, {
      title: 'Exam Updated',
      message: `Exam "${exam.name}" has been updated`,
      type: 'info',
      entityType: 'exam',
      entityId: exam.id.toString()
    });

    res.json(exam);
  } catch (error) {
    console.error('Update exam error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Exam with this name and session already exists' });
    }
    res.status(500).json({ error: 'Failed to update exam' });
  }
};

export const changeExamStatus = async (req: Request<{ id: string }, Exam | { error: string }, { status: 'Upcoming' | 'Active' | 'Completed' }>, res: Response<Exam | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const { status } = req.body;
    if (!['Upcoming', 'Active', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const exam = await examRepository.update(id, { status });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    getIO(req).to('exams').emit('exam:status_changed', { ...exam, status });

    await createNotification(req, {
      title: 'Exam Status Changed',
      message: `Exam "${exam.name}" is now marked ${status.toLowerCase()}`,
      type: status === 'Active' ? 'info' : status === 'Completed' ? 'success' : 'warning',
      entityType: 'exam',
      entityId: exam.id.toString()
    });

    res.json(exam);
  } catch (error) {
    console.error('Change exam status error:', error);
    res.status(500).json({ error: 'Failed to change exam status' });
  }
};

export const duplicateExam = async (req: Request<{ id: string }, Exam | { error: string }>, res: Response<Exam | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const exam = await examRepository.findById(id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const duplicatedExam = await examRepository.create({
      name: `${exam.name} (Copy)`,
      term: exam.term,
      session: exam.session,
      classes: exam.classes,
      startDate: exam.startDate,
      endDate: exam.endDate,
      status: 'Upcoming'
    });

    getIO(req).to('exams').emit('exam:created', duplicatedExam);

    await createNotification(req, {
      title: 'Exam Duplicated',
      message: `A copy of "${exam.name}" was created as "${duplicatedExam.name}"`,
      type: 'info',
      entityType: 'exam',
      entityId: duplicatedExam.id.toString()
    });

    res.status(201).json(duplicatedExam);
  } catch (error) {
    console.error('Duplicate exam error:', error);
    res.status(500).json({ error: 'Failed to duplicate exam' });
  }
};

export const deleteExam = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const exam = await examRepository.findById(id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await examRepository.delete(id);

    getIO(req).to('exams').emit('exam:deleted', { id });

    await createNotification(req, {
      title: 'Exam Deleted',
      message: `Exam "${exam.name}" has been deleted`,
      type: 'warning',
      entityType: 'exam',
      entityId: exam.id.toString()
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};