import { Router } from 'express';
import { createNotice, deleteNotice, getNotices, updateNotice } from '../controllers/noticeController.js';

const router = Router();
router.get('/', getNotices);
router.post('/', createNotice);
router.put('/:id', updateNotice);
router.delete('/:id', deleteNotice);
export default router;
