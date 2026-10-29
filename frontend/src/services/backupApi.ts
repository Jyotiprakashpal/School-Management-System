const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export interface BackupSettings {
  id: number;
  automaticBackup: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';
  lastBackupAt: string | null;
  googleDriveConnected: boolean;
  googleDriveToken: string | null;
  emailBackupEnabled: boolean;
  senderEmail: string | null;
  appPassword: string | null;
  backupRecipients: string | null;
  mailServer: string | null;
  mailPort: number | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupRecord {
  id: number;
  fileName: string;
  fileSize: number;
  status: 'completed' | 'failed' | 'in_progress';
  backupType: 'manual' | 'automatic' | 'cloud';
  encrypted: boolean;
  recoveryKey: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PaginatedBackupRecords {
  data: BackupRecord[];
  total: number;
}

export const backupApi = {
  async getBackupSettings(): Promise<BackupSettings> {
    return fetchApi<BackupSettings>(`/backup/settings`);
  },

  async updateBackupSettings(data: Partial<BackupSettings>): Promise<BackupSettings> {
    return fetchApi<BackupSettings>(`/backup/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async createBackup(backupType: 'manual' | 'automatic' = 'manual', createdBy?: string): Promise<BackupRecord> {
    return fetchApi<BackupRecord>(`/backup`, {
      method: 'POST',
      body: JSON.stringify({ backupType, createdBy }),
    });
  },

  async getBackupRecords(limit = 50, offset = 0): Promise<PaginatedBackupRecords> {
    return fetchApi<PaginatedBackupRecords>(`/backup/records?limit=${limit}&offset=${offset}`);
  },

  async downloadBackup(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE}/backup/records/${id}/download`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.blob();
  },

  async restoreBackup(fileName: string, recoveryKey: string | undefined, confirmation: string): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/backup/restore`, {
      method: 'POST',
      body: JSON.stringify({ fileName, recoveryKey, confirmation }),
    });
  },

  async downloadRecoveryKey(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE}/backup/records/${id}/recovery-key`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.blob();
  },

  async toggleCloudBackup(connected: boolean): Promise<BackupSettings> {
    return fetchApi<BackupSettings>(`/backup/cloud/toggle`, {
      method: 'POST',
      body: JSON.stringify({ connected }),
    });
  },

  async uploadToCloud(): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/backup/cloud/upload`, {
      method: 'POST',
    }),
  },
};