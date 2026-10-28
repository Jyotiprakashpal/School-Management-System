import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { reportRepository } from '../models/Report.js';
import { notificationRepository } from '../models/Notification.js';
import { cashflowRepository } from '../models/Cashflow.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'report';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'report' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedTemplates {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedGenerated {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllTemplates = async (req: Request<{}, {}, {}, { page?: string; limit?: string; category?: string; search?: string }>, res: Response<PaginatedTemplates | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const category = req.query.category as string;
    const search = req.query.search as string;

    const templates = await reportRepository.findManyTemplates({
      category, search
    });

    const total = templates.length;

    res.json({
      data: templates.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const getTemplateById = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const template = await reportRepository.findTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

export const getTemplateCategories = async (req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const templates = await reportRepository.findManyTemplates({});
    const categories = [...new Set(templates.map(t => t.category))];
    res.json(categories);
  } catch (error) {
    console.error('Get template categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getAllGeneratedReports = async (req: Request<{}, {}, {}, { page?: string; limit?: string; category?: string; status?: string; search?: string }>, res: Response<PaginatedGenerated | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const category = req.query.category as string;
    const status = req.query.status as 'Ready' | 'Scheduled' | 'Generating';
    const search = req.query.search as string;

    const { data, total } = await reportRepository.findManyGenerated({
      category, status, search
    });

    res.json({
      data: data.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all generated reports error:', error);
    res.status(500).json({ error: 'Failed to fetch generated reports' });
  }
};

export const getGeneratedReportById = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await reportRepository.findGeneratedById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Get generated report by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const getReportStats = async (req: Request, res: Response<any | { error: string }>) => {
  try {
    const stats = await reportRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ error: 'Failed to fetch report stats' });
  }
};

export const generateReport = async (req: Request<{}, any | { error: string }, any>, res: Response<any | { error: string }>) => {
  try {
    const { templateId, title, description, category, format, period, configuration, status } = req.body;

    if (!title || !category || !format) {
      return res.status(400).json({ error: 'Title, category, and format are required' });
    }

    if (templateId) {
      const template = await reportRepository.findTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    const generated = await reportRepository.createGenerated({
      templateId,
      title: title || 'Untitled Report',
      description: description || '',
      category,
      format,
      period: period || 'Run Once',
      configuration: configuration || {},
      status: status || 'Generating'
    });

    getIO(req).to('reports').emit('report:created', generated);

    await createNotification(req, {
      title: 'Report Generation Started',
      message: `Report "${generated.title}" is being generated`,
      type: 'info',
      entityType: 'report',
      entityId: generated.id.toString()
    });

    // Simulate report generation
    setTimeout(async () => {
      try {
        const updated = await reportRepository.updateGenerated(generated.id, {
          status: 'Ready',
          filePath: `/reports/${generated.id}.${generated.format.toLowerCase()}`,
          size: '1.2 MB'
        });

        if (!updated) {
          console.error('Failed to update report status');
          return;
        }

        getIO(req).to('reports').emit('report:ready', updated);

        await createNotification(req, {
          title: 'Report Ready',
          message: `Report "${updated.title}" is ready to download`,
          type: 'success',
          entityType: 'report',
          entityId: updated.id.toString()
        });
      } catch (error) {
        console.error('Report generation completion error:', error);
      }
    }, 3000);

    res.status(201).json(generated);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const scheduleReport = async (req: Request<{}, any | { error: string }, any>, res: Response<any | { error: string }>) => {
  try {
    const { templateId, title, description, category, format, period, configuration } = req.body;

    if (!title || !category || !format || !period) {
      return res.status(400).json({ error: 'Title, category, format, and period are required' });
    }

    if (templateId) {
      const template = await reportRepository.findTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    const generated = await reportRepository.createGenerated({
      templateId,
      title: title || 'Scheduled Report',
      description: description || '',
      category,
      format,
      period,
      configuration: configuration || {},
      status: 'Scheduled'
    });

    getIO(req).to('reports').emit('report:scheduled', generated);

    await createNotification(req, {
      title: 'Report Scheduled',
      message: `Report "${generated.title}" has been scheduled to run ${generated.period.toLowerCase()}`,
      type: 'info',
      entityType: 'report',
      entityId: generated.id.toString()
    });

    res.status(201).json(generated);
  } catch (error) {
    console.error('Schedule report error:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
};

export const getGeneratedReportFile = async (req: Request<{ id: string }>, res: Response<any | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await reportRepository.findGeneratedById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status === 'Scheduled') {
      return res.status(400).json({ error: 'Report is scheduled and not yet ready' });
    }

    if (report.status === 'Generating') {
      return res.status(400).json({ error: 'Report is still being generated' });
    }

    if (!report.filePath) {
      return res.status(404).json({ error: 'Report file not available' });
    }

    // In a real implementation, you would serve the actual file
    // For now, we'll return a mock response
    res.json({
      message: 'File download would start here',
      filePath: report.filePath,
      fileName: `${report.title}.${report.format.toLowerCase()}`
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
};

export const deleteGeneratedReport = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await reportRepository.findGeneratedById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await reportRepository.deleteGenerated(id);

    getIO(req).to('reports').emit('report:deleted', { id });

    await createNotification(req, {
      title: 'Report Deleted',
      message: `Report "${report.title}" has been deleted`,
      type: 'warning',
      entityType: 'report',
      entityId: report.id.toString()
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

export const getFinancialReportData = async (req: Request<{}, {}, {}, { academicYear?: string; fromDate?: string; toDate?: string }>, res: Response<any | { error: string }>) => {
  try {
    const academicYear = req.query.academicYear as string || '2026–27';
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const summary = await cashflowRepository.getSummary(academicYear, fromDate, toDate);
    const expenseStats = await cashflowRepository.getExpenseStats(academicYear, fromDate, toDate);

    res.json({
      summary,
      expenseStats,
      academicYear,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get financial report data error:', error);
    res.status(500).json({ error: 'Failed to fetch financial report data' });
  }
};

export const getAcademicReportData = async (req: Request<{}, {}, {}, { examId?: string; className?: string; section?: string }>, res: Response<any | { error: string }>) => {
  try {
    // This would integrate with exam/mark entry repositories
    // For now, return mock structure
    res.json({
      message: 'Academic report data endpoint - integrate with exam/mark entry repositories',
      availableEndpoints: [
        '/api/reports/academic/class-result/:examId/:className/:section',
        '/api/reports/academic/student-report/:studentId/:examId',
        '/api/reports/academic/rank-list/:examId/:className/:section'
      ]
    });
  } catch (error) {
    console.error('Get academic report data error:', error);
    res.status(500).json({ error: 'Failed to fetch academic report data' });
  }
};

export const getAttendanceReportData = async (req: Request<{}, {}, {}, { className?: string; section?: string; date?: string; fromDate?: string; toDate?: string }>, res: Response<any | { error: string }>) => {
  try {
    // This would integrate with attendance repository
    res.json({
      message: 'Attendance report data endpoint - integrate with attendance repository',
      availableEndpoints: [
        '/api/reports/attendance/class/:className/section/:section/date/:date',
        '/api/reports/attendance/summary/:className/:section/:date',
        '/api/reports/attendance/monthly/:className/:section/:year/:month'
      ]
    });
  } catch (error) {
    console.error('Get attendance report data error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance report data' });
  }
};

export const getStudentReportData = async (req: Request<{}, {}, {}, { className?: string; section?: string; academicYear?: string }>, res: Response<any | { error: string }>) => {
  try {
    // This would integrate with student repository
    res.json({
      message: 'Student report data endpoint - integrate with student repository',
      availableEndpoints: [
        '/api/reports/students/register/:academicYear',
        '/api/reports/students/class-wise/:academicYear'
      ]
    });
  } catch (error) {
    console.error('Get student report data error:', error);
    res.status(500).json({ error: 'Failed to fetch student report data' });
  }
};