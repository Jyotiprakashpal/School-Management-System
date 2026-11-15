import type { Request, Response } from 'express';
import { noticeRepository, type NoticeInput } from '../models/Notice.js';
import { userRepository } from '../models/User.js';

const getIO = (req: Request) => req.app.get('io');

export const getNotices = async (req: Request<{}, {}, {}, { cursor?: string; limit?: string }>, res: Response) => {
  try {
    const page = await noticeRepository.findPage(req.query.cursor, Number(req.query.limit) || 10);
    res.json(page);
  }
  catch (error) { console.error('Get notices error:', error); res.status(500).json({ error: 'Failed to fetch notices' }); }
};

export const createNotice = async (req: Request<{}, {}, NoticeInput>, res: Response) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const tokenUserId = Number(token.match(/^session-(\d+)-/)?.[1] || 0);
    const user = tokenUserId ? await userRepository.findById(tokenUserId) : null;
    const notice = await noticeRepository.create({ ...req.body, createdBy: req.body.createdBy || user?.name || user?.username || null });
    getIO(req).to('notices').emit('notice:created', notice);
    res.status(201).json(notice);
  }
  catch (error) { console.error('Create notice error:', error); res.status(500).json({ error: 'Failed to create notice' }); }
};

export const updateNotice = async (req: Request<{ id: string }, {}, NoticeInput>, res: Response) => {
  try {
    const notice = await noticeRepository.update(Number(req.params.id), req.body);
    if (!notice) return res.status(404).json({ error: 'Notice not found' });
    getIO(req).to('notices').emit('notice:updated', notice);
    res.json(notice);
  } catch (error) { console.error('Update notice error:', error); res.status(500).json({ error: 'Failed to update notice' }); }
};

export const deleteNotice = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!await noticeRepository.remove(Number(req.params.id))) return res.status(404).json({ error: 'Notice not found' });
    getIO(req).to('notices').emit('notice:deleted', { id: Number(req.params.id) });
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) { console.error('Delete notice error:', error); res.status(500).json({ error: 'Failed to delete notice' }); }
};
