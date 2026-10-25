import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  promotionRepository,
  PromotionBatch,
  CreatePromotionDto,
  PromotionQuery,
  PromotionMove
} from '../models/Promotion.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'promotion';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'promotion' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedPromotionHistory {
  data: PromotionBatch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validatePromotionBody = (body: Partial<CreatePromotionDto>): string | null => {
  if (typeof body.academicYear !== 'string' || !body.academicYear.trim()) return 'Academic year is required';
  if (typeof body.fromClass !== 'string' || !body.fromClass.trim()) return 'From class is required';
  if (!Array.isArray(body.moves) || body.moves.length === 0) return 'At least one student move is required';
  
  for (const move of body.moves) {
    if (!move.admissionNo || !move.name || !move.previousClass || !move.targetClass) {
      return 'Each move must have admissionNo, name, previousClass, and targetClass';
    }
    if (move.previousClass === move.targetClass) {
      return `Previous class and target class cannot be the same for ${move.name}`;
    }
  }
  return null;
};

export const getAllPromotionHistory = async (req: Request<{}, {}, {}, PromotionQuery>, res: Response<PaginatedPromotionHistory | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const academicYear = req.query.academicYear as string;
    const fromClass = req.query.fromClass as string;

    const { data, total } = await promotionRepository.findMany({ page, limit, academicYear, fromClass });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all promotion history error:', error);
    res.status(500).json({ error: 'Failed to fetch promotion history' });
  }
};

export const getPromotionStats = async (_req: Request, res: Response<{
  totalPromotions: number;
  totalBatches: number;
  latestAcademicYear: string | null;
  latestBatchCount: number;
} | { error: string }>) => {
  try {
    const stats = await promotionRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get promotion stats error:', error);
    res.status(500).json({ error: 'Failed to fetch promotion stats' });
  }
};

export const getPromotionHistoryById = async (req: Request<{ id: string }>, res: Response<PromotionBatch | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid promotion history ID' });
    }

    const batch = await promotionRepository.findById(id);
    if (!batch) {
      return res.status(404).json({ error: 'Promotion history not found' });
    }
    res.json(batch);
  } catch (error) {
    console.error('Get promotion history by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch promotion history' });
  }
};

export const createPromotion = async (req: Request<{}, PromotionBatch | { error: string }, CreatePromotionDto>, res: Response<PromotionBatch | { error: string }>) => {
  try {
    const validationError = validatePromotionBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const promotion = await promotionRepository.create(req.body);

    // Emit real-time event
    getIO(req).to('promotions').emit('promotion:created', promotion);

    // Create notification
    const studentNames = req.body.moves.map(m => m.name).join(', ');
    await createNotification(req, {
      title: 'Students Promoted',
      message: `${req.body.moves.length} students promoted from ${req.body.fromClass} for ${req.body.academicYear}: ${studentNames}`,
      type: 'success',
      entityType: 'promotion',
      entityId: promotion.id.toString()
    });

    res.status(201).json(promotion);
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
};

export const undoPromotion = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid promotion history ID' });
    }

    const promotion = await promotionRepository.findById(id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion history not found' });
    }

    await promotionRepository.delete(id);

    // Emit real-time event
    getIO(req).to('promotions').emit('promotion:deleted', { id });

    // Create notification
    const movesCount = promotion.moves?.length || 0;
    await createNotification(req, {
      title: 'Promotion Undone',
      message: `Promotion batch for ${movesCount} students from ${promotion.fromClass} has been reverted`,
      type: 'warning',
      entityType: 'promotion',
      entityId: promotion.id.toString()
    });

    res.json({ message: 'Promotion undone successfully' });
  } catch (error) {
    console.error('Undo promotion error:', error);
    res.status(500).json({ error: 'Failed to undo promotion' });
  }
};