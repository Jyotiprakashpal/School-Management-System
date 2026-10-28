import { Router } from 'express';
import {
  getAllClassResults,
  getClassResultsByExamClassSection,
  getClassResultSummary,
  getClassRankList,
  getStudentReportCard,
  generateResults,
  publishResults,
  unpublishResults,
} from '../controllers/classResultController.js';

const router: Router = Router();

// Summary and rank list
router.get('/summary/:examId/:className/:section', getClassResultSummary);
router.get('/rank-list/:examId/:className/:section', getClassRankList);

// Student report card
router.get('/student/:studentId/report-card/:examId', getStudentReportCard);

// Exam/Class/Section specific
router.get('/exam/:examId/class/:className/section/:section', getClassResultsByExamClassSection);

// Generation and publishing
router.post('/generate', generateResults);
router.post('/publish', publishResults);
router.post('/unpublish', unpublishResults);

// General listing
router.get('/', getAllClassResults);

export default router;