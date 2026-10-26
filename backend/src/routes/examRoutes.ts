import { Router } from 'express';
import {
  getAllExams,
  getExamById,
  getExamStats,
  getActiveOrNextExam,
  createExam,
  updateExam,
  changeExamStatus,
  duplicateExam,
  deleteExam
} from '../controllers/examController.js';

const router: Router = Router();

router.get('/stats', getExamStats);
router.get('/active-next', getActiveOrNextExam);
router.get('/', getAllExams);
router.get('/:id', getExamById);
router.post('/', createExam);
router.put('/:id', updateExam);
router.put('/:id/status', changeExamStatus);
router.post('/:id/duplicate', duplicateExam);
router.delete('/:id', deleteExam);

export default router;