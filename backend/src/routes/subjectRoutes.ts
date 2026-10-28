import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  getSubjectByCode,
  getSubjectStats,
  getSubjectTypes,
  getSubjectStatuses,
  createSubject,
  updateSubject,
  toggleSubjectStatus,
  duplicateSubject,
  deleteSubject
} from '../controllers/subjectController.js';

const router: Router = Router();

// Stats and utility endpoints
router.get('/stats', getSubjectStats);
router.get('/types', getSubjectTypes);
router.get('/statuses', getSubjectStatuses);

// CRUD
router.get('/', getAllSubjects);
router.get('/code/:code', getSubjectByCode);
router.get('/:id', getSubjectById);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.put('/:id/toggle', toggleSubjectStatus);
router.post('/:id/duplicate', duplicateSubject);
router.delete('/:id', deleteSubject);

export default router;