import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  attendanceRepository,
  AttendanceRecord,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQuery,
  AttendanceSummary,
  ClassRoster
} from '../models/Attendance.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'attendance';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'attendance' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedAttendance {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateAttendanceBody = (body: Partial<CreateAttendanceDto>): string | null => {
  if (typeof body.studentId !== 'string' || !body.studentId.trim()) return 'Student ID is required';
  if (typeof body.admissionNo !== 'string' || !body.admissionNo.trim()) return 'Admission number is required';
  if (typeof body.studentName !== 'string' || !body.studentName.trim()) return 'Student name is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class is required';
  if (typeof body.section !== 'string' || !body.section.trim()) return 'Section is required';
  if (typeof body.rollNo !== 'number' || body.rollNo <= 0) return 'Roll number is required';
  if (typeof body.date !== 'string' || !body.date.trim()) return 'Date is required';
  if (typeof body.status !== 'string' || !['present', 'absent', 'leave'].includes(body.status)) return 'Valid status (present/absent/leave) is required';
  if (typeof body.markedBy !== 'string' || !body.markedBy.trim()) return 'Marked by is required';
  return null;
};

const validateBulkAttendanceBody = (body: { records: CreateAttendanceDto[] }): string | null => {
  if (!Array.isArray(body.records) || body.records.length === 0) return 'At least one attendance record is required';
  
  for (const record of body.records) {
    const error = validateAttendanceBody(record);
    if (error) return error;
  }
  return null;
};

export const getAllAttendance = async (req: Request<{}, {}, {}, AttendanceQuery>, res: Response<PaginatedAttendance | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const className = req.query.className as string;
    const section = req.query.section as string;
    const date = req.query.date as string;
    const status = req.query.status as 'present' | 'absent' | 'leave';
    const studentId = req.query.studentId as string;

    const { data, total } = await attendanceRepository.findMany({
      page, limit, className, section, date, status, studentId
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const getAttendanceByClassSectionDate = async (req: Request<{ className: string; section: string; date: string }>, res: Response<AttendanceRecord[] | { error: string }>) => {
  try {
    const { className, section, date } = req.params;
    if (!className || !section || !date) {
      return res.status(400).json({ error: 'Class name, section, and date are required' });
    }

    const records = await attendanceRepository.findByClassSectionDate(className, section, date);
    res.json(records);
  } catch (error) {
    console.error('Get attendance by class/section/date error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const getClassRosterWithStatus = async (req: Request<{ className: string; section: string; date: string }>, res: Response<ClassRoster[] | { error: string }>) => {
  try {
    const { className, section, date } = req.params;
    if (!className || !section || !date) {
      return res.status(400).json({ error: 'Class name, section, and date are required' });
    }

    const roster = await attendanceRepository.getClassRosterWithStatus(className, section, date);
    res.json(roster);
  } catch (error) {
    console.error('Get class roster with status error:', error);
    res.status(500).json({ error: 'Failed to fetch class roster' });
  }
};

export const getAttendanceSummary = async (req: Request<{ className: string; section: string; date: string }>, res: Response<AttendanceSummary | { error: string }>) => {
  try {
    const { className, section, date } = req.params;
    if (!className || !section || !date) {
      return res.status(400).json({ error: 'Class name, section, and date are required' });
    }

    const summary = await attendanceRepository.getSummary(className, section, date);
    res.json(summary);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};

export const createAttendance = async (req: Request<{}, AttendanceRecord | { error: string }, CreateAttendanceDto>, res: Response<AttendanceRecord | { error: string }>) => {
  try {
    const validationError = validateAttendanceBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const record = await attendanceRepository.upsertMany([req.body]);
    const attendance = record[0];

    getIO(req).to('attendance').emit('attendance:created', attendance);

    await createNotification(req, {
      userId: attendance.studentId,
      title: 'Attendance Marked',
      message: `Your attendance has been marked as ${attendance.status} for ${attendance.date}`,
      type: attendance.status === 'present' ? 'success' : attendance.status === 'leave' ? 'info' : 'warning',
      entityType: 'attendance',
      entityId: attendance.id.toString()
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: 'Failed to create attendance' });
  }
};

export const bulkCreateAttendance = async (req: Request<{}, AttendanceRecord[] | { error: string }, { records: CreateAttendanceDto[] }>, res: Response<AttendanceRecord[] | { error: string }>) => {
  try {
    const validationError = validateBulkAttendanceBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const records = await attendanceRepository.upsertMany(req.body.records);

    getIO(req).to('attendance').emit('attendance:bulk_created', records);

    // Notify all affected students
    for (const record of records) {
      await createNotification(req, {
        userId: record.studentId,
        title: 'Attendance Marked',
        message: `Your attendance has been marked as ${record.status} for ${record.date}`,
        type: record.status === 'present' ? 'success' : record.status === 'leave' ? 'info' : 'warning',
        entityType: 'attendance',
        entityId: record.id.toString()
      });
    }

    res.status(201).json(records);
  } catch (error) {
    console.error('Bulk create attendance error:', error);
    res.status(500).json({ error: 'Failed to create attendance records' });
  }
};

export const updateAttendance = async (req: Request<{ id: string }, AttendanceRecord | { error: string }, UpdateAttendanceDto>, res: Response<AttendanceRecord | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid attendance ID' });
    }

    // For simplicity, we'll just re-upsert with the same data but updated status
    const existing = await attendanceRepository.findMany({ page: 1, limit: 1, studentId: undefined });
    // This is a simplified update - in production you'd fetch the specific record
    
    // For now, we'll return not implemented as it requires fetching the existing record first
    return res.status(501).json({ error: 'Update not fully implemented - use bulk create with same student/date' });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

export const deleteAttendanceByClassSectionDate = async (req: Request<{ className: string; section: string; date: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const { className, section, date } = req.params;
    if (!className || !section || !date) {
      return res.status(400).json({ error: 'Class name, section, and date are required' });
    }

    const count = await attendanceRepository.deleteByClassSectionDate(className, section, date);

    getIO(req).to('attendance').emit('attendance:deleted', { className, section, date });

    await createNotification(req, {
      title: 'Attendance Deleted',
      message: `Attendance for ${className}-${section} on ${date} has been deleted (${count} records)`,
      type: 'warning',
      entityType: 'attendance',
      entityId: `${className}-${section}-${date}`
    });

    res.json({ message: `Attendance deleted successfully (${count} records removed)` });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};

export const getStudentHistory = async (req: Request<{ studentId: string }>, res: Response<AttendanceRecord[] | { error: string }>) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string || '30', 10);

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const history = await attendanceRepository.getStudentHistory(studentId, limit);
    res.json(history);
  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({ error: 'Failed to fetch student history' });
  }
};

export const getMonthlyReport = async (req: Request<{ className: string; section: string; year: string; month: string }>, res: Response<{
  month: string;
  totalDays: number;
  averageAttendance: number;
  dailyStats: { date: string; present: number; absent: number; leave: number; rate: number }[];
} | { error: string }>) => {
  try {
    const { className, section, year, month } = req.params;
    if (!className || !section || !year || !month) {
      return res.status(400).json({ error: 'Class name, section, year, and month are required' });
    }

    const report = await attendanceRepository.getMonthlyReport(
      className,
      section,
      parseInt(year, 10),
      parseInt(month, 10)
    );

    res.json(report);
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
};