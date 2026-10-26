import { Router } from 'express';
import {
  getAllAttendance,
  getAttendanceByClassSectionDate,
  getClassRosterWithStatus,
  getAttendanceSummary,
  createAttendance,
  bulkCreateAttendance,
  updateAttendance,
  deleteAttendanceByClassSectionDate,
  getStudentHistory,
  getMonthlyReport
} from '../controllers/attendanceController.js';

const router: Router = Router();

// General attendance routes
router.get('/', getAllAttendance);

// Class/Section/Date specific routes
router.get('/class/:className/section/:section/date/:date', getAttendanceByClassSectionDate);
router.get('/roster/:className/section/:section/date/:date', getClassRosterWithStatus);
router.get('/summary/:className/section/:section/date/:date', getAttendanceSummary);

// Student history
router.get('/student/:studentId/history', getStudentHistory);

// Monthly report
router.get('/report/:className/section/:section/year/:year/month/:month', getMonthlyReport);

// CRUD
router.post('/', createAttendance);
router.post('/bulk', bulkCreateAttendance);
router.put('/:id', updateAttendance);
router.delete('/class/:className/section/:section/date/:date', deleteAttendanceByClassSectionDate);

export default router;