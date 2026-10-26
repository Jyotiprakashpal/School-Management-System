import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  examScheduleRepository,
  ExamSchedule,
  CreateExamScheduleDto,
  UpdateExamScheduleDto,
  ExamScheduleQuery,
  ExamScheduleStats,
  NextPaper,
  RoomUsage
} from '../models/ExamSchedule.js';
import { examRepository } from '../models/Exam.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'exam_schedule';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'exam_schedule' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedExamSchedules {
  data: ExamSchedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateScheduleBody = (body: Partial<CreateExamScheduleDto>): string | null => {
  if (typeof body.examName !== 'string' || !body.examName.trim()) return 'Exam name is required';
  if (typeof body.subject !== 'string' || !body.subject.trim()) return 'Subject is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class name is required';
  if (typeof body.date !== 'string' || !body.date.trim()) return 'Date is required';
  if (typeof body.startTime !== 'string' || !body.startTime.trim()) return 'Start time is required';
  if (typeof body.endTime !== 'string' || !body.endTime.trim()) return 'End time is required';
  if (body.endTime <= body.startTime) return 'End time must be after start time';
  if (typeof body.room !== 'string' || !body.room.trim()) return 'Room is required';
  if (typeof body.invigilator !== 'string' || !body.invigilator.trim()) return 'Invigilator is required';
  if (typeof body.maxMarks !== 'number' || body.maxMarks < 1) return 'Maximum marks must be at least 1';
  return null;
};

export const getAllExamSchedules = async (req: Request<{}, {}, {}, ExamScheduleQuery>, res: Response<PaginatedExamSchedules | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const examId = req.query.examId ? parseInt(Array.isArray(req.query.examId) ? req.query.examId[0] : req.query.examId, 10) : undefined;
    const examName = req.query.examName as string;
    const className = req.query.className as string;
    const subject = req.query.subject as string;
    const date = req.query.date as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const room = req.query.room as string;
    const invigilator = req.query.invigilator as string;

    const { data, total } = await examScheduleRepository.findMany({
      page, limit, examId, examName, className, subject, date, startDate, endDate, room, invigilator
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all exam schedules error:', error);
    res.status(500).json({ error: 'Failed to fetch exam schedules' });
  }
};

export const getExamScheduleById = async (req: Request<{ id: string }>, res: Response<ExamSchedule | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const schedule = await examScheduleRepository.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error('Get exam schedule by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

export const getExamSchedulesByExam = async (req: Request<{ examId: string }>, res: Response<ExamSchedule[] | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const schedules = await examScheduleRepository.findByExamId(examId);
    res.json(schedules);
  } catch (error) {
    console.error('Get exam schedules by exam error:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const getExamSchedulesByClassDate = async (req: Request<{ className: string; date: string }>, res: Response<ExamSchedule[] | { error: string }>) => {
  try {
    const { className, date } = req.params;
    if (!className || !date) {
      return res.status(400).json({ error: 'Class name and date are required' });
    }

    const schedules = await examScheduleRepository.findByClassDate(className, date);
    res.json(schedules);
  } catch (error) {
    console.error('Get exam schedules by class/date error:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const getExamScheduleStats = async (req: Request<{}, {}, {}, { examName?: string; className?: string }>, res: Response<{
  totalPapers: number;
  examDays: number;
  roomsUsed: number;
  invigilators: number;
  totalMarks: number;
} | { error: string }>) => {
  try {
    const examName = req.query.examName as string;
    const className = req.query.className as string;

    const stats = await examScheduleRepository.getStats(examName, className);
    res.json(stats);
  } catch (error) {
    console.error('Get exam schedule stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getNextPaper = async (req: Request<{}, {}, {}, { examName?: string; className?: string }>, res: Response<ExamSchedule | null | { error: string }>) => {
  try {
    const examName = req.query.examName as string;
    const className = req.query.className as string;

    const nextPaper = await examScheduleRepository.getNextPaper(examName, className);
    res.json(nextPaper);
  } catch (error) {
    console.error('Get next paper error:', error);
    res.status(500).json({ error: 'Failed to fetch next paper' });
  }
};

export const getRoomUsage = async (req: Request<{}, {}, {}, { examName?: string; className?: string }>, res: Response<Array<{ room: string; count: number }> | { error: string }>) => {
  try {
    const examName = req.query.examName as string;
    const className = req.query.className as string;

    const usage = await examScheduleRepository.getRoomUsage(examName, className);
    res.json(usage);
  } catch (error) {
    console.error('Get room usage error:', error);
    res.status(500).json({ error: 'Failed to fetch room usage' });
  }
};

export const getCompletedCount = async (req: Request<{}, {}, {}, { examName?: string; className?: string }>, res: Response<{ count: number } | { error: string }>) => {
  try {
    const examName = req.query.examName as string;
    const className = req.query.className as string;

    const count = await examScheduleRepository.getCompletedCount(examName, className);
    res.json({ count });
  } catch (error) {
    console.error('Get completed count error:', error);
    res.status(500).json({ error: 'Failed to fetch completed count' });
  }
};

export const createExamSchedule = async (req: Request<{}, ExamSchedule | { error: string }, CreateExamScheduleDto>, res: Response<ExamSchedule | { error: string }>) => {
  try {
    const validationError = validateScheduleBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check room conflict
    const roomConflict = await examScheduleRepository.checkRoomConflict(
      req.body.room, req.body.date, req.body.startTime, req.body.endTime
    );
    if (roomConflict) {
      return res.status(409).json({ error: `${req.body.room} is already occupied during the selected time` });
    }

    // Check invigilator conflict
    const invigilatorConflict = await examScheduleRepository.checkInvigilatorConflict(
      req.body.invigilator, req.body.date, req.body.startTime, req.body.endTime
    );
    if (invigilatorConflict) {
      return res.status(409).json({ error: `${req.body.invigilator} is already invigilating another paper at this time` });
    }

    // Check duplicate subject for same exam and class
    const duplicateSubject = await examScheduleRepository.checkDuplicateSubject(
      req.body.examName, req.body.className, req.body.subject
    );
    if (duplicateSubject) {
      return res.status(409).json({ error: `${req.body.subject} is already scheduled for ${req.body.className} in this examination` });
    }

    // If examId provided, verify it exists
    if (req.body.examId) {
      const exam = await examRepository.findById(req.body.examId);
      if (!exam) {
        return res.status(400).json({ error: 'Referenced exam does not exist' });
      }
    }

    const schedule = await examScheduleRepository.create(req.body);

    getIO(req).to('exam_schedules').emit('schedule:created', schedule);

    await createNotification(req, {
      title: 'Exam Scheduled',
      message: `${schedule.subject} scheduled for ${schedule.className} on ${schedule.date} (${schedule.startTime}-${schedule.endTime})`,
      type: 'success',
      entityType: 'exam_schedule',
      entityId: schedule.id.toString()
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Create exam schedule error:', error);
    res.status(500).json({ error: 'Failed to create exam schedule' });
  }
};

export const updateExamSchedule = async (req: Request<{ id: string }, ExamSchedule | { error: string }, UpdateExamScheduleDto>, res: Response<ExamSchedule | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const current = await examScheduleRepository.findById(id);
    if (!current) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Check room conflict (excluding current)
    if (req.body.room && req.body.date && req.body.startTime && req.body.endTime) {
      const roomConflict = await examScheduleRepository.checkRoomConflict(
        req.body.room, req.body.date, req.body.startTime, req.body.endTime, id
      );
      if (roomConflict) {
        return res.status(409).json({ error: `${req.body.room} is already occupied during the selected time` });
      }
    }

    // Check invigilator conflict
    if (req.body.invigilator && req.body.date && req.body.startTime && req.body.endTime) {
      const invigilatorConflict = await examScheduleRepository.checkInvigilatorConflict(
        req.body.invigilator, req.body.date, req.body.startTime, req.body.endTime, id
      );
      if (invigilatorConflict) {
        return res.status(409).json({ error: `${req.body.invigilator} is already invigilating another paper at this time` });
      }
    }

    // Check duplicate subject
    if (req.body.examName && req.body.className && req.body.subject) {
      const duplicateSubject = await examScheduleRepository.checkDuplicateSubject(
        req.body.examName, req.body.className, req.body.subject, id
      );
      if (duplicateSubject) {
        return res.status(409).json({ error: `${req.body.subject} is already scheduled for ${req.body.className} in this examination` });
      }
    }

    const schedule = await examScheduleRepository.update(id, req.body);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    getIO(req).to('exam_schedules').emit('schedule:updated', schedule);

    await createNotification(req, {
      title: 'Exam Schedule Updated',
      message: `${schedule.subject} schedule for ${schedule.className} has been updated`,
      type: 'info',
      entityType: 'exam_schedule',
      entityId: schedule.id.toString()
    });

    res.json(schedule);
  } catch (error) {
    console.error('Update exam schedule error:', error);
    res.status(500).json({ error: 'Failed to update exam schedule' });
  }
};

export const duplicateExamSchedule = async (req: Request<{ id: string }, ExamSchedule | { error: string }>, res: Response<ExamSchedule | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const schedule = await examScheduleRepository.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Create duplicate with next day
    const nextDate = new Date(schedule.date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const duplicated = await examScheduleRepository.create({
      examId: schedule.examId ?? undefined,
      examName: schedule.examName,
      subject: '',
      className: schedule.className,
      date: nextDateStr,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
      invigilator: schedule.invigilator,
      maxMarks: schedule.maxMarks
    });

    getIO(req).to('exam_schedules').emit('schedule:created', duplicated);

    await createNotification(req, {
      title: 'Schedule Duplicated',
      message: `${schedule.subject} was duplicated to ${nextDateStr}. Update the subject.`,
      type: 'info',
      entityType: 'exam_schedule',
      entityId: duplicated.id.toString()
    });

    res.status(201).json(duplicated);
  } catch (error) {
    console.error('Duplicate schedule error:', error);
    res.status(500).json({ error: 'Failed to duplicate schedule' });
  }
};

export const deleteExamSchedule = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const schedule = await examScheduleRepository.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await examScheduleRepository.delete(id);

    getIO(req).to('exam_schedules').emit('schedule:deleted', { id });

    await createNotification(req, {
      title: 'Exam Schedule Deleted',
      message: `${schedule.subject} on ${schedule.date} has been deleted`,
      type: 'warning',
      entityType: 'exam_schedule',
      entityId: schedule.id.toString()
    });

    res.json({ message: 'Exam schedule deleted successfully' });
  } catch (error) {
    console.error('Delete exam schedule error:', error);
    res.status(500).json({ error: 'Failed to delete exam schedule' });
  }
};

export const deleteAllByExam = async (req: Request<{ examId: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const count = await examScheduleRepository.deleteByExamId(examId);

    getIO(req).to('exam_schedules').emit('schedule:bulk_deleted', { examId, count });

    await createNotification(req, {
      title: 'Exam Schedules Deleted',
      message: `All ${count} schedules for exam ID ${examId} have been deleted`,
      type: 'warning',
      entityType: 'exam_schedule',
      entityId: examId.toString()
    });

    res.json({ message: `Deleted ${count} schedules for exam ${examId}` });
  } catch (error) {
    console.error('Delete all by exam error:', error);
    res.status(500).json({ error: 'Failed to delete schedules' });
  }
};