import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  userRepository,
  User,
  CreateUserDto,
  UpdateUserDto,
  UserQuery
} from '../models/User.js';

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const parseUserId = (value: string): string | null => {
  if (!value || value.trim() === '') return null;
  return value.trim();
};

const validateUserBody = (body: Partial<CreateUserDto>): string | null => {
  if (typeof body.userId !== 'string' || !body.userId.trim()) return 'userId is required and must be a non-empty string';
  if (typeof body.username !== 'string' || !body.username.trim()) return 'username is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'name is required';
  if (body.role !== undefined && (typeof body.role !== 'string' || !body.role.trim())) return 'role must be a non-empty string';
  if (body.createdBy !== undefined && (typeof body.createdBy !== 'string' || !body.createdBy.trim())) return 'createdBy must be a non-empty string';
  return null;
};

export const getAllUsers = async (req: Request<{}, {}, {}, UserQuery>, res: Response<PaginatedUsers | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const role = req.query.role as string;

    const { data, total } = await userRepository.findMany({ page, limit, search, role });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: Request<{ id: string }>, res: Response<User | { error: string }>) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req: Request<{}, User | { error: string }, CreateUserDto>, res: Response<User | { error: string }>) => {
  try {
    const { userId, username, name, role, createdBy } = req.body;

    const validationError = validateUserBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingUser = await userRepository.findById(userId);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this ID already exists' });
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'User with this username already exists' });
    }

    const user = await userRepository.create({
      userId,
      username,
      name,
      role: role || 'user',
      createdBy
    });

    // Emit real-time event
    getIO(req).to('users').emit('user:created', user);

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'User with this ID or username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request<{ id: string }, User | { error: string }, UpdateUserDto>, res: Response<User | { error: string }>) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { username, name, role } = req.body;

    if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
      return res.status(400).json({ error: 'username must be a non-empty string' });
    }
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    if (role !== undefined && (typeof role !== 'string' || !role.trim())) {
      return res.status(400).json({ error: 'role must be a non-empty string' });
    }

    const user = await userRepository.update(userId, { username, name, role });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Emit real-time event
    getIO(req).to('users').emit('user:updated', user);

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'User with this username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response<void | { error: string }>) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    await userRepository.delete(userId);

    // Emit real-time event
    getIO(req).to('users').emit('user:deleted', { userId });

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};