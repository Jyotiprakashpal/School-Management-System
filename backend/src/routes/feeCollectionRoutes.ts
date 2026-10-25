import { Router } from 'express';
import {
  getAllFeePayments,
  getFeePaymentById,
  getFeePaymentByReceipt,
  getStudentFeeStatus,
  getClassFeeStatus,
  createFeePayment,
  updateFeePayment,
  deleteFeePayment,
  getCollectionSummary,
  getDailyCollectionReport,
  getMonthlyCollectionReport,
  getFeePaymentByStudent
} from '../controllers/feeCollectionController.js';

const router: Router = Router();

// Payment routes
router.get('/', getAllFeePayments);
router.get('/receipt/:receiptNumber', getFeePaymentByReceipt);
router.get('/student/:studentId', getFeePaymentByStudent);
router.get('/:id', getFeePaymentById);

// Student/Class fee status
router.get('/student/:studentId/status/:academicYear', getStudentFeeStatus);
router.get('/class/:className/section/:section/status/:academicYear', getClassFeeStatus);

// Reports
router.get('/summary/:academicYear', getCollectionSummary);
router.get('/daily/:academicYear/:date', getDailyCollectionReport);
router.get('/monthly/:academicYear/:year/:month', getMonthlyCollectionReport);

// CRUD
router.post('/', createFeePayment);
router.put('/:id', updateFeePayment);
router.delete('/:id', deleteFeePayment);

export default router;