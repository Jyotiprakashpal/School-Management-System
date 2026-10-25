import { Router } from 'express';
import {
  getAllFeeHeads,
  getFeeHeadById,
  getFeeHeadsByClassAndYear,
  getFeeStats,
  getFeeYears,
  getFeeClasses,
  getFeeFrequencies,
  createFeeHead,
  updateFeeHead,
  deleteFeeHead,
  assignFees,
  getFeeAssignments,
  copyFeeStructure
} from '../controllers/feeController.js';

const router: Router = Router();

// Fee head routes
router.get('/stats/:year', getFeeStats);
router.get('/years', getFeeYears);
router.get('/classes', getFeeClasses);
router.get('/frequencies', getFeeFrequencies);
router.get('/', getAllFeeHeads);
router.get('/class/:className/year/:year', getFeeHeadsByClassAndYear);
router.get('/:id', getFeeHeadById);
router.post('/', createFeeHead);
router.put('/:id', updateFeeHead);
router.delete('/:id', deleteFeeHead);

// Fee assignment routes
router.post('/assign', assignFees);
router.get('/assignments', getFeeAssignments);

// Copy structure route
router.post('/copy', copyFeeStructure);

export default router;