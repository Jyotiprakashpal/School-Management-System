import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  notificationRepository,
  Notification,
  CreateNotificationDto,
  NotificationQuery
} from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getNotifications = async (req: Request<{}, {}, {}, NotificationQuery>, res: Response<PaginatedNotifications | { error: string }>) => {
  try {
    const userId = req.query.userId as string | undefined;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const isReadParam = req.query.isRead as string | undefined;
    const isRead = isReadParam !== undefined ? isReadParam === 'true' : undefined;
    const type = req.query.type as string | undefined;
    const entityType = req.query.entityType as string | undefined;

    const { data, total } = await notificationRepository.findMany({
      page,
      limit,
      userId,
      isRead,
      type,
      entityType
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request<{ userId: string }>, res: Response<{ count: number } | { error: string }>) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const count = await notificationRepository.findUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const createNotification = async (req: Request<{}, Notification | { error: string }, CreateNotificationDto>, res: Response<Notification | { error: string }>) => {
  try {
    const { userId, title, message, type, entityType, entityId } = req.body;

    if (!title || !message || !entityType) {
      return res.status(400).json({ error: 'Title, message, and entityType are required' });
    }

    const notification = await notificationRepository.create({
      userId,
      title,
      message,
      type: type || 'info',
      entityType,
      entityId
    });

    // Emit real-time event to specific user or all users
    const io = getIO(req);
    if (userId) {
      io.to(`user:${userId}`).emit('notification:created', notification);
    } else {
      io.to('notifications').emit('notification:created', notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

export const createBroadcastNotification = async (req: Request<{}, Notification[] | { error: string }, Omit<CreateNotificationDto, 'userId'>>, res: Response<Notification[] | { error: string }>) => {
  try {
    const { title, message, type, entityType, entityId } = req.body;

    if (!title || !message || !entityType) {
      return res.status(400).json({ error: 'Title, message, and entityType are required' });
    }

    const notifications = await notificationRepository.createForAllUsers({
      title,
      message,
      type: type || 'info',
      entityType,
      entityId
    });

    // Emit real-time event to all connected users
    getIO(req).to('notifications').emit('notification:created', notifications[0]); // Send first as sample

    res.status(201).json(notifications);
  } catch (error) {
    console.error('Create broadcast notification error:', error);
    res.status(500).json({ error: 'Failed to create broadcast notification' });
  }
};

export const markAsRead = async (req: Request<{ id: string; userId: string }>, res: Response<Notification | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { userId } = req.params;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const notification = await notificationRepository.markAsRead(id, userId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Emit real-time event
    getIO(req).to(`user:${userId}`).emit('notification:read', { id });

    res.json(notification);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request<{ userId: string }>, res: Response<{ count: number } | { error: string }>) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const count = await notificationRepository.markAllAsRead(userId);

    // Emit real-time event
    getIO(req).to(`user:${userId}`).emit('notification:allRead', { count });

    res.json({ count });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const deleteNotification = async (req: Request<{ id: string; userId: string }>, res: Response<void | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { userId } = req.params;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await notificationRepository.delete(id, userId);

    // Emit real-time event
    getIO(req).to(`user:${userId}`).emit('notification:deleted', { id });

    res.status(204).send();
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};