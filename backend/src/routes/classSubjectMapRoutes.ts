import { Router } from 'express';
import {
  getAllClassSubjectMaps,
  getClassSubjectMapById,
  getClassSubjectMapsByClassSectionYear,
  getClassSubjectMapStats,
  getClassSubjectMapYears,
  getClassSubjectMapClasses,
  getClassSubjectMapSections,
  getClassSubjectMapTeachers,
  createClassSubjectMap,
  updateClassSubjectMap,
  deleteClassSubjectMap,
  deleteClassSubjectMapByClassSectionYear,
  copyClassSubjectMap
} from '../controllers/classSubjectMapController.js';

const router: Router = Router();

// Stats and utility endpoints
router.get('/stats/:className/:section/:year', getClassSubjectMapStats);
router.get('/years', getClassSubjectMapYears);
router.get('/classes', getClassSubjectMapClasses);
router.get('/sections', getClassSubjectMapSections);
router.get('/teachers', getClassSubjectMapTeachers);

// Class/Section/Year specific
router.get('/class/:className/section/:section/year/:year', getClassSubjectMapsByClassSectionYear);

// CRUD
router.get('/', getAllClassSubjectMaps);
router.get('/:id', getClassSubjectMapById);
router.post('/', createClassSubjectMap);
router.put('/:id', updateClassSubjectMap);
router.delete('/:id', deleteClassSubjectMap);
router.delete('/class/:className/section/:section/year/:year', deleteClassSubjectMapByClassSectionYear);
router.post('/copy', copyClassSubjectMap);

export default router;