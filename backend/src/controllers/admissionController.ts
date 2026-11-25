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
import { userRepository } from '../models/User.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const getActorName = async (req: Request): Promise<string> => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';
  const userId = Number(token.match(/^session-(\d+)-/)?.[1] || 0);
  if (!userId) return 'System';
  const user = await userRepository.findById(userId);
  return user?.name || user?.username || 'System';
};

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
      entityType: 'admission',
      createdBy: await getActorName(req),
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
  if (body.mobile !== undefined && body.mobile.trim() && !/^[6-9]\d{9}$/.test(body.mobile.trim())) {
    return 'Enter a valid 10-digit Indian mobile number';
  }
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
    if (req.body.mobile?.trim()) {
      const existingMobile = await admissionRepository.findByMobile(req.body.mobile.trim());
      if (existingMobile) {
        return res.status(409).json({ error: 'A student with this mobile number already exists' });
      }
    }
    if (req.body.fatherName?.trim()) {
      const existingIdentity = await admissionRepository.findByStudentAndFather(
        req.body.fullName.trim(),
        req.body.fatherName.trim()
      );
      if (existingIdentity) {
        return res.status(409).json({ error: 'A student with this name and father name already exists' });
      }
    }

    const admission = await admissionRepository.create({
      ...req.body,
      createdBy: await getActorName(req),
    });

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

    if (req.body.mobile !== undefined) {
      if (req.body.mobile.trim() && !/^[6-9]\d{9}$/.test(req.body.mobile.trim())) {
        return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      }
      if (req.body.mobile.trim()) {
        const existingMobile = await admissionRepository.findByMobile(req.body.mobile.trim(), id);
        if (existingMobile) {
          return res.status(409).json({ error: 'A student with this mobile number already exists' });
        }
      }
    }
    if (req.body.fullName !== undefined && (typeof req.body.fullName !== 'string' || !req.body.fullName.trim())) {
      return res.status(400).json({ error: 'Full name must be a non-empty string' });
    }
    if (req.body.admissionNo !== undefined) {
      if (!req.body.admissionNo.trim()) {
        return res.status(400).json({ error: 'Admission number must be a non-empty string' });
      }
      const existingAdmission = await admissionRepository.findByAdmissionNo(req.body.admissionNo.trim());
      if (existingAdmission && existingAdmission.id !== id) {
        return res.status(409).json({ error: 'Admission with this admission number already exists' });
      }
    }

    const current = await admissionRepository.findById(id);
    if (!current) {
      return res.status(404).json({ error: 'Admission not found' });
    }
    const fullName = req.body.fullName?.trim() || current.fullName;
    const fatherName = req.body.fatherName !== undefined ? req.body.fatherName?.trim() : current.fatherName;
    if (fatherName) {
      const existingIdentity = await admissionRepository.findByStudentAndFather(fullName, fatherName, id);
      if (existingIdentity) {
        return res.status(409).json({ error: 'A student with this name and father name already exists' });
      }
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
