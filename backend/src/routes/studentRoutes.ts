import { Router } from 'express';
import {
  getAllStudents,
  getStudentByCompositeKey,
  getStudentByAdmissionNo,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';

const router: Router = Router();

router.get('/', getAllStudents);
router.get('/admission/:admissionNo', getStudentByAdmissionNo);
router.get('/:userId/:admissionNo', getStudentByCompositeKey);
router.post('/', createStudent);
router.put('/:userId/:admissionNo', updateStudent);
router.delete('/:userId/:admissionNo', deleteStudent);

export default router;