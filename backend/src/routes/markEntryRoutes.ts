import { Router } from 'express';
import {
  getAllMarkEntries,
  getMarkEntryById,
  getMarkEntriesByExamClassSubject,
  getMarkEntriesByStudentExam,
  getMarksSummary,
  getSubjectStats,
  getStudentReportCard,
  getClassRankList,
  createMarkEntry,
  bulkCreateMarkEntries,
  updateMarkEntry,
  deleteMarkEntry
} from '../controllers/markEntryController.js';

const router: Router = Router();

// Summary and stats endpoints
router.get('/summary/:examId/:className/:section/:subject', getMarksSummary);
router.get('/subject-stats/:examId/:className/:section', getSubjectStats);

// Student report card and rank list
router.get('/student/:studentId/report-card/:examId', getStudentReportCard);
router.get('/rank-list/:examId/:className/:section', getClassRankList);

// Exam/Class/Subject specific
router.get('/exam/:examId/class/:className/section/:section/subject/:subject', getMarkEntriesByExamClassSubject);
router.get('/student/:studentId/exam/:examId', getMarkEntriesByStudentExam);

// General CRUD
router.get('/', getAllMarkEntries);
router.get('/:id', getMarkEntryById);
router.post('/', createMarkEntry);
router.post('/bulk', bulkCreateMarkEntries);
router.put('/:id', updateMarkEntry);
router.delete('/:id', deleteMarkEntry);

export default router;