import { Router } from 'express';
import {
  getAllExamSchedules,
  getExamScheduleById,
  getExamSchedulesByExam,
  getExamSchedulesByClassDate,
  getExamScheduleStats,
  getRoomUsage,
  getCompletedCount,
  createExamSchedule,
  updateExamSchedule,
  duplicateExamSchedule,
  deleteExamSchedule,
  deleteAllByExam,
  getNextPaper
} from '../controllers/examScheduleController.js';

const router: Router = Router();

// Stats and utility endpoints
router.get('/stats', getExamScheduleStats);
router.get('/next', getNextPaper);
router.get('/room-usage', getRoomUsage);
router.get('/completed-count', getCompletedCount);

// Exam-specific schedules
router.get('/exam/:examId', getExamSchedulesByExam);

// Class/Date specific
router.get('/class/:className/date/:date', getExamSchedulesByClassDate);

// CRUD
router.get('/', getAllExamSchedules);
router.get('/:id', getExamScheduleById);
router.post('/', createExamSchedule);
router.put('/:id', updateExamSchedule);
router.post('/:id/duplicate', duplicateExamSchedule);
router.delete('/:id', deleteExamSchedule);
router.delete('/exam/:examId', deleteAllByExam);

export default router;