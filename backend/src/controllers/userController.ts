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
import { sendPasswordResetEmail } from '../services/emailService.js';
import { userSessionRepository } from '../models/UserSession.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

function parseDevice(userAgent: string): string {
  const browser = userAgent.includes('Edg/') ? 'Edge' : userAgent.includes('Chrome/') ? 'Chrome' : userAgent.includes('Firefox/') ? 'Firefox' : userAgent.includes('Safari/') ? 'Safari' : 'Browser';
  const platform = /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS' : /Windows/i.test(userAgent) ? 'Windows' : /Mac OS/i.test(userAgent) ? 'macOS' : /Linux/i.test(userAgent) ? 'Linux' : 'Unknown';
  return `${browser} · ${platform}`;
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password, device, location } = req.body as { username?: string; password?: string; device?: string; location?: string };
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await userRepository.authenticate(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    await userRepository.updateLastLogin(user.id);
    const token = `session-${user.id}-${Date.now()}`;
    const userAgent = String(req.headers['user-agent'] || 'Unknown device');
    const detectedDevice = typeof device === 'string' && device.trim() ? device.trim() : parseDevice(userAgent);
    const detectedLocation = typeof location === 'string' && location.trim() ? location.trim() : 'Unknown location';
    await userSessionRepository.create({ userId: user.id, token, device: detectedDevice, location: detectedLocation });
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to sign in' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const match = /^session-(\d+)-\d+$/.exec(token);
    const userId = match ? Number(match[1]) : 0;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!userId) return res.status(401).json({ error: 'You must be signed in to change your password' });
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from your current password' });
    }

    const user = await userRepository.findById(userId);
    if (!user || !await userRepository.authenticate(user.username, currentPassword)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const updatedUser = await userRepository.update(userId, { password: newPassword });
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    getIO(req).to('users').emit('user:updated', updatedUser);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

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
  if (body.email !== undefined && (typeof body.email !== 'string' || !body.email.trim() || !body.email.includes('@'))) return 'Valid email address is required';
  if (body.role && !['Superadmin', 'Admin', 'Operator', 'Accountant', 'Student', 'Teacher'].includes(body.role)) return 'Invalid role';
  if (body.status && !['Active', 'Suspended'].includes(body.status)) return 'Invalid status';
  return null;
};

const validateUpdateBody = (body: Partial<UpdateUserDto>): string | null => {
  if (body.username !== undefined && (typeof body.username !== 'string' || !body.username.trim())) return 'Username must be a non-empty string';
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) return 'Name must be a non-empty string';
  if (body.email !== undefined && body.email !== null && (typeof body.email !== 'string' || !body.email.trim() || !body.email.includes('@'))) return 'Valid email address is required';
  if (body.role && !['Superadmin', 'Admin', 'Operator', 'Accountant', 'Student', 'Teacher'].includes(body.role)) return 'Invalid role';
  if (body.status && !['Active', 'Suspended'].includes(body.status)) return 'Invalid status';
  if (body.password !== undefined && (typeof body.password !== 'string' || body.password.length < 6)) return 'Password must be at least 6 characters';
  return null;
};

export const getAllUsers = async (req: Request<{}, {}, {}, UserQuery>, res: Response<PaginatedUsers | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const role = req.query.role as 'Superadmin' | 'Admin' | 'Operator' | 'Accountant' | 'Student' | 'Teacher';
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

    const { username, name, password, email, role, status, createdBy } = req.body;

    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this username already exists' });
    }

    if (email) {
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    }

    const user = await userRepository.create({ username, name, password, email, role: role || 'Operator', status: status || 'Active', createdBy });

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

export const getUserActivity = async (req: Request<{}, {}, {}, { userId?: string; limit?: string; cursor?: string }>, res: Response<any | { error: string }>) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)));
    const cursor = req.query.cursor || undefined;

    let notifications = await notificationRepository.findMany({
      limit,
      userId: userId ? String(userId) : undefined,
      cursor,
    });
    if (notifications.total === 0 && !userId && !cursor) {
      await notificationRepository.seedActivity();
      notifications = await notificationRepository.findMany({ limit });
    }

    const users = await userRepository.findMany({ limit: 100 });
    const userNames = new Map<string, string>();
    users.data.forEach((user) => {
      userNames.set(String(user.id), user.name);
      userNames.set(user.userId, user.name);
    });
    res.json({
      data: notifications.data.map((item) => ({
        user: userNames.get(item.createdBy || '') || userNames.get(item.userId || '') || item.createdBy || 'System',
        action: item.title || 'Account activity',
        target: item.message || 'An account change was recorded',
        date: item.createdAt,
        type: item.type,
      })),
      total: notifications.total,
      page: 1,
      limit,
      totalPages: Math.ceil(notifications.total / limit),
      nextCursor: notifications.data.length === limit
        ? notifications.data[notifications.data.length - 1].createdAt.toISOString()
        : null,
      hasMore: notifications.data.length === limit,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

export const getUserSessions = async (req: Request<{}, {}, {}, { cursor?: string; limit?: string }>, res: Response<any | { error: string }>) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const sessions = await userSessionRepository.findPage(req.query.cursor, limit);
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const data = sessions.data.map(({ token: sessionToken, ...session }) => ({ ...session, current: sessionToken === token }));
    res.json({ data, hasMore: sessions.hasMore, nextCursor: data.length > 0 ? data[data.length - 1].lastActive : null });
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

    const terminated = await userSessionRepository.terminate(id);
    if (!terminated) return res.status(404).json({ error: 'Session not found' });
    getIO(req).to('users').emit('user:session_terminated', { id });
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
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Look up the account before generating a token. This prevents reset tokens
    // from being created for email addresses that are not in the users table.
    const user = await userRepository.findByEmail(email);
    if (!user || !user.email) {
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    const result = await userRepository.generateResetToken(email);
    if (!result) {
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    await sendPasswordResetEmail(user.email, result.token, user.name);

    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
};

