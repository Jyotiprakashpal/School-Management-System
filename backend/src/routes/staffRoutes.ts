import { Router } from 'express';
import {
  getAllStaff,
  getStaffById,
  getStaffStats,
  getDepartments,
  createStaff,
  updateStaff,
  updateStaffStatus,
  deleteStaff
} from '../controllers/staffController.js';

const router: Router = Router();

// Stats and utility endpoints
router.get('/stats', getStaffStats);
router.get('/departments', getDepartments);

// CRUD
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.put('/:id/status', updateStaffStatus);
router.delete('/:id', deleteStaff);

export default router;