import { Router } from 'express';
import {
  getAllEnquiries,
  getEnquiryByStudentId,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry
} from '../controllers/admissionEnquiryController.js';

const router: Router = Router();

router.get('/', getAllEnquiries);
router.get('/:studentId', getEnquiryByStudentId);
router.post('/', createEnquiry);
router.put('/:studentId', updateEnquiry);
router.delete('/:studentId', deleteEnquiry);

export default router;