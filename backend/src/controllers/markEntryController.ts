import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  markEntryRepository,
  MarkEntry,
  CreateMarkEntryDto,
  UpdateMarkEntryDto,
  BulkMarkEntryDto,
  MarkEntryQuery,
  MarksSummary,
  SubjectStats
} from '../models/MarkEntry.js';
import { examRepository } from '../models/Exam.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'marks';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'marks' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedMarkEntries {
  data: MarkEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateMarkEntryBody = (body: Partial<CreateMarkEntryDto>): string | null => {
  if (typeof body.examId !== 'number' || body.examId <= 0) return 'Exam ID is required';
  if (typeof body.examName !== 'string' || !body.examName.trim()) return 'Exam name is required';
  if (typeof body.studentId !== 'string' || !body.studentId.trim()) return 'Student ID is required';
  if (typeof body.admissionNo !== 'string' || !body.admissionNo.trim()) return 'Admission number is required';
  if (typeof body.studentName !== 'string' || !body.studentName.trim()) return 'Student name is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class name is required';
  if (typeof body.section !== 'string' || !body.section.trim()) return 'Section is required';
  if (typeof body.rollNo !== 'number' || body.rollNo <= 0) return 'Roll number is required';
  if (typeof body.subject !== 'string' || !body.subject.trim()) return 'Subject is required';
  if (typeof body.maximumMarks !== 'number' || body.maximumMarks <= 0) return 'Maximum marks is required';
  if (body.marksObtained !== null && body.marksObtained !== undefined) {
    if (typeof body.marksObtained !== 'number' || body.marksObtained < 0) return 'Marks obtained must be a non-negative number';
    if (body.marksObtained > body.maximumMarks) return 'Marks obtained cannot exceed maximum marks';
  }
  if (typeof body.enteredBy !== 'string' || !body.enteredBy.trim()) return 'Entered by is required';
  return null;
};

const validateBulkBody = (body: Partial<BulkMarkEntryDto>): string | null => {
  if (typeof body.examId !== 'number' || body.examId <= 0) return 'Exam ID is required';
  if (typeof body.examName !== 'string' || !body.examName.trim()) return 'Exam name is required';
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class name is required';
  if (typeof body.section !== 'string' || !body.section.trim()) return 'Section is required';
  if (typeof body.subject !== 'string' || !body.subject.trim()) return 'Subject is required';
  if (typeof body.maximumMarks !== 'number' || body.maximumMarks <= 0) return 'Maximum marks is required';
  if (!Array.isArray(body.entries) || body.entries.length === 0) return 'At least one entry is required';
  
  for (const entry of body.entries) {
    if (!entry.studentId || !entry.admissionNo || !entry.studentName || !entry.rollNo) {
      return 'Each entry must have studentId, admissionNo, studentName, and rollNo';
    }
    if (entry.marksObtained !== null && entry.marksObtained !== undefined) {
      if (typeof entry.marksObtained !== 'number' || entry.marksObtained < 0) return 'Marks must be non-negative';
      if (entry.marksObtained > body.maximumMarks) return `Marks for ${entry.studentName} cannot exceed maximum marks`;
    }
  }
  if (typeof body.enteredBy !== 'string' || !body.enteredBy.trim()) return 'Entered by is required';
  return null;
};

export const getAllMarkEntries = async (req: Request<{}, {}, {}, MarkEntryQuery>, res: Response<PaginatedMarkEntries | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const examId = req.query.examId ? parseInt(Array.isArray(req.query.examId) ? req.query.examId[0] : req.query.examId, 10) : undefined;
    const examName = req.query.examName as string;
    const className = req.query.className as string;
    const section = req.query.section as string;
    const subject = req.query.subject as string;
    const studentId = req.query.studentId as string;

    const { data, total } = await markEntryRepository.findMany({
      page, limit, examId, examName, className, section, subject, studentId
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all mark entries error:', error);
    res.status(500).json({ error: 'Failed to fetch mark entries' });
  }
};

export const getMarkEntryById = async (req: Request<{ id: string }>, res: Response<MarkEntry | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid mark entry ID' });
    }

    const entry = await markEntryRepository.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Mark entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Get mark entry by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch mark entry' });
  }
};

export const getMarkEntriesByExamClassSubject = async (req: Request<{ examId: string; className: string; section: string; subject: string }>, res: Response<MarkEntry[] | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { className, section, subject } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!className || !section || !subject) {
      return res.status(400).json({ error: 'Class name, section, and subject are required' });
    }

    const entries = await markEntryRepository.findByExamClassSubject(examId, className, section, subject);
    res.json(entries);
  } catch (error) {
    console.error('Get mark entries by exam/class/subject error:', error);
    res.status(500).json({ error: 'Failed to fetch mark entries' });
  }
};

export const getMarkEntriesByStudentExam = async (req: Request<{ studentId: string; examId: string }>, res: Response<MarkEntry[] | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { studentId } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const entries = await markEntryRepository.findByStudentExam(studentId, examId);
    res.json(entries);
  } catch (error) {
    console.error('Get mark entries by student/exam error:', error);
    res.status(500).json({ error: 'Failed to fetch mark entries' });
  }
};

export const getMarksSummary = async (req: Request<{ examId: string; className: string; section: string; subject: string }>, res: Response<MarksSummary | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { className, section, subject } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!className || !section || !subject) {
      return res.status(400).json({ error: 'Class name, section, and subject are required' });
    }

    const summary = await markEntryRepository.getSummary(examId, className, section, subject);
    res.json(summary);
  } catch (error) {
    console.error('Get marks summary error:', error);
    res.status(500).json({ error: 'Failed to fetch marks summary' });
  }
};

export const getSubjectStats = async (req: Request<{ examId: string; className: string; section: string }>, res: Response<SubjectStats[] | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { className, section } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!className || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const stats = await markEntryRepository.getSubjectStats(examId, className, section);
    res.json(stats);
  } catch (error) {
    console.error('Get subject stats error:', error);
    res.status(500).json({ error: 'Failed to fetch subject stats' });
  }
};

export const getStudentReportCard = async (req: Request<{ studentId: string; examId: string }>, res: Response<{
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  examName: string;
  subjects: Array<{
    subject: string;
    maximumMarks: number;
    marksObtained: number | null;
    percentage: number | null;
    grade: string | null;
    passed: boolean | null;
  }>;
  totalObtained: number;
  totalMaximum: number;
  overallPercentage: number;
  overallGrade: string;
  rank: number;
  passed: boolean;
} | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { studentId } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const reportCard = await markEntryRepository.getStudentReportCard(studentId, examId);
    if (!reportCard) {
      return res.status(404).json({ error: 'No marks found for this student in this exam' });
    }
    res.json(reportCard);
  } catch (error) {
    console.error('Get student report card error:', error);
    res.status(500).json({ error: 'Failed to fetch report card' });
  }
};

export const getClassRankList = async (req: Request<{ examId: string; className: string; section: string }>, res: Response<Array<{
  rank: number;
  studentId: string;
  admissionNo: string;
  studentName: string;
  totalObtained: number;
  totalMaximum: number;
  percentage: number;
  grade: string;
  passed: boolean;
}> | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { className, section } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!className || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const rankList = await markEntryRepository.getClassRankList(examId, className, section);
    res.json(rankList);
  } catch (error) {
    console.error('Get class rank list error:', error);
    res.status(500).json({ error: 'Failed to fetch rank list' });
  }
};

export const createMarkEntry = async (req: Request<{}, MarkEntry | { error: string }, CreateMarkEntryDto>, res: Response<MarkEntry | { error: string }>) => {
  try {
    const validationError = validateMarkEntryBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verify exam exists
    const exam = await examRepository.findById(req.body.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Referenced exam does not exist' });
    }

    const entry = await markEntryRepository.create(req.body);

    getIO(req).to('marks').emit('marks:created', entry);

    await createNotification(req, {
      userId: entry.studentId,
      title: 'Marks Entered',
      message: `Your ${entry.subject} marks (${entry.marksObtained}/${entry.maximumMarks}) have been entered for ${entry.examName}`,
      type: entry.passed ? 'success' : 'warning',
      entityType: 'marks',
      entityId: entry.id.toString()
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Create mark entry error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Marks for this student and subject already exist' });
    }
    res.status(500).json({ error: 'Failed to create mark entry' });
  }
};

export const bulkCreateMarkEntries = async (req: Request<{}, MarkEntry[] | { error: string }, BulkMarkEntryDto>, res: Response<MarkEntry[] | { error: string }>) => {
  try {
    const validationError = validateBulkBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verify exam exists
    const exam = await examRepository.findById(req.body.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Referenced exam does not exist' });
    }

    const entries = await markEntryRepository.bulkCreate(req.body);

    getIO(req).to('marks').emit('marks:bulk_created', entries);

    // Notify all students
    for (const entry of entries) {
      await createNotification(req, {
        userId: entry.studentId,
        title: 'Marks Entered',
        message: `Your ${entry.subject} marks (${entry.marksObtained}/${entry.maximumMarks}) have been entered for ${entry.examName}`,
        type: entry.passed ? 'success' : 'warning',
        entityType: 'marks',
        entityId: entry.id.toString()
      });
    }

    res.status(201).json(entries);
  } catch (error) {
    console.error('Bulk create mark entries error:', error);
    res.status(500).json({ error: 'Failed to create mark entries' });
  }
};

export const updateMarkEntry = async (req: Request<{ id: string }, MarkEntry | { error: string }, UpdateMarkEntryDto>, res: Response<MarkEntry | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid mark entry ID' });
    }

    const entry = await markEntryRepository.update(id, req.body);
    if (!entry) {
      return res.status(404).json({ error: 'Mark entry not found' });
    }

    getIO(req).to('marks').emit('marks:updated', entry);

    await createNotification(req, {
      userId: entry.studentId,
      title: 'Marks Updated',
      message: `Your ${entry.subject} marks have been updated to ${entry.marksObtained}/${entry.maximumMarks}`,
      type: entry.passed ? 'info' : 'warning',
      entityType: 'marks',
      entityId: entry.id.toString()
    });

    res.json(entry);
  } catch (error) {
    console.error('Update mark entry error:', error);
    res.status(500).json({ error: 'Failed to update mark entry' });
  }
};

export const deleteMarkEntry = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid mark entry ID' });
    }

    const entry = await markEntryRepository.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Mark entry not found' });
    }

    await markEntryRepository.delete(id);

    getIO(req).to('marks').emit('marks:deleted', { id });

    await createNotification(req, {
      title: 'Marks Deleted',
      message: `${entry.subject} marks for ${entry.studentName} have been deleted`,
      type: 'warning',
      entityType: 'marks',
      entityId: entry.id.toString()
    });

    res.json({ message: 'Mark entry deleted successfully' });
  } catch (error) {
    console.error('Delete mark entry error:', error);
    res.status(500).json({ error: 'Failed to delete mark entry' });
  }
};