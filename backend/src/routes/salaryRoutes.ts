import { Router } from 'express';
import {
  getAllPayrolls,
  getPayrollById,
  getPayrollByEmployeeMonthYear,
  getPayrollSummary,
  getDepartmentTotals,
  getMonthlyReports,
  getMonthlyReport,
  upsertMonthlyReport,
  getEmployeeSalaries,
  upsertEmployeeSalary,
  getEmployeeSalaryById,
  getEmployeeSalariesByDepartment,
  createPayroll,
  updatePayroll,
  updatePayrollStatus,
  deletePayroll,
} from '../controllers/salaryController.js';

const router = Router();

// Summary and reports
router.get('/summary/:month/:year', getPayrollSummary);
router.get('/department-totals/:month/:year', getDepartmentTotals);
router.get('/monthly-reports', getMonthlyReports);
router.get('/monthly-reports/:month/:year', getMonthlyReport);
router.put('/monthly-reports/:month/:year', upsertMonthlyReport);

// Employee salaries
router.get('/employee-salaries', getEmployeeSalaries);
router.post('/employee-salaries', upsertEmployeeSalary);
router.get('/employee-salaries/:employeeId', getEmployeeSalaryById);
router.get('/employee-salaries/department/:department', getEmployeeSalariesByDepartment);

// Individual payroll records
router.get('/', getAllPayrolls);
router.get('/employee/:employeeId/month/:month/year/:year', getPayrollByEmployeeMonthYear);
router.get('/:id', getPayrollById);
router.post('/', createPayroll);
router.put('/:id', updatePayroll);
router.put('/:id/status', updatePayrollStatus);
router.delete('/:id', deletePayroll);

export default router;