import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  adminSettingsRepository,
  AdminSettings,
  Backup,
  CreateBackupDto,
  UpdateAdminSettingsDto,
  BackupQuery,
} from '../models/AdminSettings.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'admin_settings' | 'backup';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: data.entityType as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedBackups {
  data: Backup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateBackupBody = (body: Partial<CreateBackupDto>): string | null => {
  if (body.type && !['full', 'incremental', 'manual'].includes(body.type)) {
    return 'Invalid backup type';
  }
  return null;
};

export const getAdminSettings = async (req: Request, res: Response<AdminSettings | { error: string }>) => {
  try {
    const settings = await adminSettingsRepository.getSettings();
    if (!settings) {
      return res.status(404).json({ error: 'Admin settings not found' });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Failed to fetch admin settings' });
  }
};

export const updateAdminSettings = async (req: Request<{}, AdminSettings | { error: string }, UpdateAdminSettingsDto>, res: Response<AdminSettings | { error: string }>) => {
  try {
    const settings = await adminSettingsRepository.updateSettings(req.body);
    getIO(req).to('admin_settings').emit('settings:updated', settings);

    await createNotification(req, {
      title: 'Admin Settings Updated',
      message: 'Admin settings have been updated',
      type: 'info',
      entityType: 'admin_settings',
      entityId: '1'
    });

    res.json(settings);
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Failed to update admin settings' });
  }
};

export const getBackups = async (req: Request<{}, {}, {}, BackupQuery>, res: Response<{ data: Backup[]; total: number; page: number; limit: number; totalPages: number } | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const status = req.query.status as 'completed' | 'failed' | 'in_progress';
    const type = req.query.type as 'full' | 'incremental' | 'manual' | 'scheduled';

    const { data, total } = await adminSettingsRepository.getBackups({ page, limit, status, type });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
};

export const getBackupStats = async (_req: Request, res: Response<any | { error: string }>) => {
  try {
    const stats = await adminSettingsRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get backup stats error:', error);
    res.status(500).json({ error: 'Failed to fetch backup stats' });
  }
};

export const createBackup = async (req: Request<{}, any | { error: string }, CreateBackupDto>, res: Response<any | { error: string }>) => {
  try {
    const validationError = validateBackupBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create initial backup record
    const backup = await adminSettingsRepository.createBackup({ type: req.body.type || 'manual' });

    getIO(req).to('backups').emit('backup:created', backup);

    // Simulate backup process
    setTimeout(async () => {
      try {
        const { name, size } = await adminSettingsRepository.generateBackupFile();
        
        await adminSettingsRepository.updateBackup(backup.id, {
          name: backup.name,
          size,
          status: 'completed',
          filePath: `/backups/${backup.name}.zip`,
          encryptionKey: 'enc_' + Math.random().toString(36).substring(2, 15),
        });

        await adminSettingsRepository.updateLastBackup(backup.size);

        getIO(req).to('backups').emit('backup:completed', { id: backup.id, name: backup.name, size });

        await createNotification(req, {
          title: 'Backup Completed',
          message: `Backup "${backup.name}" (${backup.size}) completed successfully`,
          type: 'success',
          entityType: 'backup',
          entityId: backup.id.toString()
        });

        getIO(req).to('admin_settings').emit('stats:updated', await adminSettingsRepository.getStats());
      } catch (error) {
        console.error('Backup completion error:', error);
        await adminSettingsRepository.updateBackup(backup.id, { status: 'failed' });
        getIO(req).to('backups').emit('backup:failed', { id: backup.id });
      }
    }, 2000);

    res.status(201).json(backup);
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

export const getBackupById = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const backup = await adminSettingsRepository.getBackupById(id);
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    res.json(backup);
  } catch (error) {
    console.error('Get backup by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch backup' });
  }
};

export const updateBackup = async (req: Request<{ id: string }, any | { error: string }, Partial<any>>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const backup = await adminSettingsRepository.updateBackup(id, req.body);
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    getIO(req).to('backups').emit('backup:updated', backup);
    res.json(backup);
  } catch (error) {
    console.error('Update backup error:', error);
    res.status(500).json({ error: 'Failed to update backup' });
  }
};

export const deleteBackup = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const backup = await adminSettingsRepository.getBackupById(id);
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    await adminSettingsRepository.deleteBackup(id);

    getIO(req).to('backups').emit('backup:deleted', { id });

    await createNotification(req, {
      title: 'Backup Deleted',
      message: `Backup "${backup.name}" has been deleted`,
      type: 'warning',
      entityType: 'backup',
      entityId: backup.id.toString()
    });

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
};

export const generateRecoveryKey = async (req: Request, res: Response<{ recoveryKey: string } | { error: string }>) => {
  try {
    const key = await adminSettingsRepository.generateRecoveryKey();
    res.json({ recoveryKey: key });
  } catch (error) {
    console.error('Generate recovery key error:', error);
    res.status(500).json({ error: 'Failed to generate recovery key' });
  }
};

export const updateCloudConnection = async (req: Request<{}, any, { connected: boolean }>, res: Response<any | { error: string }>) => {
  try {
    const { connected } = req.body;
    await adminSettingsRepository.updateCloudConnection(connected);
    res.json({ connected });
  } catch (error) {
    console.error('Update cloud connection error:', error);
    res.status(500).json({ error: 'Failed to update cloud connection' });
  }
};

export const updateEmailSettings = async (req: Request<{}, any, { sender: string; appPassword: string; recipients: string; server: string; port: number }>, res: Response<any | { error: string }>) => {
  try {
    const { sender, appPassword, recipients, server, port } = req.body;
    
    await adminSettingsRepository.updateSettings({
      emailBackupEnabled: true,
      emailSender: sender,
      emailAppPassword: appPassword,
      emailRecipients: recipients,
      mailServer: server,
      mailPort: port,
    });

    res.json({ message: 'Email settings updated successfully' });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
};

export const getAdminStats = async (_req: Request, res: Response<any | { error: string }>) => {
  try {
    const stats = await adminSettingsRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};