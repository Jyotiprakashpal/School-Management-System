import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  admissionRepository,
  Admission,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  AdmissionQuery
} from '../models/Admission.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'admission';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'admission'
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedAdmissions {
  data: Admission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateAdmissionBody = (body: Partial<CreateAdmissionDto>): string | null => {
  if (typeof body.admissionNo !== 'string' || !body.admissionNo.trim()) return 'Admission number is required';
  if (typeof body.fullName !== 'string' || !body.fullName.trim()) return 'Full name is required';
  return null;
};

export const getAllAdmissions = async (req: Request<{}, {}, {}, AdmissionQuery>, res: Response<PaginatedAdmissions | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const className = req.query.className as string;
    const section = req.query.section as string;
    const status = req.query.status as string;
    const category = req.query.category as string;

    const { data, total } = await admissionRepository.findMany({ page, limit, search, className, section, status, category });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all admissions error:', error);
    res.status(500).json({ error: 'Failed to fetch admissions' });
  }
};

export const getAdmissionById = async (req: Request<{ id: string }>, res: Response<Admission | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid admission ID' });
    }

    const admission = await admissionRepository.findById(id);
    if (!admission) {
      return res.status(404).json({ error: 'Admission not found' });
    }
    res.json(admission);
  } catch (error) {
    console.error('Get admission by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch admission' });
  }
};

export const getAdmissionByAdmissionNo = async (req: Request<{ admissionNo: string }>, res: Response<Admission | { error: string }>) => {
  try {
    const { admissionNo } = req.params;
    if (!admissionNo) {
      return res.status(400).json({ error: 'Admission number is required' });
    }

    const admission = await admissionRepository.findByAdmissionNo(admissionNo);
    if (!admission) {
      return res.status(404).json({ error: 'Admission not found' });
    }
    res.json(admission);
  } catch (error) {
    console.error('Get admission by admissionNo error:', error);
    res.status(500).json({ error: 'Failed to fetch admission' });
  }
};

export const createAdmission = async (req: Request<{}, Admission | { error: string }, CreateAdmissionDto>, res: Response<Admission | { error: string }>) => {
  try {
    const validationError = validateAdmissionBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingAdmission = await admissionRepository.findByAdmissionNo(req.body.admissionNo);
    if (existingAdmission) {
      return res.status(409).json({ error: 'Admission with this admission number already exists' });
    }

    const admission = await admissionRepository.create(req.body);

    // Emit real-time event
    getIO(req).to('admissions').emit('admission:created', admission);

    // Create notification
    await createNotification(req, {
      title: 'New Admission Registered',
      message: `Admission ${admission.fullName} (${admission.admissionNo}) registered for ${admission.className}${admission.section ? `-${admission.section}` : ''}`,
      type: 'success',
      entityType: 'admission',
      entityId: admission.admissionNo
    });

    res.status(201).json(admission);
  } catch (error) {
    console.error('Create admission error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Admission with this admission number already exists' });
    }
    res.status(500).json({ error: 'Failed to create admission' });
  }
};

export const updateAdmission = async (req: Request<{ id: string }, Admission | { error: string }, UpdateAdmissionDto>, res: Response<Admission | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid admission ID' });
    }

    const admission = await admissionRepository.update(id, req.body);

    if (!admission) {
      return res.status(404).json({ error: 'Admission not found' });
    }

    // Emit real-time event
    getIO(req).to('admissions').emit('admission:updated', admission);

    // Create notification
    await createNotification(req, {
      title: 'Admission Updated',
      message: `Admission ${admission.fullName} (${admission.admissionNo}) has been updated`,
      type: 'info',
      entityType: 'admission',
      entityId: admission.admissionNo
    });

    res.json(admission);
  } catch (error) {
    console.error('Update admission error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Admission with this admission number already exists' });
    }
    res.status(500).json({ error: 'Failed to update admission' });
  }
};

export const deleteAdmission = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid admission ID' });
    }

    const admission = await admissionRepository.findById(id);

    await admissionRepository.delete(id);

    // Emit real-time event
    getIO(req).to('admissions').emit('admission:deleted', { id });

    // Create notification
    if (admission) {
      await createNotification(req, {
        title: 'Admission Deleted',
        message: `Admission ${admission.fullName} (${admission.admissionNo}) has been deleted`,
        type: 'warning',
        entityType: 'admission',
        entityId: admission.admissionNo
      });
    }

    res.json({ message: 'Admission deleted successfully' });
  } catch (error) {
    console.error('Delete admission error:', error);
    res.status(500).json({ error: 'Failed to delete admission' });
  }
};