import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  createBroadcastNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';

const router: Router = Router();

router.get('/', getNotifications);
router.get('/unread/:userId', getUnreadCount);
router.post('/', createNotification);
router.post('/broadcast', createBroadcastNotification);
router.put('/:id/read/:userId', markAsRead);
router.put('/read-all/:userId', markAllAsRead);
router.delete('/:id/:userId', deleteNotification);

export default router;