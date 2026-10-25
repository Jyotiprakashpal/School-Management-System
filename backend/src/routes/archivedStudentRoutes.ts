import { Router } from 'express';
import {
  getAllArchivedStudents,
  getArchivedStudentById,
  getArchivedStudentByAdmissionNo,
  getArchivedStudentByTcNumber,
  getArchivedStudentsStats,
  getArchivedStudentsYears,
  createArchivedStudent,
  updateArchivedStudent,
  deleteArchivedStudent
} from '../controllers/archivedStudentController.js';

const router: Router = Router();

router.get('/stats', getArchivedStudentsStats);
router.get('/years', getArchivedStudentsYears);
router.get('/', getAllArchivedStudents);
router.get('/admission-no/:admissionNo', getArchivedStudentByAdmissionNo);
router.get('/tc-no/:tcNumber', getArchivedStudentByTcNumber);
router.get('/:id', getArchivedStudentById);
router.post('/', createArchivedStudent);
router.put('/:id', updateArchivedStudent);
router.delete('/:id', deleteArchivedStudent);

export default router;