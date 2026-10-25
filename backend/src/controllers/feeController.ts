import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  feeRepository,
  FeeHead,
  CreateFeeHeadDto,
  UpdateFeeHeadDto,
  FeeHeadQuery,
  FeeAssignment,
  CreateFeeAssignmentDto,
  FeeAssignmentQuery
} from '../models/Fee.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'fee';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'fee' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedFeeHeads {
  data: FeeHead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedFeeAssignments {
  data: FeeAssignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateFeeHeadBody = (body: Partial<CreateFeeHeadDto>): string | null => {
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Fee type name is required';
  if (body.amount === undefined || body.amount === null || Number(body.amount) <= 0) return 'Amount must be greater than zero';
  if (typeof body.year !== 'string' || !body.year.trim()) return 'Academic year is required';
  if (typeof body.frequency !== 'string' || !body.frequency.trim()) return 'Frequency is required';
  return null;
};

export const getAllFeeHeads = async (req: Request<{}, {}, {}, FeeHeadQuery>, res: Response<PaginatedFeeHeads | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const className = req.query.className as string;
    const year = req.query.year as string;

    const { data, total } = await feeRepository.findManyFeeHeads({ page, limit, search, className, year });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all fee heads error:', error);
    res.status(500).json({ error: 'Failed to fetch fee heads' });
  }
};

export const getFeeHeadById = async (req: Request<{ id: string }>, res: Response<FeeHead | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid fee head ID' });
    }

    const fee = await feeRepository.findFeeHeadById(id);
    if (!fee) {
      return res.status(404).json({ error: 'Fee head not found' });
    }
    res.json(fee);
  } catch (error) {
    console.error('Get fee head by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch fee head' });
  }
};

export const getFeeHeadsByClassAndYear = async (req: Request<{ className: string; year: string }>, res: Response<FeeHead[] | { error: string }>) => {
  try {
    const { className, year } = req.params;
    if (!className || !year) {
      return res.status(400).json({ error: 'Class name and year are required' });
    }

    const fees = await feeRepository.findFeeHeadsByClassAndYear(className, year);
    res.json(fees);
  } catch (error) {
    console.error('Get fee heads by class and year error:', error);
    res.status(500).json({ error: 'Failed to fetch fee heads' });
  }
};

export const getFeeStats = async (req: Request<{ year: string }>, res: Response<{
  feeTypes: number;
  classesCovered: number;
  combinedAmount: number;
} | { error: string }>) => {
  try {
    const { year } = req.params;
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const stats = await feeRepository.getFeeStats(year);
    res.json(stats);
  } catch (error) {
    console.error('Get fee stats error:', error);
    res.status(500).json({ error: 'Failed to fetch fee stats' });
  }
};

export const getFeeYears = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const years = await feeRepository.getYears();
    res.json(years);
  } catch (error) {
    console.error('Get fee years error:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
};

export const getFeeClasses = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const classes = await feeRepository.getClasses();
    res.json(classes);
  } catch (error) {
    console.error('Get fee classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

export const getFeeFrequencies = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const frequencies = await feeRepository.getFrequencies();
    res.json(frequencies);
  } catch (error) {
    console.error('Get fee frequencies error:', error);
    res.status(500).json({ error: 'Failed to fetch frequencies' });
  }
};

export const createFeeHead = async (req: Request<{}, FeeHead | { error: string }, CreateFeeHeadDto>, res: Response<FeeHead | { error: string }>) => {
  try {
    const validationError = validateFeeHeadBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const isDuplicate = await feeRepository.checkDuplicateFeeHead(
      req.body.className,
      req.body.name,
      req.body.year
    );
    if (isDuplicate) {
      return res.status(409).json({ error: 'Fee type already exists for this class and year' });
    }

    const fee = await feeRepository.createFeeHead(req.body);

    getIO(req).to('fees').emit('fee:created', fee);

    await createNotification(req, {
      title: 'Fee Type Added',
      message: `Fee type ${fee.name} (${fee.frequency}) added for ${fee.className} in ${fee.year}`,
      type: 'success',
      entityType: 'fee',
      entityId: fee.id.toString()
    });

    res.status(201).json(fee);
  } catch (error) {
    console.error('Create fee head error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Fee type already exists for this class and year' });
    }
    res.status(500).json({ error: 'Failed to create fee head' });
  }
};

export const updateFeeHead = async (req: Request<{ id: string }, FeeHead | { error: string }, UpdateFeeHeadDto>, res: Response<FeeHead | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid fee head ID' });
    }

    if (req.body.className && req.body.name && req.body.year) {
      const isDuplicate = await feeRepository.checkDuplicateFeeHead(
        req.body.className,
        req.body.name,
        req.body.year,
        id
      );
      if (isDuplicate) {
        return res.status(409).json({ error: 'Fee type already exists for this class and year' });
      }
    }

    const fee = await feeRepository.updateFeeHead(id, req.body);
    if (!fee) {
      return res.status(404).json({ error: 'Fee head not found' });
    }

    getIO(req).to('fees').emit('fee:updated', fee);

    await createNotification(req, {
      title: 'Fee Type Updated',
      message: `Fee type ${fee.name} for ${fee.className} in ${fee.year} has been updated`,
      type: 'info',
      entityType: 'fee',
      entityId: fee.id.toString()
    });

    res.json(fee);
  } catch (error) {
    console.error('Update fee head error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Fee type already exists for this class and year' });
    }
    res.status(500).json({ error: 'Failed to update fee head' });
  }
};

export const deleteFeeHead = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid fee head ID' });
    }

    const fee = await feeRepository.findFeeHeadById(id);
    if (!fee) {
      return res.status(404).json({ error: 'Fee head not found' });
    }

    await feeRepository.deleteFeeHead(id);

    getIO(req).to('fees').emit('fee:deleted', { id });

    await createNotification(req, {
      title: 'Fee Type Deleted',
      message: `Fee type ${fee.name} for ${fee.className} in ${fee.year} has been deleted`,
      type: 'warning',
      entityType: 'fee',
      entityId: fee.id.toString()
    });

    res.json({ message: 'Fee head deleted successfully' });
  } catch (error) {
    console.error('Delete fee head error:', error);
    res.status(500).json({ error: 'Failed to delete fee head' });
  }
};

export const assignFees = async (req: Request<{}, FeeAssignment | { error: string }, CreateFeeAssignmentDto>, res: Response<FeeAssignment | { error: string }>) => {
  try {
    const { className, year } = req.body;

    if (!className || !year) {
      return res.status(400).json({ error: 'Class name and academic year are required' });
    }

    const heads = await feeRepository.findFeeHeadsByClassAndYear(className, year);
    if (!heads.length) {
      return res.status(400).json({ error: `No fee heads found for ${className} in ${year}` });
    }

    const assignment = await feeRepository.createFeeAssignment({ className, year });

    getIO(req).to('fee_assignments').emit('assignment:created', assignment);

    await createNotification(req, {
      title: 'Fees Assigned',
      message: `${heads.length} fee heads assigned to ${assignment.students} ${className} students (${assignment.perStudent}/student)`,
      type: 'success',
      entityType: 'fee',
      entityId: assignment.id.toString()
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assign fees error:', error);
    if ((error as Error).message?.includes('No fee heads found')) {
      return res.status(400).json({ error: (error as Error).message });
    }
    res.status(500).json({ error: 'Failed to assign fees' });
  }
};

export const getFeeAssignments = async (req: Request<{}, {}, {}, FeeAssignmentQuery>, res: Response<{
  data: FeeAssignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const className = req.query.className as string;
    const year = req.query.year as string;

    const { data, total } = await feeRepository.findManyFeeAssignments({ page, limit, className, year });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get fee assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch fee assignments' });
  }
};

export const copyFeeStructure = async (req: Request<{}, { copied: number; skipped: number } | { error: string }, { fromYear: string; toYear: string }>, res: Response<{ copied: number; skipped: number } | { error: string }>) => {
  try {
    const { fromYear, toYear } = req.body;

    if (!fromYear || !toYear) {
      return res.status(400).json({ error: 'From year and to year are required' });
    }

    if (fromYear === toYear) {
      return res.status(400).json({ error: 'From year and to year must be different' });
    }

    const result = await feeRepository.copyFeeStructure(fromYear, toYear);

    getIO(req).to('fees').emit('fee:copied', { fromYear, toYear, ...result });

    await createNotification(req, {
      title: 'Fee Structure Copied',
      message: `Copied ${result.copied} fee heads from ${fromYear} to ${toYear}${result.skipped ? `, ${result.skipped} skipped` : ''}`,
      type: 'success',
      entityType: 'fee',
      entityId: 'copy'
    });

    res.json(result);
  } catch (error) {
    console.error('Copy fee structure error:', error);
    if ((error as Error).message?.includes('No fee heads exist')) {
      return res.status(400).json({ error: (error as Error).message });
    }
    res.status(500).json({ error: 'Failed to copy fee structure' });
  }
};