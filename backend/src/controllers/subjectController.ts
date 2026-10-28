import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  subjectRepository,
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQuery
} from '../models/Subject.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'subject';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'subject' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedSubjects {
  data: Subject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateSubjectBody = (body: Partial<CreateSubjectDto>): string | null => {
  if (typeof body.code !== 'string' || !body.code.trim()) return 'Subject code is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Subject name is required';
  if (typeof body.classes !== 'string' || !body.classes.trim()) return 'Class coverage is required';
  if (body.teachers === undefined || body.teachers === null || Number(body.teachers) < 0) return 'Number of teachers must be non-negative';
  if (body.type && !['Core', 'Language', 'Elective', 'Activity'].includes(body.type)) return 'Invalid subject type';
  if (body.status && !['Active', 'Inactive'].includes(body.status)) return 'Invalid status';
  return null;
};

export const getAllSubjects = async (req: Request<{}, {}, {}, SubjectQuery>, res: Response<PaginatedSubjects | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const { data, total } = await subjectRepository.findMany({ page, limit, search, type, status });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

export const getSubjectById = async (req: Request<{ id: string }>, res: Response<Subject | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }

    const subject = await subjectRepository.findById(id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
};

export const getSubjectByCode = async (req: Request<{ code: string }>, res: Response<Subject | { error: string }>) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Subject code is required' });
    }

    const subject = await subjectRepository.findByCode(code);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Get subject by code error:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
};

export const getSubjectStats = async (_req: Request, res: Response<{
  total: number;
  byType: Record<string, number>;
  active: number;
  totalTeachers: number;
} | { error: string }>) => {
  try {
    const stats = await subjectRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get subject stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getSubjectTypes = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const types = await subjectRepository.getTypes();
    res.json(types);
  } catch (error) {
    console.error('Get subject types error:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
};

export const getSubjectStatuses = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const statuses = await subjectRepository.getStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Get subject statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
};

export const createSubject = async (req: Request<{}, Subject | { error: string }, CreateSubjectDto>, res: Response<Subject | { error: string }>) => {
  try {
    const validationError = validateSubjectBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingSubject = await subjectRepository.findByCode(req.body.code);
    if (existingSubject) {
      return res.status(409).json({ error: 'Subject with this code already exists' });
    }

    const subject = await subjectRepository.create(req.body);

    getIO(req).to('subjects').emit('subject:created', subject);

    await createNotification(req, {
      title: 'Subject Created',
      message: `Subject "${subject.name}" (${subject.code}) has been added`,
      type: 'success',
      entityType: 'subject',
      entityId: subject.id.toString()
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Create subject error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Subject with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

export const updateSubject = async (req: Request<{ id: string }, Subject | { error: string }, UpdateSubjectDto>, res: Response<Subject | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }

    if (req.body.code) {
      const existingSubject = await subjectRepository.findByCode(req.body.code);
      if (existingSubject && existingSubject.id !== id) {
        return res.status(409).json({ error: 'Subject with this code already exists' });
      }
    }

    const subject = await subjectRepository.update(id, req.body);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    getIO(req).to('subjects').emit('subject:updated', subject);

    await createNotification(req, {
      title: 'Subject Updated',
      message: `Subject "${subject.name}" (${subject.code}) has been updated`,
      type: 'info',
      entityType: 'subject',
      entityId: subject.id.toString()
    });

    res.json(subject);
  } catch (error) {
    console.error('Update subject error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Subject with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to update subject' });
  }
};

export const toggleSubjectStatus = async (req: Request<{ id: string }, Subject | { error: string }>, res: Response<Subject | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }

    const subject = await subjectRepository.findById(id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const newStatus = subject.status === 'Active' ? 'Inactive' : 'Active';
    const updatedSubject = await subjectRepository.update(id, { status: newStatus });
    if (!updatedSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    getIO(req).to('subjects').emit('subject:updated', updatedSubject);

    await createNotification(req, {
      title: 'Subject Status Changed',
      message: `Subject "${updatedSubject.name}" is now ${updatedSubject.status.toLowerCase()}`,
      type: updatedSubject.status === 'Active' ? 'success' : 'warning',
      entityType: 'subject',
      entityId: updatedSubject.id.toString()
    });

    res.json(updatedSubject);
  } catch (error) {
    console.error('Toggle subject status error:', error);
    res.status(500).json({ error: 'Failed to toggle subject status' });
  }
};

export const duplicateSubject = async (req: Request<{ id: string }, Subject | { error: string }>, res: Response<Subject | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }

    const subject = await subjectRepository.findById(id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    let code = `${subject.code}-COPY`;
    while (await subjectRepository.findByCode(code)) {
      code += '2';
    }

    const duplicatedSubject = await subjectRepository.create({
      code,
      name: `${subject.name} (Copy)`,
      type: subject.type,
      classes: subject.classes,
      teachers: subject.teachers,
      status: 'Active',
    });

    getIO(req).to('subjects').emit('subject:created', duplicatedSubject);

    await createNotification(req, {
      title: 'Subject Duplicated',
      message: `A copy of "${subject.name}" was created as "${duplicatedSubject.name}"`,
      type: 'info',
      entityType: 'subject',
      entityId: duplicatedSubject.id.toString()
    });

    res.status(201).json(duplicatedSubject);
  } catch (error) {
    console.error('Duplicate subject error:', error);
    res.status(500).json({ error: 'Failed to duplicate subject' });
  }
};

export const deleteSubject = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }

    const subject = await subjectRepository.findById(id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await subjectRepository.delete(id);

    getIO(req).to('subjects').emit('subject:deleted', { id });

    await createNotification(req, {
      title: 'Subject Deleted',
      message: `Subject "${subject.name}" (${subject.code}) has been deleted`,
      type: 'warning',
      entityType: 'subject',
      entityId: subject.id.toString()
    });

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};