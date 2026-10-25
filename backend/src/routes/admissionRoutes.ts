import { Router } from 'express';
import {
  getAllAdmissions,
  getAdmissionById,
  getAdmissionByAdmissionNo,
  createAdmission,
  updateAdmission,
  deleteAdmission
} from '../controllers/admissionController.js';

const router: Router = Router();

router.get('/', getAllAdmissions);
router.get('/admission-no/:admissionNo', getAdmissionByAdmissionNo);
router.get('/:id', getAdmissionById);
router.post('/', createAdmission);
router.put('/:id', updateAdmission);
router.delete('/:id', deleteAdmission);

export default router;