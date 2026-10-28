import { Router } from 'express';
import {
  getAdminSettings,
  updateAdminSettings,
  getBackups,
  getBackupStats,
  createBackup,
  getBackupById,
  updateBackup,
  deleteBackup,
  generateRecoveryKey,
  updateCloudConnection,
  updateEmailSettings,
  getAdminStats,
} from '../controllers/adminSettingsController.js';

const router: Router = Router();

// Admin settings
router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);
router.get('/stats', getAdminStats);

// Backups
router.get('/backups', getBackups);
router.get('/backups/stats', getBackupStats);
router.get('/backups/:id', getBackupById);
router.post('/backups', createBackup);
router.put('/backups/:id', updateBackup);
router.delete('/backups/:id', deleteBackup);

// Recovery key
router.post('/recovery-key', generateRecoveryKey);

// Cloud connection
router.put('/cloud-connection', updateCloudConnection);

// Email settings
router.put('/email-settings', updateEmailSettings);

export default router;