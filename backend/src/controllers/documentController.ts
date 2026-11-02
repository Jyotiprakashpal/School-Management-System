import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  documentRepository,
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQuery
} from '../models/Document.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'document';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'document'
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedDocuments {
  data: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateDocumentBody = (body: Partial<CreateDocumentDto>): string | null => {
  if (typeof body.title !== 'string' || !body.title.trim()) return 'Title is required';
  if (typeof body.fileName !== 'string' || !body.fileName.trim()) return 'File name is required';
  if (typeof body.originalFileName !== 'string' || !body.originalFileName.trim()) return 'Original file name is required';
  if (typeof body.mimeType !== 'string' || !body.mimeType.trim()) return 'MIME type is required';
  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) return 'File size must be a positive number';
  if (typeof body.filePath !== 'string' || !body.filePath.trim()) return 'File path is required';
  if (typeof body.category !== 'string' || !body.category.trim()) return 'Category is required';
  if (typeof body.uploadedBy !== 'string' || !body.uploadedBy.trim()) return 'Uploaded by is required';
  if (body.tags !== undefined && !Array.isArray(body.tags)) return 'Tags must be an array';
  return null;
};

export const getAllDocuments = async (req: Request<{}, {}, {}, DocumentQuery>, res: Response<PaginatedDocuments | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const category = req.query.category as string;
    const uploadedBy = req.query.uploadedBy as string;

    const { data, total } = await documentRepository.findMany({ page, limit, search, category, uploadedBy });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentById = async (req: Request<{ id: string }>, res: Response<Document | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await documentRepository.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const createDocument = async (req: Request<{}, Document | { error: string }, CreateDocumentDto>, res: Response<Document | { error: string }>) => {
  try {
    const validationError = validateDocumentBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const document = await documentRepository.create(req.body);

    // Emit real-time event
    getIO(req).to('documents').emit('document:created', document);

    // Create notification
    await createNotification(req, {
      title: 'Document Uploaded',
      message: `Document "${document.title}" (${document.originalFileName}) has been uploaded`,
      type: 'success',
      entityType: 'document',
      entityId: document.id.toString()
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Create document error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Document with this file name already exists' });
    }
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const updateDocument = async (req: Request<{ id: string }, Document | { error: string }, UpdateDocumentDto>, res: Response<Document | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await documentRepository.update(id, req.body);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Emit real-time event
    getIO(req).to('documents').emit('document:updated', document);

    // Create notification
    await createNotification(req, {
      title: 'Document Updated',
      message: `Document "${document.title}" has been updated`,
      type: 'info',
      entityType: 'document',
      entityId: document.id.toString()
    });

    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await documentRepository.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // TODO: Delete actual file from storage

    await documentRepository.delete(id);

    // Emit real-time event
    getIO(req).to('documents').emit('document:deleted', { id });

    // Create notification
    await createNotification(req, {
      title: 'Document Deleted',
      message: `Document "${document.title}" has been deleted`,
      type: 'warning',
      entityType: 'document',
      entityId: document.id.toString()
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};