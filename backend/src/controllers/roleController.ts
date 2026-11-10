import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  roleRepository,
  Role,
  CreateRoleDto,
  UpdateRoleDto
} from '../models/Role.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer | undefined => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'role';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'role'
    });
    getIO(req)?.to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req)?.to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedRoles {
  data: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllRoles = async (req: Request<{}, {}, {}, { page?: string; limit?: string; search?: string }>, res: Response<{ data: Role[]; total: number; page: number; limit: number; totalPages: number } | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search?.trim();

    const { data, total } = await roleRepository.findMany({ page, limit, search });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const getRoleById = async (req: Request<{ id: string }>, res: Response<{ data: Role } | { error: string }>) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    const role = await roleRepository.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ data: role });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
};

export const createRole = async (req: Request<{}, { data: Role } | { error: string }, { roleName: string; createdBy?: string }>, res: Response<{ data: Role } | { error: string }>) => {
  try {
    const { roleName, createdBy } = req.body;

    if (!roleName || !roleName.trim()) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const normalizedRoleName = roleName.trim();
    const existingRole = await roleRepository.findByName(normalizedRoleName);
    if (existingRole) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    const role = await roleRepository.create({ roleName: normalizedRoleName, createdBy });

    await createNotification(req, {
      title: 'Role created',
      message: `Role "${role.roleName}" was created.`,
      type: 'success',
      entityType: 'role',
      entityId: role.roleId
    });

    res.status(201).json({ data: role });
  } catch (error) {
    console.error('Create role error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req: Request<{ id: string }, { data: Role } | { error: string }, { roleName?: string }>, res: Response<{ data: Role } | { error: string }>) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    const { roleName } = req.body || {};
    if (roleName !== undefined && (!roleName || !roleName.trim())) {
      return res.status(400).json({ error: 'Role name cannot be empty' });
    }

    const role = await roleRepository.update(id, { roleName: roleName?.trim() });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    await createNotification(req, {
      title: 'Role updated',
      message: `Role "${role.roleName}" was updated.`,
      type: 'info',
      entityType: 'role',
      entityId: role.roleId
    });
    res.json({ data: role });
  } catch (error) {
    console.error('Update role error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteRole = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    const role = await roleRepository.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await roleRepository.delete(id);
    await createNotification(req, {
      title: 'Role deleted',
      message: `Role "${role.roleName}" was deleted.`,
      type: 'warning',
      entityType: 'role',
      entityId: role.roleId
    });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};
