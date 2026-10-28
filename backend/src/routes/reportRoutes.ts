import { Router } from 'express';
import {
  getAllTemplates,
  getTemplateById,
  getTemplateCategories,
  getAllGeneratedReports,
  getGeneratedReportById,
  getReportStats,
  generateReport,
  scheduleReport,
  getGeneratedReportFile,
  deleteGeneratedReport,
  getFinancialReportData,
  getAcademicReportData,
  getAttendanceReportData,
  getStudentReportData
} from '../controllers/reportController.js';

const router: Router = Router();

// Template routes
router.get('/templates', getAllTemplates);
router.get('/templates/categories', getTemplateCategories);
router.get('/templates/:id', getTemplateById);

// Generated report routes
router.get('/stats', getReportStats);
router.get('/generated', getAllGeneratedReports);
router.get('/generated/:id', getGeneratedReportById);
router.get('/generated/:id/download', getGeneratedReportFile);
router.post('/generate', generateReport);
router.post('/schedule', scheduleReport);
router.delete('/generated/:id', deleteGeneratedReport);

// Data-driven report endpoints
router.get('/financial', getFinancialReportData);
router.get('/academic', getAcademicReportData);
router.get('/attendance', getAttendanceReportData);
router.get('/students', getStudentReportData);

export default router;