import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  classResultRepository,
  ClassResult,
  PublishResultDto,
  ClassResultQuery
} from '../models/ClassResult.js';
import { examRepository } from '../models/Exam.js';
import { markEntryRepository } from '../models/MarkEntry.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'class_result';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'class_result' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedClassResults {
  data: ClassResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllClassResults = async (req: Request<{}, {}, {}, ClassResultQuery>, res: Response<PaginatedClassResults | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const examId = req.query.examId ? parseInt(Array.isArray(req.query.examId) ? req.query.examId[0] : req.query.examId, 10) : undefined;
    const className = req.query.className as string;
    const section = req.query.section as string;
    const published = req.query.published !== undefined ? String(req.query.published) === 'true' : undefined;

    const { data, total } = await classResultRepository.findMany({
      page, limit, examId, className, section, published
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all class results error:', error);
    res.status(500).json({ error: 'Failed to fetch class results' });
  }
};

export const getClassResultsByExamClassSection = async (req: Request<{ examId: string; className: string; section: string }>, res: Response<ClassResult[] | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { className, section } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!className || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const results = await classResultRepository.findByExamClassSection(examId, className, section);
    res.json(results);
  } catch (error) {
    console.error('Get class results by exam/class/section error:', error);
    res.status(500).json({ error: 'Failed to fetch class results' });
  }
};

export const getClassResultSummary = async (req: Request<{ examId: string; className: string; section: string }>, res: Response<{
  totalStudents: number;
  passed: number;
  failed: number;
  averagePercentage: number;
  passRate: number;
  gradeDistribution: Array<{ grade: string; count: number; range: string }>;
  subjectAverages: Array<{ subject: string; average: number }>;
} | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { className, section } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!className || !section) {
      return res.status(400).json({ error: 'Class name and section are required' });
    }

    const summary = await classResultRepository.getSummary(examId, className, section);
    res.json(summary);
  } catch (error) {
    console.error('Get class result summary error:', error);
    res.status(500).json({ error: 'Failed to fetch class result summary' });
  }
};

export const getClassRankList = async (req: Request<{ examId: string; className: string; section: string }>, res: Response<Array<{
  rank: number;
  admissionNo: string;
  studentName: string;
  totalObtained: number;
  totalMaximum: number;
  overallPercentage: number;
  overallGrade: string;
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

    const rankList = await classResultRepository.getRankList(examId, className, section);
    res.json(rankList);
  } catch (error) {
    console.error('Get class rank list error:', error);
    res.status(500).json({ error: 'Failed to fetch rank list' });
  }
};

export const getStudentReportCard = async (req: Request<{ examId: string; studentId: string }>, res: Response<any | { error: string }>) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { studentId } = req.params;

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const reportCard = await classResultRepository.getStudentReportCard(examId, studentId);
    if (!reportCard) {
      return res.status(404).json({ error: 'No result found for this student in this exam' });
    }
    res.json(reportCard);
  } catch (error) {
    console.error('Get student report card error:', error);
    res.status(500).json({ error: 'Failed to fetch report card' });
  }
};

export const generateResults = async (req: Request<{}, ClassResult[] | { error: string }, { examId: number; className: string; section: string }>, res: Response<ClassResult[] | { error: string }>) => {
  try {
    const { examId, className, section } = req.body;

    if (!examId || !className || !section) {
      return res.status(400).json({ error: 'Exam ID, class name, and section are required' });
    }

    // Verify exam exists
    const exam = await examRepository.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Generate results from mark entries
    const results = await classResultRepository.generateFromMarkEntries(examId, className, section, markEntryRepository);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'No marks found for this exam/class/section' });
    }

    // Save results
    const savedResults = await classResultRepository.upsertMany(results);

    getIO(req).to('class_results').emit('results:generated', { examId, className, section, count: savedResults.length });

    await createNotification(req, {
      title: 'Class Results Generated',
      message: `Results for ${className}-${section} (${exam.name}) have been generated for ${savedResults.length} students`,
      type: 'success',
      entityType: 'class_result',
      entityId: `${examId}-${className}-${section}`
    });

    res.status(201).json(savedResults);
  } catch (error) {
    console.error('Generate results error:', error);
    res.status(500).json({ error: 'Failed to generate results' });
  }
};

export const publishResults = async (req: Request<{}, { count: number } | { error: string }, PublishResultDto>, res: Response<{ count: number } | { error: string }>) => {
  try {
    const { examId, className, section, publishedBy } = req.body;

    if (!examId || !className || !section || !publishedBy) {
      return res.status(400).json({ error: 'Exam ID, class name, section, and published by are required' });
    }

    // Verify results exist
    const results = await classResultRepository.findByExamClassSection(examId, className, section);
    if (results.length === 0) {
      return res.status(404).json({ error: 'No results found to publish' });
    }

    const count = await classResultRepository.publishResults(examId, className, section, publishedBy);

    getIO(req).to('class_results').emit('results:published', { examId, className, section, count });

    // Notify all students
    for (const result of results) {
      await createNotification(req, {
        userId: result.studentId,
        title: 'Results Published',
        message: `Your ${results[0].examName} results for ${className}-${section} are now available`,
        type: result.passed ? 'success' : 'warning',
        entityType: 'class_result',
        entityId: `${examId}-${result.studentId}`
      });
    }

    res.json({ count });
  } catch (error) {
    console.error('Publish results error:', error);
    res.status(500).json({ error: 'Failed to publish results' });
  }
};

export const unpublishResults = async (req: Request<{}, { count: number } | { error: string }, { examId: number; className: string; section: string }>, res: Response<{ count: number } | { error: string }>) => {
  try {
    const { examId, className, section } = req.body;

    if (!examId || !className || !section) {
      return res.status(400).json({ error: 'Exam ID, class name, and section are required' });
    }

    const count = await classResultRepository.unpublishResults(examId, className, section);

    getIO(req).to('class_results').emit('results:unpublished', { examId, className, section, count });

    res.json({ count });
  } catch (error) {
    console.error('Unpublish results error:', error);
    res.status(500).json({ error: 'Failed to unpublish results' });
  }
};