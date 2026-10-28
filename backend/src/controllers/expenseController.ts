import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { cashflowRepository } from '../models/Cashflow.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'expense' | 'cashflow';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: data.entityType as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedExpenses {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedCashflows {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateExpenseBody = (body: any): string | null => {
  if (typeof body.category !== 'string' || !body.category.trim()) return 'Category is required';
  if (typeof body.description !== 'string' || !body.description.trim()) return 'Description is required';
  if (typeof body.amount !== 'number' || body.amount <= 0) return 'Amount must be a positive number';
  if (typeof body.date !== 'string' || !body.date.trim()) return 'Date is required';
  if (typeof body.mode !== 'string' || !body.mode.trim()) return 'Payment mode is required';
  if (typeof body.payee !== 'string' || !body.payee.trim()) return 'Payee is required';
  if (body.status && !['Approved', 'Pending'].includes(body.status)) return 'Status must be Approved or Pending';
  return null;
};

const validateCashflowBody = (body: any): string | null => {
  if (!['Income', 'Expense'].includes(body.type)) return 'Type must be Income or Expense';
  if (typeof body.category !== 'string' || !body.category.trim()) return 'Category is required';
  if (typeof body.description !== 'string' || !body.description.trim()) return 'Description is required';
  if (typeof body.amount !== 'number' || body.amount <= 0) return 'Amount must be a positive number';
  if (typeof body.date !== 'string' || !body.date.trim()) return 'Date is required';
  if (typeof body.mode !== 'string' || !body.mode.trim()) return 'Payment mode is required';
  return null;
};

export const getAllExpenses = async (req: Request<{}, {}, {}, { page?: string; limit?: string; category?: string; status?: string; search?: string; academicYear?: string; fromDate?: string; toDate?: string }>, res: Response<PaginatedExpenses | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const category = req.query.category as string;
    const status = req.query.status as 'Approved' | 'Pending';
    const search = req.query.search as string;
    const academicYear = req.query.academicYear as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const { data, total } = await cashflowRepository.findExpenseMany({
      page, limit, category, status, search, academicYear, fromDate, toDate
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const getExpenseById = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await cashflowRepository.findExpenseById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

export const getExpenseByVoucher = async (req: Request<{ voucher: string }>, res: Response<any | { error: string }>) => {
  try {
    const { voucher } = req.params;
    if (!voucher) {
      return res.status(400).json({ error: 'Voucher is required' });
    }

    const expense = await cashflowRepository.findByVoucher(voucher);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Get expense by voucher error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

export const createExpense = async (req: Request<{}, any | { error: string }, any>, res: Response<any | { error: string }>) => {
  try {
    const validationError = validateExpenseBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const expense = await cashflowRepository.createExpense(req.body);

    getIO(req).to('expenses').emit('expense:created', expense);

    await createNotification(req, {
      title: 'Expense Created',
      message: `Expense ${expense.voucher} for ${expense.description} (${expense.amount}) has been recorded`,
      type: 'success',
      entityType: 'expense',
      entityId: expense.id.toString()
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Expense with this voucher already exists' });
    }
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const updateExpense = async (req: Request<{ id: string }, any | { error: string }, any>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await cashflowRepository.updateExpense(id, req.body);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    getIO(req).to('expenses').emit('expense:updated', expense);

    await createNotification(req, {
      title: 'Expense Updated',
      message: `Expense ${expense.voucher} has been updated`,
      type: 'info',
      entityType: 'expense',
      entityId: expense.id.toString()
    });

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

export const approveExpense = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await cashflowRepository.approveExpense(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    getIO(req).to('expenses').emit('expense:approved', expense);

    await createNotification(req, {
      userId: expense.studentId,
      title: 'Expense Approved',
      message: `Expense ${expense.voucher} for ${expense.description} has been approved`,
      type: 'success',
      entityType: 'expense',
      entityId: expense.id.toString()
    });

    res.json(expense);
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ error: 'Failed to approve expense' });
  }
};

export const deleteExpense = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const expense = await cashflowRepository.findExpenseById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await cashflowRepository.deleteCashflow(id);

    getIO(req).to('expenses').emit('expense:deleted', { id });

    await createNotification(req, {
      title: 'Expense Deleted',
      message: `Expense ${expense.voucher} for ${expense.description} has been deleted`,
      type: 'warning',
      entityType: 'expense',
      entityId: expense.id.toString()
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

export const getAllCashflows = async (req: Request<{}, {}, {}, { page?: string; limit?: string; type?: string; category?: string; search?: string; academicYear?: string; fromDate?: string; toDate?: string }>, res: Response<PaginatedCashflows | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const type = req.query.type as 'Income' | 'Expense';
    const category = req.query.category as string;
    const search = req.query.search as string;
    const academicYear = req.query.academicYear as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const { data, total } = await cashflowRepository.findMany({
      page, limit, type, category, search, academicYear, fromDate, toDate
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all cashflows error:', error);
    res.status(500).json({ error: 'Failed to fetch cashflows' });
  }
};

export const getCashflowById = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid cashflow ID' });
    }

    const cashflow = await cashflowRepository.findById(id);
    if (!cashflow) {
      return res.status(404).json({ error: 'Cashflow not found' });
    }
    res.json(cashflow);
  } catch (error) {
    console.error('Get cashflow by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch cashflow' });
  }
};

export const createCashflow = async (req: Request<{}, any | { error: string }, any>, res: Response<any | { error: string }>) => {
  try {
    const validationError = validateCashflowBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const cashflow = await cashflowRepository.createCashflow(req.body);

    getIO(req).to('cashflows').emit('cashflow:created', cashflow);

    await createNotification(req, {
      title: 'Transaction Recorded',
      message: `${cashflow.type} of ${cashflow.amount} for ${cashflow.description} has been recorded`,
      type: 'success',
      entityType: 'cashflow',
      entityId: cashflow.id.toString()
    });

    res.status(201).json(cashflow);
  } catch (error) {
    console.error('Create cashflow error:', error);
    res.status(500).json({ error: 'Failed to create cashflow' });
  }
};

export const updateCashflow = async (req: Request<{ id: string }, any | { error: string }, any>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid cashflow ID' });
    }

    const cashflow = await cashflowRepository.updateCashflow(id, req.body);
    if (!cashflow) {
      return res.status(404).json({ error: 'Cashflow not found' });
    }

    getIO(req).to('cashflows').emit('cashflow:updated', cashflow);

    await createNotification(req, {
      title: 'Transaction Updated',
      message: `Transaction ${cashflow.reference} has been updated`,
      type: 'info',
      entityType: 'cashflow',
      entityId: cashflow.id.toString()
    });

    res.json(cashflow);
  } catch (error) {
    console.error('Update cashflow error:', error);
    res.status(500).json({ error: 'Failed to update cashflow' });
  }
};

export const deleteCashflow = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid cashflow ID' });
    }

    const cashflow = await cashflowRepository.findById(id);
    if (!cashflow) {
      return res.status(404).json({ error: 'Cashflow not found' });
    }

    await cashflowRepository.deleteCashflow(id);

    getIO(req).to('cashflows').emit('cashflow:deleted', { id });

    await createNotification(req, {
      title: 'Transaction Deleted',
      message: `${cashflow.type} ${cashflow.reference} for ${cashflow.description} has been deleted`,
      type: 'warning',
      entityType: 'cashflow',
      entityId: cashflow.id.toString()
    });

    res.json({ message: 'Cashflow deleted successfully' });
  } catch (error) {
    console.error('Delete cashflow error:', error);
    res.status(500).json({ error: 'Failed to delete cashflow' });
  }
};

export const getFinancialSummary = async (req: Request<{}, {}, {}, { academicYear?: string; fromDate?: string; toDate?: string }>, res: Response<any | { error: string }>) => {
  try {
    const academicYear = req.query.academicYear as string || '2026–27';
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const summary = await cashflowRepository.getSummary(academicYear, fromDate, toDate);
    res.json(summary);
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
};

export const getExpenseStats = async (req: Request<{}, {}, {}, { academicYear?: string; fromDate?: string; toDate?: string }>, res: Response<any | { error: string }>) => {
  try {
    const academicYear = req.query.academicYear as string || '2026–27';
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const stats = await cashflowRepository.getExpenseStats(academicYear, fromDate, toDate);
    res.json(stats);
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ error: 'Failed to fetch expense stats' });
  }
};

export const getCashflowSummary = async (req: Request<{}, {}, {}, { academicYear?: string; fromDate?: string; toDate?: string }>, res: Response<any | { error: string }>) => {
  try {
    const academicYear = req.query.academicYear as string || '2026–27';
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const summary = await cashflowRepository.getSummary(academicYear, fromDate, toDate);
    res.json(summary);
  } catch (error) {
    console.error('Get cashflow summary error:', error);
    res.status(500).json({ error: 'Failed to fetch cashflow summary' });
  }
};