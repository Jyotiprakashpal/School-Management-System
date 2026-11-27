import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';
import {
  settingsRepository,
  SchoolSettings,
  UpdateSettingsDto
} from '../models/Settings.js';
import { sessionRepository, type AcademicSession } from '../models/Session.js';
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

const createSettingsNotification = async (req: Request, title: string, message: string, createdBy: string) => {
  try {
    const notification = await notificationRepository.create({
      title,
      message,
      type: 'info',
      entityType: 'settings',
      entityId: '1',
      createdBy,
    });
    getIO(req).to('notifications').emit('notification:created', notification);
  } catch (error) {
    console.error('Failed to create settings notification:', error);
  }
};

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
    const actorName = await getActorName(req);
    let selectedSession: AcademicSession | null = null;
    let shouldSetCurrent = false;
    if (req.body.academicYear !== undefined) {
      const currentSettings = await settingsRepository.getSettings();
      if (!currentSettings) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      selectedSession = await sessionRepository.findByName(req.body.academicYear);
      if (selectedSession) {
        shouldSetCurrent = !selectedSession.current || currentSettings.academicYear !== selectedSession.name;
      } else if (req.body.academicYear !== currentSettings.academicYear) {
        return res.status(400).json({ error: 'Academic session not found' });
      }
    }

    const settings = await settingsRepository.updateSettings({ ...req.body, createdBy: actorName });
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const updatedSession = shouldSetCurrent && selectedSession
      ? await sessionRepository.setCurrent(selectedSession.id)
      : null;
    if (shouldSetCurrent && !updatedSession) {
      return res.status(404).json({ error: 'Academic session not found' });
    }

    if (updatedSession) {
      getIO(req).to('sessions').emit('session:current_changed', updatedSession);
    }

    // Emit real-time event
    getIO(req).to('settings').emit('settings:updated', settings);
    await createSettingsNotification(req, 'School Settings Updated', `${actorName} updated the school settings`, actorName);

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
    const actorName = await getActorName(req);
    const settings = await settingsRepository.updateSettings({ logo, createdBy: actorName });
    if (!settings) return res.status(404).json({ error: 'Settings not found' });

    getIO(req).to('settings').emit('settings:updated', settings);
    await createSettingsNotification(req, 'School Logo Updated', `${actorName} updated the school logo`, actorName);
    res.json(settings);
  } catch (error) {
    console.error('Upload school logo error:', error);
    res.status(500).json({ error: 'Failed to upload school logo' });
  }
};
