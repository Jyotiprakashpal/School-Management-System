import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  classSubjectMapRepository,
  ClassSubjectMap,
  CreateClassSubjectMapDto,
  UpdateClassSubjectMapDto,
  ClassSubjectMapQuery,
  ClassSubjectMapStats
} from '../models/ClassSubjectMap.js';
import { subjectRepository } from '../models/Subject.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'class_subject_map';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'class_subject_map' as any
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedClassSubjectMaps {
  data: ClassSubjectMap[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateMapBody = (body: Partial<CreateClassSubjectMapDto>): string | null => {
  if (typeof body.className !== 'string' || !body.className.trim()) return 'Class name is required';
  if (typeof body.section !== 'string' || !body.section.trim()) return 'Section is required';
  if (typeof body.year !== 'string' || !body.year.trim()) return 'Academic year is required';
  if (typeof body.subjectCode !== 'string' || !body.subjectCode.trim()) return 'Subject code is required';
  if (typeof body.subjectName !== 'string' || !body.subjectName.trim()) return 'Subject name is required';
  if (typeof body.teacher !== 'string' || !body.teacher.trim()) return 'Teacher is required';
  if (typeof body.periods !== 'number' || body.periods < 1 || body.periods > 12) return 'Periods must be between 1 and 12';
  if (body.type && !['Required', 'Optional'].includes(body.type)) return 'Type must be Required or Optional';
  return null;
};

export const getAllClassSubjectMaps = async (req: Request<{}, {}, {}, ClassSubjectMapQuery>, res: Response<PaginatedClassSubjectMaps | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const className = req.query.className as string;
    const section = req.query.section as string;
    const year = req.query.year as string;
    const teacher = req.query.teacher as string;
    const type = req.query.type as string;

    const { data, total } = await classSubjectMapRepository.findMany({
      page, limit, className, section, year, teacher, type
    });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all class subject maps error:', error);
    res.status(500).json({ error: 'Failed to fetch class subject maps' });
  }
};

export const getClassSubjectMapById = async (req: Request<{ id: string }>, res: Response<ClassSubjectMap | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid mapping ID' });
    }

    const map = await classSubjectMapRepository.findById(id);
    if (!map) {
      return res.status(404).json({ error: 'Class subject map not found' });
    }
    res.json(map);
  } catch (error) {
    console.error('Get class subject map by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch class subject map' });
  }
};

export const getClassSubjectMapsByClassSectionYear = async (req: Request<{ className: string; section: string; year: string }>, res: Response<ClassSubjectMap[] | { error: string }>) => {
  try {
    const { className, section, year } = req.params;
    if (!className || !section || !year) {
      return res.status(400).json({ error: 'Class name, section, and year are required' });
    }

    const maps = await classSubjectMapRepository.findByClassSectionYear(className, section, year);
    res.json(maps);
  } catch (error) {
    console.error('Get class subject maps by class/section/year error:', error);
    res.status(500).json({ error: 'Failed to fetch class subject maps' });
  }
};

export const getClassSubjectMapStats = async (req: Request<{ className: string; section: string; year: string }>, res: Response<ClassSubjectMapStats | { error: string }>) => {
  try {
    const { className, section, year } = req.params;
    if (!className || !section || !year) {
      return res.status(400).json({ error: 'Class name, section, and year are required' });
    }

    const stats = await classSubjectMapRepository.getStats(className, section, year);
    res.json(stats);
  } catch (error) {
    console.error('Get class subject map stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getClassSubjectMapYears = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const years = await classSubjectMapRepository.getYears();
    res.json(years);
  } catch (error) {
    console.error('Get class subject map years error:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
};

export const getClassSubjectMapClasses = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const classes = await classSubjectMapRepository.getClasses();
    res.json(classes);
  } catch (error) {
    console.error('Get class subject map classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

export const getClassSubjectMapSections = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const sections = await classSubjectMapRepository.getSections();
    res.json(sections);
  } catch (error) {
    console.error('Get class subject map sections error:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};

export const getClassSubjectMapTeachers = async (_req: Request, res: Response<string[] | { error: string }>) => {
  try {
    const teachers = await classSubjectMapRepository.getTeachers();
    res.json(teachers);
  } catch (error) {
    console.error('Get class subject map teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

export const createClassSubjectMap = async (req: Request<{}, ClassSubjectMap | { error: string }, CreateClassSubjectMapDto>, res: Response<ClassSubjectMap | { error: string }>) => {
  try {
    const validationError = validateMapBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const isDuplicate = await classSubjectMapRepository.checkDuplicate(
      req.body.className, req.body.section, req.body.year, req.body.subjectCode
    );
    if (isDuplicate) {
      return res.status(409).json({ error: 'Subject with this code already mapped to this class/section/year' });
    }

    // Verify subject exists in catalog (optional but recommended)
    const subject = await subjectRepository.findByCode(req.body.subjectCode);
    if (!subject) {
      return res.status(400).json({ error: 'Subject code does not exist in subject catalog' });
    }

    const map = await classSubjectMapRepository.create(req.body);

    getIO(req).to('class_subject_maps').emit('map:created', map);

    await createNotification(req, {
      title: 'Subject Mapped',
      message: `${map.subjectName} (${map.subjectCode}) mapped to ${map.className}-${map.section} for ${map.year}`,
      type: 'success',
      entityType: 'class_subject_map',
      entityId: map.id.toString()
    });

    res.status(201).json(map);
  } catch (error) {
    console.error('Create class subject map error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Subject with this code already mapped to this class/section/year' });
    }
    res.status(500).json({ error: 'Failed to create class subject map' });
  }
};

export const updateClassSubjectMap = async (req: Request<{ id: string }, ClassSubjectMap | { error: string }, UpdateClassSubjectMapDto>, res: Response<ClassSubjectMap | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid mapping ID' });
    }

    const current = await classSubjectMapRepository.findById(id);
    if (!current) {
      return res.status(404).json({ error: 'Class subject map not found' });
    }

    if (req.body.subjectCode && req.body.subjectCode !== current.subjectCode) {
      const isDuplicate = await classSubjectMapRepository.checkDuplicate(
        current.className, current.section, current.year, req.body.subjectCode, id
      );
      if (isDuplicate) {
        return res.status(409).json({ error: 'Subject with this code already mapped to this class/section/year' });
      }
    }

    // Verify subject exists if subjectCode is being changed
    if (req.body.subjectCode) {
      const subject = await subjectRepository.findByCode(req.body.subjectCode);
      if (!subject) {
        return res.status(400).json({ error: 'Subject code does not exist in subject catalog' });
      }
    }

    const map = await classSubjectMapRepository.update(id, req.body);
    if (!map) {
      return res.status(404).json({ error: 'Class subject map not found' });
    }

    getIO(req).to('class_subject_maps').emit('map:updated', map);

    await createNotification(req, {
      title: 'Class Subject Map Updated',
      message: `Mapping for ${map.subjectName} in ${map.className}-${map.section} has been updated`,
      type: 'info',
      entityType: 'class_subject_map',
      entityId: map.id.toString()
    });

    res.json(map);
  } catch (error) {
    console.error('Update class subject map error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Subject with this code already mapped to this class/section/year' });
    }
    res.status(500).json({ error: 'Failed to update class subject map' });
  }
};

export const deleteClassSubjectMap = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid mapping ID' });
    }

    const map = await classSubjectMapRepository.findById(id);
    if (!map) {
      return res.status(404).json({ error: 'Class subject map not found' });
    }

    await classSubjectMapRepository.delete(id);

    getIO(req).to('class_subject_maps').emit('map:deleted', { id });

    await createNotification(req, {
      title: 'Class Subject Map Deleted',
      message: `Mapping for ${map.subjectName} in ${map.className}-${map.section} has been deleted`,
      type: 'warning',
      entityType: 'class_subject_map',
      entityId: map.id.toString()
    });

    res.json({ message: 'Class subject map deleted successfully' });
  } catch (error) {
    console.error('Delete class subject map error:', error);
    res.status(500).json({ error: 'Failed to delete class subject map' });
  }
};

export const deleteClassSubjectMapByClassSectionYear = async (req: Request<{ className: string; section: string; year: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const { className, section, year } = req.params;
    if (!className || !section || !year) {
      return res.status(400).json({ error: 'Class name, section, and year are required' });
    }

    const count = await classSubjectMapRepository.deleteByClassSectionYear(className, section, year);

    getIO(req).to('class_subject_maps').emit('map:bulk_deleted', { className, section, year, count });

    await createNotification(req, {
      title: 'Class Subject Mappings Deleted',
      message: `${count} subject mappings for ${className}-${section} in ${year} have been deleted`,
      type: 'warning',
      entityType: 'class_subject_map',
      entityId: `${className}-${section}-${year}`
    });

    res.json({ message: `Deleted ${count} mappings for ${className}-${section} in ${year}` });
  } catch (error) {
    console.error('Delete class subject maps by class/section/year error:', error);
    res.status(500).json({ error: 'Failed to delete class subject maps' });
  }
};

export const copyClassSubjectMap = async (req: Request<{}, { copied: number; skipped: number } | { error: string }, { sourceClassName: string; sourceSection: string; sourceYear: string; targetClassName: string; targetSection: string; targetYear: string }>, res: Response<{ copied: number; skipped: number } | { error: string }>) => {
  try {
    const { sourceClassName, sourceSection, sourceYear, targetClassName, targetSection, targetYear } = req.body;

    if (!sourceClassName || !sourceSection || !sourceYear || !targetClassName || !targetSection || !targetYear) {
      return res.status(400).json({ error: 'Source and target class, section, and year are required' });
    }

    if (sourceClassName === targetClassName && sourceSection === targetSection && sourceYear === targetYear) {
      return res.status(400).json({ error: 'Source and target must be different' });
    }

    const result = await classSubjectMapRepository.copyFrom(
      sourceClassName, sourceSection, sourceYear,
      targetClassName, targetSection, targetYear
    );

    getIO(req).to('class_subject_maps').emit('map:copied', {
      source: { className: sourceClassName, section: sourceSection, year: sourceYear },
      target: { className: targetClassName, section: targetSection, year: targetYear },
      ...result
    });

    await createNotification(req, {
      title: 'Class Subject Mapping Copied',
      message: `Copied ${result.copied} subjects from ${sourceClassName}-${sourceSection} (${sourceYear}) to ${targetClassName}-${targetSection} (${targetYear})${result.skipped ? `, ${result.skipped} skipped` : ''}`,
      type: 'success',
      entityType: 'class_subject_map',
      entityId: `${targetClassName}-${targetSection}-${targetYear}`
    });

    res.json(result);
  } catch (error) {
    console.error('Copy class subject map error:', error);
    if ((error as Error).message?.includes('No subject mappings found')) {
      return res.status(404).json({ error: (error as Error).message });
    }
    res.status(500).json({ error: 'Failed to copy class subject map' });
  }
};