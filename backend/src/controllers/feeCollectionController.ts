import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  feeCollectionRepository,
  FeePayment,
  CreateFeePaymentDto,
  UpdateFeePaymentDto,
  FeePaymentQuery,
  FeeCollectionSummary,
  StudentFeeStatus
} from '../models/FeeCollection.js';
import { feeRepository } from '../models/Fee.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'fee_collection';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'fee_collection' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedFeePayments {
  data: FeePayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validatePaymentBody = (body: Partial<CreateFeePaymentDto>): string | null => {
  if (typeof body.studentId !== 'string' || !body.studentId.trim()) return 'Student ID is required';
  if (typeof body.admissionNo !== 'string' || !body.admissionNo.trim()) return 'Admission number is required';
  if (typeof body.studentName !== 'string' || !body.studentName.trim()) return 'Student name is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class is required';
  if (typeof body.section !== 'string' || !body.section.trim()) return 'Section is required';
  if (typeof body.feeHeadId !== 'number' || body.feeHeadId <= 0) return 'Fee head ID is required';
  if (typeof body.feeHeadName !== 'string' || !body.feeHeadName.trim()) return 'Fee head name is required';
  if (body.amount === undefined || body.amount === null || Number(body.amount) <= 0) return 'Amount must be greater than zero';
  if (body.paidAmount === undefined || body.paidAmount === null || Number(body.paidAmount) < 0) return 'Paid amount must be zero or greater';
  if (Number(body.paidAmount) > Number(body.amount)) return 'Paid amount cannot exceed total amount';
  if (typeof body.paymentMode !== 'string' || !['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'].includes(body.paymentMode)) return 'Valid payment mode is required';
  if (typeof body.academicYear !== 'string' || !body.academicYear.trim()) return 'Academic year is required';
  if (typeof body.collectedBy !== 'string' || !body.collectedBy.trim()) return 'Collected by is required';
  return null;
};

export const getAllFeePayments = async (req: Request<{}, {}, {}, FeePaymentQuery>, res: Response<PaginatedFeePayments | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const className = req.query.className as string;
    const section = req.query.section as string;
    const feeHeadId = req.query.feeHeadId ? parseInt(Array.isArray(req.query.feeHeadId) ? req.query.feeHeadId[0] : req.query.feeHeadId, 10) : undefined;
    const paymentMode = req.query.paymentMode as string;
    const academicYear = req.query.academicYear as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const studentId = req.query.studentId as string;

    const { data, total } = await feeCollectionRepository.findMany({
      page, limit, search, className, section, feeHeadId,
      paymentMode, academicYear, fromDate, toDate, studentId
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all fee payments error:', error);
    res.status(500).json({ error: 'Failed to fetch fee payments' });
  }
};

export const getFeePaymentById = async (req: Request<{ id: string }>, res: Response<FeePayment | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const payment = await feeCollectionRepository.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Get fee payment by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch fee payment' });
  }
};

export const getFeePaymentByReceipt = async (req: Request<{ receiptNumber: string }>, res: Response<FeePayment | { error: string }>) => {
  try {
    const { receiptNumber } = req.params;
    if (!receiptNumber) {
      return res.status(400).json({ error: 'Receipt number is required' });
    }

    const payment = await feeCollectionRepository.findByReceiptNumber(receiptNumber);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Get fee payment by receipt error:', error);
    res.status(500).json({ error: 'Failed to fetch fee payment' });
  }
};

export const getStudentFeeStatus = async (req: Request<{ studentId: string; academicYear: string }>, res: Response<StudentFeeStatus | { error: string }>) => {
  try {
    const { studentId, academicYear } = req.params;
    if (!studentId || !academicYear) {
      return res.status(400).json({ error: 'Student ID and academic year are required' });
    }

    const status = await feeCollectionRepository.getStudentFeeStatus(studentId, academicYear);
    if (!status) {
      return res.status(404).json({ error: 'Student not found or no fee records' });
    }
    res.json(status);
  } catch (error) {
    console.error('Get student fee status error:', error);
    res.status(500).json({ error: 'Failed to fetch student fee status' });
  }
};

export const getClassFeeStatus = async (req: Request<{ className: string; section: string; academicYear: string }>, res: Response<StudentFeeStatus[] | { error: string }>) => {
  try {
    const { className, section, academicYear } = req.params;
    if (!className || !section || !academicYear) {
      return res.status(400).json({ error: 'Class name, section, and academic year are required' });
    }

    const status = await feeCollectionRepository.getClassFeeStatus(className, section, academicYear);
    res.json(status);
  } catch (error) {
    console.error('Get class fee status error:', error);
    res.status(500).json({ error: 'Failed to fetch class fee status' });
  }
};

export const createFeePayment = async (req: Request<{}, FeePayment | { error: string }, CreateFeePaymentDto>, res: Response<FeePayment | { error: string }>) => {
  try {
    const validationError = validatePaymentBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verify fee head exists
    const feeHead = await feeRepository.findFeeHeadById(req.body.feeHeadId);
    if (!feeHead) {
      return res.status(404).json({ error: 'Fee head not found' });
    }

    const payment = await feeCollectionRepository.createPayment(req.body);

    getIO(req).to('fee_collections').emit('payment:created', payment);

    await createNotification(req, {
      userId: req.body.studentId,
      title: 'Fee Payment Received',
      message: `Payment of ₹${req.body.paidAmount} received for ${req.body.feeHeadName} (${req.body.studentName})`,
      type: 'success',
      entityType: 'fee_collection',
      entityId: payment.id.toString()
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create fee payment error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Duplicate receipt number' });
    }
    res.status(500).json({ error: 'Failed to create fee payment' });
  }
};

export const updateFeePayment = async (req: Request<{ id: string }, FeePayment | { error: string }, UpdateFeePaymentDto>, res: Response<FeePayment | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const currentPayment = await feeCollectionRepository.findById(id);
    if (!currentPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (req.body.paidAmount !== undefined && Number(req.body.paidAmount) > currentPayment.amount) {
      return res.status(400).json({ error: 'Paid amount cannot exceed total amount' });
    }

    const payment = await feeCollectionRepository.updatePayment(id, req.body);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    getIO(req).to('fee_collections').emit('payment:updated', payment);

    await createNotification(req, {
      title: 'Fee Payment Updated',
      message: `Payment record for ${payment.studentName} has been updated`,
      type: 'info',
      entityType: 'fee_collection',
      entityId: payment.id.toString()
    });

    res.json(payment);
  } catch (error) {
    console.error('Update fee payment error:', error);
    res.status(500).json({ error: 'Failed to update fee payment' });
  }
};

export const deleteFeePayment = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const payment = await feeCollectionRepository.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await feeCollectionRepository.deletePayment(id);

    getIO(req).to('fee_collections').emit('payment:deleted', { id });

    await createNotification(req, {
      title: 'Fee Payment Deleted',
      message: `Payment record for ${payment.studentName} (${payment.receiptNumber}) has been deleted`,
      type: 'warning',
      entityType: 'fee_collection',
      entityId: payment.id.toString()
    });

    res.json({ message: 'Fee payment deleted successfully' });
  } catch (error) {
    console.error('Delete fee payment error:', error);
    res.status(500).json({ error: 'Failed to delete fee payment' });
  }
};

export const getCollectionSummary = async (req: Request<{ academicYear: string }>, res: Response<FeeCollectionSummary | { error: string }>) => {
  try {
    const { academicYear } = req.params;
    const className = req.query.className as string;
    const section = req.query.section as string;

    if (!academicYear) {
      return res.status(400).json({ error: 'Academic year is required' });
    }

    const summary = await feeCollectionRepository.getCollectionSummary(academicYear, className, section);
    res.json(summary);
  } catch (error) {
    console.error('Get collection summary error:', error);
    res.status(500).json({ error: 'Failed to fetch collection summary' });
  }
};

export const getDailyCollectionReport = async (req: Request<{ academicYear: string; date: string }>, res: Response<{
  date: Date;
  totalCollected: number;
  transactionCount: number;
  byMode: { mode: string; amount: number; count: number }[];
  byClass: { className: string; amount: number; count: number }[];
} | { error: string }>) => {
  try {
    const { academicYear, date } = req.params;
    if (!academicYear || !date) {
      return res.status(400).json({ error: 'Academic year and date are required' });
    }

    const report = await feeCollectionRepository.getDailyCollectionReport(academicYear, new Date(date));
    res.json(report);
  } catch (error) {
    console.error('Get daily collection report error:', error);
    res.status(500).json({ error: 'Failed to fetch daily collection report' });
  }
};

export const getMonthlyCollectionReport = async (req: Request<{ academicYear: string; year: string; month: string }>, res: Response<{
  month: string;
  totalCollected: number;
  transactionCount: number;
  dailyBreakdown: { date: Date; amount: number; count: number }[];
} | { error: string }>) => {
  try {
    const { academicYear, year, month } = req.params;
    if (!academicYear || !year || !month) {
      return res.status(400).json({ error: 'Academic year, year, and month are required' });
    }

    const report = await feeCollectionRepository.getMonthlyCollectionReport(academicYear, parseInt(year, 10), parseInt(month, 10));
    res.json(report);
  } catch (error) {
    console.error('Get monthly collection report error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly collection report' });
  }
};

export const getFeePaymentByStudent = async (req: Request<{ studentId: string }>, res: Response<FeePayment[] | { error: string }>) => {
  try {
    const { studentId } = req.params;
    const academicYear = req.query.academicYear as string;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const payments = await feeCollectionRepository.findByStudentId(studentId, academicYear);
    res.json(payments);
  } catch (error) {
    console.error('Get fee payments by student error:', error);
    res.status(500).json({ error: 'Failed to fetch student fee payments' });
  }
};