import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getUserStats,
  getUserActivity,
  getUserSessions,
  terminateSession,
  toggleUserStatus,
  forgotPassword,
  resetPasswordWithToken,
} from '../controllers/userController.js';

const router: Router = Router();

// Stats
router.get('/stats', getUserStats);

// User management
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);

// Password reset
router.post('/admin-reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordWithToken);

// Activity & sessions
router.get('/activity', getUserActivity);
router.get('/sessions', getUserSessions);
router.get('/:userId/sessions', getUserSessions);
router.post('/sessions/:id/terminate', terminateSession);

export default router;
