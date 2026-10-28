import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  getExpenseByVoucher,
  createExpense,
  updateExpense,
  approveExpense,
  deleteExpense,
  getAllCashflows,
  getCashflowById,
  createCashflow,
  updateCashflow,
  deleteCashflow,
  getFinancialSummary,
  getExpenseStats,
  getCashflowSummary
} from '../controllers/expenseController.js';

const router: Router = Router();

// Expense routes
router.get('/expenses', getAllExpenses);
router.get('/expenses/stats', getExpenseStats);
router.get('/expenses/voucher/:voucher', getExpenseByVoucher);
router.get('/expenses/:id', getExpenseById);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.put('/expenses/:id/approve', approveExpense);
router.delete('/expenses/:id', deleteExpense);

// Cashflow routes (Income & Expense)
router.get('/cashflows', getAllCashflows);
router.get('/cashflows/summary', getCashflowSummary);
router.get('/cashflows/financial-summary', getFinancialSummary);
router.get('/cashflows/:id', getCashflowById);
router.post('/cashflows', createCashflow);
router.put('/cashflows/:id', updateCashflow);
router.delete('/cashflows/:id', deleteCashflow);

export default router;