import { Request, Response } from 'express';
import {
  settingsRepository,
  SchoolSettings,
  UpdateSettingsDto
} from '../models/Settings.js';

export const getSettings = async (_req: Request, res: Response<SchoolSettings | { error: string }>) => {
  try {
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
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};