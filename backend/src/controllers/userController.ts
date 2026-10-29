import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  userRepository,
  User,
  CreateUserDto,
  UpdateUserDto,
  UserQuery
} from '../models/User.js';
import { notificationRepository } from '../models/Notification.js';
import { sendPasswordResetEmail, sendPasswordChangedNotification } from '../services/emailService.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'user';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'user'
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateUserBody = (body: Partial<CreateUserDto>): string | null => {
  if (typeof body.username !== 'string' || !body.username.trim()) return 'Username is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Name is required';
  if (typeof body.password !== 'string' || body.password.length < 6) return 'Password must be at least 6 characters';
  if (body.role && !['Superadmin', 'Admin', 'Operator', 'Accountant'].includes(body.role)) return 'Invalid role';
  if (body.status && !['Active', 'Suspended'].includes(body.status)) return 'Invalid status';
  return null;
};

const validateUpdateBody = (body: Partial<UpdateUserDto>): string | null => {
  if (body.username !== undefined && (typeof body.username !== 'string' || !body.username.trim())) return 'Username must be a non-empty string';
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) return 'Name must be a non-empty string';
  if (body.role && !['Superadmin', 'Admin', 'Operator', 'Accountant'].includes(body.role)) return 'Invalid role';
  if (body.status && !['Active', 'Suspended'].includes(body.status)) return 'Invalid status';
  if (body.password !== undefined && (typeof body.password !== 'string' || body.password.length < 6)) return 'Password must be at least 6 characters';
  return null;
};

export const getAllUsers = async (req: Request<{}, {}, {}, UserQuery>, res: Response<PaginatedUsers | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const role = req.query.role as 'Superadmin' | 'Admin' | 'Operator' | 'Accountant';
    const status = req.query.status as 'Active' | 'Suspended';

    const { data, total } = await userRepository.findMany({ page, limit, search, role, status });

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
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await userRepository.findById(id);
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
    const validationError = validateUserBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { username, name, password, role, status } = req.body;

    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this username already exists' });
    }

    const user = await userRepository.create({ username, name, password, role: role || 'Operator', status: status || 'Active' });

    getIO(req).to('users').emit('user:created', user);

    await createNotification(req, {
      title: 'New User Created',
      message: `User ${name} (${username}) has been created`,
      type: 'success',
      entityType: 'user',
      entityId: user.id.toString()
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'User with this username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request<{ id: string }, User | { error: string }, UpdateUserDto>, res: Response<User | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const validationError = validateUpdateBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const user = await userRepository.update(id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    getIO(req).to('users').emit('user:updated', user);

    await createNotification(req, {
      title: 'User Updated',
      message: `User ${user.name} (${user.username}) has been updated`,
      type: 'info',
      entityType: 'user',
      entityId: user.id.toString()
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'User with this username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await userRepository.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRepository.delete(id);

    getIO(req).to('users').emit('user:deleted', { id });

    await createNotification(req, {
      title: 'User Deleted',
      message: `User ${user.name} (${user.username}) has been deleted`,
      type: 'warning',
      entityType: 'user',
      entityId: id.toString()
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const resetPassword = async (req: Request<{}, User | { error: string }, { userId: number; newPassword: string }>, res: Response<User | { error: string }>) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await userRepository.update(userId, { password: newPassword });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    getIO(req).to('users').emit('user:updated', user);

    await createNotification(req, {
      userId: user.id.toString(),
      title: 'Password Reset',
      message: `Your password has been reset`,
      type: 'warning',
      entityType: 'user',
      entityId: user.id.toString()
    });

    res.json(user);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const getUserStats = async (_req: Request, res: Response<{
  total: number;
  active: number;
  suspended: number;
  byRole: Record<string, number>;
} | { error: string }>) => {
  try {
    const { data: users } = await userRepository.findMany({ limit: 1000 });
    const active = users.filter(u => u.status === 'Active').length;
    const suspended = users.filter(u => u.status === 'Suspended').length;
    const byRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      total: users.length,
      active,
      suspended,
      byRole
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

export const getUserActivity = async (req: Request<{}, {}, {}, { userId?: string; limit?: string }>, res: Response<any | { error: string }>) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)));

    // This would typically query an activity_log table
    // For now, return mock data structure
    res.json({
      data: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

export const getUserSessions = async (req: Request<{ userId: string }>, res: Response<any | { error: string }>) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // This would typically query a sessions table
    // For now, return mock structure
    res.json({
      currentSession: null,
      pastSessions: []
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
};

export const terminateSession = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // This would typically delete from sessions table
    // For now, just return success
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
};

export const toggleUserStatus = async (req: Request<{ id: string }, User | { error: string }, { status: 'Active' | 'Suspended' }>, res: Response<User | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { status } = req.body;
    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await userRepository.update(id, { status });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    getIO(req).to('users').emit('user:status_changed', { ...user, status });

    await createNotification(req, {
      title: 'User Status Changed',
      message: `User ${user.name} is now ${status.toLowerCase()}`,
      type: status === 'Active' ? 'success' : 'warning',
      entityType: 'user',
      entityId: user.id.toString()
    });

    res.json(user);
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const forgotPassword = async (req: Request<{}, { message: string } | { error: string }, { email: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Generate reset token
    const result = await userRepository.generateResetToken(email);
    
    if (!result) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    // Get user for email
    const user = await userRepository.findByEmail(email);
    if (user) {
      await sendPasswordResetEmail(email, result.token, user.name);
    }

    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
};

export const resetPasswordWithToken = async (req: Request<{}, User | { message: string } | { error: string }, { token: string; newPassword: string }>, res: Response<User | { message: string } | { error: string }>) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await userRepository.resetPassword(token, newPassword);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    await sendPasswordChangedNotification(user.email || '', user.name);

    getIO(req).to('users').emit('user:updated', user);

    await createNotification(req, {
      title: 'Password Reset',
      message: `Your password has been successfully reset`,
      type: 'success',
      entityType: 'user',
      entityId: user.id.toString()
    });

    res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    console.error('Reset password with token error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};