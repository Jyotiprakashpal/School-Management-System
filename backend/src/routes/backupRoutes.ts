import { Router } from 'express';
import {
  getBackupSettings,
  updateBackupSettings,
  createBackup,
  getBackupRecords,
  downloadBackup,
  restoreBackup,
  downloadRecoveryKey,
  toggleCloudBackup,
  uploadToCloud,
} from '../controllers/backupController.js';

const router: Router = Router();

router.get('/backup/settings', getBackupSettings);
router.put('/backup/settings', updateBackupSettings);

router.post('/backup', createBackup);
router.get('/backup/records', getBackupRecords);
router.get('/backup/records/:id/download', downloadBackup);
router.get('/backup/records/:id/recovery-key', downloadRecoveryKey);
router.post('/backup/restore', restoreBackup);

router.post('/backup/cloud/toggle', toggleCloudBackup);
router.post('/backup/cloud/upload', uploadToCloud);

export default router;