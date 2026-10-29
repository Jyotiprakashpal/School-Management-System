import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  backupRepository,
  BackupSettings,
  BackupRecord,
  UpdateBackupSettingsDto,
} from '../models/Backup.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

export const getBackupSettings = async (_req: Request, res: Response<BackupSettings | { error: string }>) => {
  try {
    const settings = await backupRepository.getBackupSettings();
    if (!settings) {
      return res.status(404).json({ error: 'Backup settings not found' });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get backup settings error:', error);
    res.status(500).json({ error: 'Failed to fetch backup settings' });
  }
};

export const updateBackupSettings = async (req: Request<{}, BackupSettings | { error: string }, UpdateBackupSettingsDto>, res: Response<BackupSettings | { error: string }>) => {
  try {
    const settings = await backupRepository.updateBackupSettings(req.body);
    if (!settings) {
      return res.status(404).json({ error: 'Backup settings not found' });
    }

    getIO(req).to('admin').emit('backup:settings_updated', settings);

    res.json(settings);
  } catch (error) {
    console.error('Update backup settings error:', error);
    res.status(500).json({ error: 'Failed to update backup settings' });
  }
};

export const createBackup = async (req: Request<{}, BackupRecord | { error: string }, { backupType?: 'manual' | 'automatic'; createdBy?: string }>, res: Response<BackupRecord | { error: string }>) => {
  try {
    const { backupType = 'manual', createdBy } = req.body;

    const fileName = `school_full_${new Date().toISOString().split('T')[0]}.zip`;
    const fileSize = Math.floor(Math.random() * 5000000) + 20000000; // Simulated size

    const record = await backupRepository.createBackupRecord({
      fileName,
      fileSize,
      status: 'completed',
      backupType,
      encrypted: true,
      recoveryKey: `RECOVERY_KEY_${Date.now().toString(36).toUpperCase()}`,
      createdBy: createdBy ?? null,
    });

    await backupRepository.updateLastBackupAt();

    getIO(req).to('admin').emit('backup:created', record);

    res.status(201).json(record);
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

export const getBackupRecords = async (req: Request<{}, { data: BackupRecord[]; total: number } | { error: string }, {}, { limit?: string; offset?: string }>, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

    const result = await backupRepository.getBackupRecords(limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Get backup records error:', error);
    res.status(500).json({ error: 'Failed to fetch backup records' });
  }
};

export const downloadBackup = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const record = await backupRepository.getBackupRecordById(id);
    if (!record) {
      return res.status(404).json({ error: 'Backup record not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.send(Buffer.from('Simulated backup content for ' + record.fileName));
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
};

export const restoreBackup = async (req: Request<{}, { message: string } | { error: string }, { fileName: string; recoveryKey?: string; confirmation: string }>, res: Response) => {
  try {
    const { fileName, recoveryKey, confirmation } = req.body;

    if (confirmation !== 'RESTORE') {
      return res.status(400).json({ error: 'Invalid confirmation' });
    }

    getIO(req).to('admin').emit('backup:restore_started', { fileName });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    getIO(req).to('admin').emit('backup:restore_completed', { fileName });

    res.json({ message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
};

export const downloadRecoveryKey = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const record = await backupRepository.getBackupRecordById(id);
    if (!record) {
      return res.status(404).json({ error: 'Backup record not found' });
    }

    const recoveryKey = record.recoveryKey || `RECOVERY_KEY_${Date.now().toString(36).toUpperCase()}`;

    res.setHeader('Content-Disposition', `attachment; filename="${record.fileName.replace('.zip', '')}_recovery.key"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(recoveryKey);
  } catch (error) {
    console.error('Download recovery key error:', error);
    res.status(500).json({ error: 'Failed to download recovery key' });
  }
};

export const toggleCloudBackup = async (req: Request<{}, BackupSettings | { error: string }, { connected: boolean }>, res: Response) => {
  try {
    const { connected } = req.body;

    const settings = await backupRepository.updateBackupSettings({
      googleDriveConnected: connected,
      googleDriveToken: connected ? `mock_token_${Date.now()}` : null,
    });

    if (!settings) {
      return res.status(404).json({ error: 'Backup settings not found' });
    }

    getIO(req).to('admin').emit('backup:cloud_toggled', { connected });

    res.json(settings);
  } catch (error) {
    console.error('Toggle cloud backup error:', error);
    res.status(500).json({ error: 'Failed to toggle cloud backup' });
  }
};

export const uploadToCloud = async (req: Request<{}, { message: string } | { error: string }>, res: Response) => {
  try {
    getIO(req).to('admin').emit('backup:cloud_upload_started', {});

    await new Promise((resolve) => setTimeout(resolve, 3000));

    getIO(req).to('admin').emit('backup:cloud_upload_completed', {});

    res.json({ message: 'Backup uploaded to Google Drive' });
  } catch (error) {
    console.error('Upload to cloud error:', error);
    res.status(500).json({ error: 'Failed to upload to cloud' });
  }
};