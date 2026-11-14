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
  loginUser,
  changePassword,
} from '../controllers/userController.js';

const router: Router = Router();

router.post('/login', loginUser);
router.post('/change-password', changePassword);

// Stats
router.get('/stats', getUserStats);

// User management
router.get('/', getAllUsers);
// These static routes must be registered before /:id.
router.get('/activity', getUserActivity);
router.get('/sessions', getUserSessions);
router.post('/sessions/:id/terminate', terminateSession);
router.get('/:userId/sessions', getUserSessions);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);

// Password reset
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);

export default router;
