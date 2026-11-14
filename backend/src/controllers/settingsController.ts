import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';
import {
  settingsRepository,
  SchoolSettings,
  UpdateSettingsDto
} from '../models/Settings.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

export const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype));
  }
});

export const getSettings = async (_req: Request, res: Response<SchoolSettings | { error: string }>) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    const settings = await settingsRepository.getSettings();
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request<{}, SchoolSettings | { error: string }, UpdateSettingsDto>, res: Response<SchoolSettings | { error: string }>) => {
  try {
    const settings = await settingsRepository.updateSettings(req.body);
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Emit real-time event
    getIO(req).to('settings').emit('settings:updated', settings);

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const uploadSchoolLogo = async (req: Request, res: Response<SchoolSettings | { error: string }>) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'A PNG, JPG, or WebP logo image is required' });

    const logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const settings = await settingsRepository.updateSettings({ logo });
    if (!settings) return res.status(404).json({ error: 'Settings not found' });

    getIO(req).to('settings').emit('settings:updated', settings);
    res.json(settings);
  } catch (error) {
    console.error('Upload school logo error:', error);
    res.status(500).json({ error: 'Failed to upload school logo' });
  }
};
