import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  staffRepository,
  Staff,
  CreateStaffDto,
  UpdateStaffDto,
  StaffQuery
} from '../models/Staff.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'staff';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'staff' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedStaff {
  data: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateStaffBody = (body: Partial<CreateStaffDto>): string | null => {
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Name is required';
  if (typeof body.designation !== 'string' || !body.designation.trim()) return 'Designation is required';
  if (typeof body.department !== 'string' || !body.department.trim()) return 'Department is required';
  if (typeof body.phone !== 'string' || !body.phone.trim()) return 'Phone number is required';
  if (typeof body.email !== 'string' || !body.email.trim()) return 'Email is required';
  if (!body.email.includes('@')) return 'Invalid email format';
  if (body.salary === undefined || body.salary === null || Number(body.salary) <= 0) return 'Salary must be a positive number';
  if (typeof body.joiningDate !== 'string' || !body.joiningDate.trim()) return 'Joining date is required';
  return null;
};

export const getAllStaff = async (req: Request<{}, {}, {}, StaffQuery>, res: Response<PaginatedStaff | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const department = req.query.department as string;
    const status = req.query.status as 'Active' | 'On Leave';

    const { data, total } = await staffRepository.findMany({
      page, limit, search, department, status
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

export const getStaffById = async (req: Request<{ id: string }>, res: Response<Staff | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const staff = await staffRepository.findById(id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(staff);
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
};

export const getStaffStats = async (_req: Request, res: Response<{
  total: number;
  active: number;
  onLeave: number;
  monthlyPayroll: number;
  departments: Array<{ department: string; count: number }>;
} | { error: string }>) => {
  try {
    const stats = await staffRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({ error: 'Failed to fetch staff stats' });
  }
};

export const getDepartments = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const departments = await staffRepository.getDepartments();
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const createStaff = async (req: Request<{}, Staff | { error: string }, CreateStaffDto>, res: Response<Staff | { error: string }>) => {
  try {
    const validationError = validateStaffBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingStaff = await staffRepository.findByStaffId(req.body.staffId || `EMP-${Date.now()}`);
    if (existingStaff) {
      return res.status(409).json({ error: 'Staff member with this ID already exists' });
    }

    const staff = await staffRepository.create(req.body);

    getIO(req).to('staff').emit('staff:created', staff);

    await createNotification(req, {
      title: 'Staff Member Added',
      message: `${staff.name} (${staff.staffId}) has been added as ${staff.designation}`,
      type: 'success',
      entityType: 'staff',
      entityId: staff.id.toString()
    });

    res.status(201).json(staff);
  } catch (error) {
    console.error('Create staff error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Staff member with this ID or email already exists' });
    }
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};

export const updateStaff = async (req: Request<{ id: string }, Staff | { error: string }, UpdateStaffDto>, res: Response<Staff | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    if (req.body.email && !req.body.email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const staff = await staffRepository.update(id, req.body);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    getIO(req).to('staff').emit('staff:updated', staff);

    await createNotification(req, {
      title: 'Staff Profile Updated',
      message: `${staff.name}'s profile has been updated`,
      type: 'info',
      entityType: 'staff',
      entityId: staff.id.toString()
    });

    res.json(staff);
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
};

export const updateStaffStatus = async (req: Request<{ id: string }, Staff | { error: string }, { status: 'Active' | 'On Leave' }>, res: Response<Staff | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const { status } = req.body;
    if (!['Active', 'On Leave'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const staff = await staffRepository.updateStatus(id, status);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    getIO(req).to('staff').emit('staff:status_changed', { ...staff, status });

    await createNotification(req, {
      title: 'Staff Status Changed',
      message: `${staff.name} is now marked ${staff.status.toLowerCase()}`,
      type: staff.status === 'Active' ? 'success' : 'warning',
      entityType: 'staff',
      entityId: staff.id.toString()
    });

    res.json(staff);
  } catch (error) {
    console.error('Update staff status error:', error);
    res.status(500).json({ error: 'Failed to update staff status' });
  }
};

export const deleteStaff = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const staff = await staffRepository.findById(id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await staffRepository.delete(id);

    getIO(req).to('staff').emit('staff:deleted', { id });

    await createNotification(req, {
      title: 'Staff Member Removed',
      message: `${staff.name} (${staff.staffId}) has been removed from staff directory`,
      type: 'warning',
      entityType: 'staff',
      entityId: staff.id.toString()
    });

    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
};