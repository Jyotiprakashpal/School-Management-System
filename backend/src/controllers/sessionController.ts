import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { sessionRepository, AcademicSession, CreateSessionDto, UpdateSessionDto, SessionQuery } from '../models/Session.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'session';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'session' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedSessions {
  data: AcademicSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateSessionBody = (body: Partial<CreateSessionDto>): string | null => {
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Session name is required';
  if (typeof body.startDate !== 'string' || !body.startDate.trim()) return 'Start date is required';
  if (typeof body.endDate !== 'string' || !body.endDate.trim()) return 'End date is required';
  if (body.endDate <= body.startDate) return 'End date must be after start date';
  return null;
};

export const getAllSessions = async (req: Request<{}, {}, {}, SessionQuery>, res: Response<PaginatedSessions | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;

    const { data, total } = await sessionRepository.findMany({ page, limit, search });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getAllSessionsSimple = async (_req: Request, res: Response<AcademicSession[] | { error: string }>) => {
  try {
    const sessions = await sessionRepository.findAll();
    res.json(sessions);
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSessionById = async (req: Request<{ id: string }>, res: Response<AcademicSession | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await sessionRepository.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const getCurrentSession = async (_req: Request, res: Response<AcademicSession | { error: string }>) => {
  try {
    const session = await sessionRepository.findCurrent();
    if (!session) {
      return res.status(404).json({ error: 'No current session found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Get current session error:', error);
    res.status(500).json({ error: 'Failed to fetch current session' });
  }
};

export const createSession = async (req: Request<{}, AcademicSession | { error: string }, CreateSessionDto>, res: Response<AcademicSession | { error: string }>) => {
  try {
    const validationError = validateSessionBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingSession = await sessionRepository.findMany({ search: req.body.name, limit: 1 });
    if (existingSession.data.length > 0) {
      return res.status(409).json({ error: 'Session with this name already exists' });
    }

    const session = await sessionRepository.create(req.body);

    getIO(req).to('sessions').emit('session:created', session);

    await createNotification(req, {
      title: 'Academic Session Created',
      message: `Session "${session.name}" (${session.startDate} to ${session.endDate}) has been created`,
      type: 'success',
      entityType: 'session',
      entityId: session.id.toString()
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Session with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create session' });
  }
};

export const updateSession = async (req: Request<{ id: string }, AcademicSession | { error: string }, UpdateSessionDto>, res: Response<AcademicSession | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (req.body.name !== undefined) {
      const validationError = validateSessionBody(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const existingSession = await sessionRepository.findMany({ search: req.body.name, limit: 1 });
      if (existingSession.data.length > 0 && existingSession.data[0].id !== parseInt(req.params.id, 10)) {
        return res.status(409).json({ error: 'Session with this name already exists' });
      }
    }

    const session = await sessionRepository.update(id, req.body);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    getIO(req).to('sessions').emit('session:updated', session);

    await createNotification(req, {
      title: 'Academic Session Updated',
      message: `Session "${session.name}" has been updated`,
      type: 'info',
      entityType: 'session',
      entityId: session.id.toString()
    });

    res.json(session);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

export const setCurrentSession = async (req: Request<{ id: string }>, res: Response<AcademicSession | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await sessionRepository.setCurrent(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    getIO(req).to('sessions').emit('session:current_changed', session);

    await createNotification(req, {
      title: 'Current Session Changed',
      message: `Session "${session.name}" is now the current academic session`,
      type: 'success',
      entityType: 'session',
      entityId: session.id.toString()
    });

    res.json(session);
  } catch (error) {
    console.error('Set current session error:', error);
    res.status(500).json({ error: 'Failed to set current session' });
  }
};

export const deleteSession = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await sessionRepository.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.current) {
      return res.status(400).json({ error: 'Cannot delete the current session' });
    }

    await sessionRepository.delete(id);

    getIO(req).to('sessions').emit('session:deleted', { id });

    await createNotification(req, {
      title: 'Session Deleted',
      message: `Session "${session.name}" has been deleted`,
      type: 'warning',
      entityType: 'session',
      entityId: session.id.toString()
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};