import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  salaryRepository,
  Payroll,
  CreatePayrollDto,
  UpdatePayrollDto,
  PayrollQuery,
  PayrollSummary,
  DepartmentPayroll,
  MonthlyPayrollReport,
  EmployeeSalaryReport,
} from '../models/Salary.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'salary';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'salary' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedPayrolls {
  data: Payroll[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validatePayrollBody = (body: Partial<CreatePayrollDto>): string | null => {
  if (typeof body.employeeId !== 'string' || !body.employeeId.trim()) return 'Employee ID is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Employee name is required';
  if (typeof body.designation !== 'string' || !body.designation.trim()) return 'Designation is required';
  if (typeof body.department !== 'string' || !body.department.trim()) return 'Department is required';
  if (typeof body.basic !== 'number' || body.basic <= 0) return 'Basic salary must be a positive number';
  if (body.allowances !== undefined && (typeof body.allowances !== 'number' || body.allowances < 0)) return 'Allowances must be non-negative';
  if (body.deductions !== undefined && (typeof body.deductions !== 'number' || body.deductions < 0)) return 'Deductions must be non-negative';
  if (typeof body.month !== 'string' || !body.month.trim()) return 'Month is required';
  if (typeof body.year !== 'number' || body.year <= 0) return 'Year is required';
  return null;
};

export const getAllPayrolls = async (req: Request<{}, {}, {}, PayrollQuery>, res: Response<PaginatedPayrolls | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const month = req.query.month as string;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const department = req.query.department as string;
    const status = req.query.status as 'Pending' | 'Processed' | 'Paid';
    const employeeId = req.query.employeeId as string;

    const { data, total } = await salaryRepository.findMany({
      page, limit, month, year, department, status, employeeId
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all payrolls error:', error);
    res.status(500).json({ error: 'Failed to fetch payrolls' });
  }
};

export const getPayrollById = async (req: Request<{ id: string }>, res: Response<Payroll | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payroll ID' });
    }

    const payroll = await salaryRepository.findById(id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    console.error('Get payroll by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
};

export const getPayrollByEmployeeMonthYear = async (req: Request<{ employeeId: string; month: string; year: string }>, res: Response<Payroll | { error: string }>) => {
  try {
    const { employeeId, month, year } = req.params;
    const yearNum = parseInt(year, 10);
    if (!Number.isInteger(yearNum) || yearNum <= 0) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const payroll = await salaryRepository.findByEmployeeMonthYear(employeeId, month, yearNum);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    console.error('Get payroll by employee/month/year error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
};

export const getPayrollSummary = async (req: Request<{ month: string; year: string }>, res: Response<PayrollSummary | { error: string }>) => {
  try {
    const { month, year } = req.params;
    const yearNum = parseInt(year, 10);
    if (!Number.isInteger(yearNum) || yearNum <= 0) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    if (!month || !month.trim()) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const summary = await salaryRepository.getSummary(month, yearNum);
    res.json(summary);
  } catch (error) {
    console.error('Get payroll summary error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
};

export const getDepartmentTotals = async (req: Request<{ month: string; year: string }>, res: Response<DepartmentPayroll[] | { error: string }>) => {
  try {
    const { month, year } = req.params;
    const yearNum = parseInt(year, 10);
    if (!Number.isInteger(yearNum) || yearNum <= 0) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    if (!month || !month.trim()) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const totals = await salaryRepository.getDepartmentTotals(month, yearNum);
    res.json(totals);
  } catch (error) {
    console.error('Get department totals error:', error);
    res.status(500).json({ error: 'Failed to fetch department totals' });
  }
};

export const getMonthlyReports = async (req: Request<{}, {}, {}, { year?: string }>, res: Response<MonthlyPayrollReport[] | { error: string }>) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const reports = await salaryRepository.getMonthlyReports(year);
    res.json(reports);
  } catch (error) {
    console.error('Get monthly reports error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly reports' });
  }
};

export const getMonthlyReport = async (req: Request<{ month: string; year: string }>, res: Response<MonthlyPayrollReport | { error: string }>) => {
  try {
    const { month, year } = req.params;
    const yearNum = parseInt(year, 10);
    if (!Number.isInteger(yearNum) || yearNum <= 0) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    if (!month || !month.trim()) {
      return res.status(400).json({ error: 'Month is required' });
    }

    const report = await salaryRepository.getMonthlyReport(month, yearNum);
    if (!report) {
      return res.status(404).json({ error: 'Monthly report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
};

export const upsertMonthlyReport = async (req: Request<{}, MonthlyPayrollReport | { error: string }, Omit<MonthlyPayrollReport, 'id' | 'status'> & { status?: 'Complete' | 'Partial' }>, res: Response<MonthlyPayrollReport | { error: string }>) => {
  try {
    const { month, year, employees, gross, deductions, net, paid, status } = req.body;

    if (!month || !month.trim()) return res.status(400).json({ error: 'Month is required' });
    if (!year || typeof year !== 'number' || year <= 0) return res.status(400).json({ error: 'Valid year is required' });

    const report = await salaryRepository.upsertMonthlyReport({ month, year, employees, gross, deductions: deductions || 0, net, paid, status });

    getIO(req).to('salary').emit('monthly_report:updated', req.body);

    res.json(report);
  } catch (error) {
    console.error('Upsert monthly report error:', error);
    res.status(500).json({ error: 'Failed to upsert monthly report' });
  }
};

export const getEmployeeSalaries = async (_req: Request, res: Response<EmployeeSalaryReport[] | { error: string }>) => {
  try {
    const salaries = await salaryRepository.getEmployeeSalaries();
    res.json(salaries);
  } catch (error) {
    console.error('Get employee salaries error:', error);
    res.status(500).json({ error: 'Failed to fetch employee salaries' });
  }
};

export const upsertEmployeeSalary = async (req: Request<{}, EmployeeSalaryReport | { error: string }, Omit<EmployeeSalaryReport, 'id'>>, res: Response<EmployeeSalaryReport | { error: string }>) => {
  try {
    const { employeeId, name, department, gross, net, status } = req.body;

    if (!employeeId || !employeeId.trim()) return res.status(400).json({ error: 'Employee ID is required' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!department || !department.trim()) return res.status(400).json({ error: 'Department is required' });
    if (typeof gross !== 'number' || gross < 0) return res.status(400).json({ error: 'Gross must be a non-negative number' });
    if (typeof net !== 'number' || net < 0) return res.status(400).json({ error: 'Net must be a non-negative number' });
    if (!['Paid', 'Pending'].includes(status)) return res.status(400).json({ error: 'Status must be Paid or Pending' });

    const salary = await salaryRepository.upsertEmployeeSalary({ employeeId, name, department, gross, net, status });

    getIO(req).to('salary').emit('employee_salary:updated', req.body);

    res.json(salary);
  } catch (error) {
    console.error('Upsert employee salary error:', error);
    res.status(500).json({ error: 'Failed to upsert employee salary' });
  }
};

export const getEmployeeSalaryById = async (req: Request<{ employeeId: string }>, res: Response<EmployeeSalaryReport | { error: string }>) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    const salary = await salaryRepository.getEmployeeSalaryById(employeeId);
    if (!salary) {
      return res.status(404).json({ error: 'Employee salary not found' });
    }
    res.json(salary);
  } catch (error) {
    console.error('Get employee salary by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch employee salary' });
  }
};

export const getEmployeeSalariesByDepartment = async (req: Request<{ department: string }>, res: Response<EmployeeSalaryReport[] | { error: string }>) => {
  try {
    const { department } = req.params;
    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Department is required' });
    }

    const salaries = await salaryRepository.getEmployeeSalariesByDepartment(department);
    res.json(salaries);
  } catch (error) {
    console.error('Get employee salaries by department error:', error);
    res.status(500).json({ error: 'Failed to fetch employee salaries' });
  }
};

export const createPayroll = async (req: Request<{}, Payroll | { error: string }, CreatePayrollDto>, res: Response<Payroll | { error: string }>) => {
  try {
    const validationError = validatePayrollBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existing = await salaryRepository.findByEmployeeMonthYear(req.body.employeeId, req.body.month, req.body.year);
    if (existing) {
      return res.status(409).json({ error: 'Payroll for this employee/month/year already exists' });
    }

    const payroll = await salaryRepository.create(req.body);

    getIO(req).to('salary').emit('payroll:created', payroll);

    await createNotification(req, {
      userId: payroll.employeeId,
      title: 'Payroll Created',
      message: `Your ${payroll.month} ${payroll.year} salary has been calculated: ${payroll.basic + payroll.allowances - payroll.deductions}`,
      type: 'success',
      entityType: 'salary',
      entityId: payroll.id.toString()
    });

    res.status(201).json(payroll);
  } catch (error) {
    console.error('Create payroll error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Payroll for this employee/month/year already exists' });
    }
    res.status(500).json({ error: 'Failed to create payroll' });
  }
};

export const updatePayroll = async (req: Request<{ id: string }, Payroll | { error: string }, UpdatePayrollDto>, res: Response<Payroll | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payroll ID' });
    }

    const payroll = await salaryRepository.update(id, req.body);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    getIO(req).to('salary').emit('payroll:updated', payroll);

    await createNotification(req, {
      userId: payroll.employeeId,
      title: 'Payroll Updated',
      message: `Your ${payroll.month} ${payroll.year} salary has been updated`,
      type: 'info',
      entityType: 'salary',
      entityId: payroll.id.toString()
    });

    res.json(payroll);
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({ error: 'Failed to update payroll' });
  }
};

export const updatePayrollStatus = async (req: Request<{ id: string }, Payroll | { error: string }, { status: 'Pending' | 'Processed' | 'Paid' }>, res: Response<Payroll | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payroll ID' });
    }

    const { status } = req.body;
    if (!['Pending', 'Processed', 'Paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payroll = await salaryRepository.update(id, { status });
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    getIO(req).to('salary').emit('payroll:status_changed', { ...payroll, status });

    await createNotification(req, {
      userId: payroll.employeeId,
      title: 'Salary Status Changed',
      message: `Your ${payroll.month} ${payroll.year} salary is now ${status.toLowerCase()}`,
      type: status === 'Paid' ? 'success' : 'info',
      entityType: 'salary',
      entityId: payroll.id.toString()
    });

    res.json(payroll);
  } catch (error) {
    console.error('Update payroll status error:', error);
    res.status(500).json({ error: 'Failed to update payroll status' });
  }
};

export const deletePayroll = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payroll ID' });
    }

    const payroll = await salaryRepository.findById(id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    await salaryRepository.delete(id);

    getIO(req).to('salary').emit('payroll:deleted', { id });

    await createNotification(req, {
      title: 'Payroll Deleted',
      message: `Payroll record for ${payroll.name} (${payroll.month} ${payroll.year}) has been deleted`,
      type: 'warning',
      entityType: 'salary',
      entityId: payroll.id.toString()
    });

    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({ error: 'Failed to delete payroll' });
  }
};