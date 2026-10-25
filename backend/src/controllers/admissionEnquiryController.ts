import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import {
  admissionEnquiryRepository,
  AdmissionEnquiry,
  CreateAdmissionEnquiryDto,
  UpdateAdmissionEnquiryDto,
  AdmissionEnquiryQuery
} from '../models/AdmissionEnquiry.js';
import { notificationRepository } from '../models/Notification.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const createNotification = async (req: Request, data: {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType: 'enquiry';
  entityId: string;
}) => {
  try {
    const notification = await notificationRepository.create({
      ...data,
      entityType: 'enquiry'
    });
    getIO(req).to(`user:${data.userId || 'all'}`).emit('notification:created', notification);
    if (!data.userId) {
      getIO(req).to('notifications').emit('notification:created', notification);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

interface PaginatedEnquiries {
  data: AdmissionEnquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const validateEnquiryBody = (body: Partial<CreateAdmissionEnquiryDto>): string | null => {
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Student name is required';
  if (typeof body.mobileNumber !== 'string' || !body.mobileNumber.trim()) return 'Mobile number is required';
  if (typeof body.classInterested !== 'string' || !body.classInterested.trim()) return 'Class interested in is required';
  return null;
};

export const getAllEnquiries = async (req: Request<{}, {}, {}, AdmissionEnquiryQuery>, res: Response<PaginatedEnquiries | { error: string }>) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = req.query.search as string;
    const classInterested = req.query.classInterested as string;

    const { data, total } = await admissionEnquiryRepository.findMany({ page, limit, search, classInterested });

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all enquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
};

export const getEnquiryByStudentId = async (req: Request<{ studentId: string }>, res: Response<AdmissionEnquiry | { error: string }>) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const enquiry = await admissionEnquiryRepository.findByStudentId(studentId);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json(enquiry);
  } catch (error) {
    console.error('Get enquiry error:', error);
    res.status(500).json({ error: 'Failed to fetch enquiry' });
  }
};

export const createEnquiry = async (req: Request<{}, AdmissionEnquiry | { error: string }, CreateAdmissionEnquiryDto>, res: Response<AdmissionEnquiry | { error: string }>) => {
  try {
    const { name, fatherName, mobileNumber, classInterested, address, remarks } = req.body;

    const validationError = validateEnquiryBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingEnquiry = await admissionEnquiryRepository.findByMobile(mobileNumber);
    if (existingEnquiry) {
      return res.status(409).json({ error: 'Enquiry with this mobile number already exists' });
    }

    const enquiry = await admissionEnquiryRepository.create({
      name,
      fatherName,
      mobileNumber,
      classInterested,
      address,
      remarks
    });

    // Emit real-time event
    getIO(req).to('enquiries').emit('enquiry:created', enquiry);

    // Create notification
    await createNotification(req, {
      title: 'New Admission Enquiry',
      message: `New enquiry from ${name} for class ${classInterested} (${mobileNumber})`,
      type: 'success',
      entityType: 'enquiry',
      entityId: enquiry.studentId
    });

    res.status(201).json(enquiry);
  } catch (error) {
    console.error('Create enquiry error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Enquiry with this mobile number already exists' });
    }
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
};

export const updateEnquiry = async (req: Request<{ studentId: string }, AdmissionEnquiry | { error: string }, UpdateAdmissionEnquiryDto>, res: Response<AdmissionEnquiry | { error: string }>) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const { name, fatherName, mobileNumber, classInterested, address, remarks } = req.body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'Student name must be a non-empty string' });
    }
    if (mobileNumber !== undefined && (typeof mobileNumber !== 'string' || !mobileNumber.trim())) {
      return res.status(400).json({ error: 'Mobile number must be a non-empty string' });
    }
    if (classInterested !== undefined && (typeof classInterested !== 'string' || !classInterested.trim())) {
      return res.status(400).json({ error: 'Class interested in must be a non-empty string' });
    }

    const enquiry = await admissionEnquiryRepository.update(studentId, { name, fatherName, mobileNumber, classInterested, address, remarks });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Emit real-time event
    getIO(req).to('enquiries').emit('enquiry:updated', enquiry);

    // Create notification
    await createNotification(req, {
      title: 'Enquiry Updated',
      message: `Enquiry for ${enquiry.name} (${enquiry.mobileNumber}) has been updated`,
      type: 'info',
      entityType: 'enquiry',
      entityId: studentId
    });

    res.json(enquiry);
  } catch (error) {
    console.error('Update enquiry error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Enquiry with this mobile number already exists' });
    }
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
};

export const deleteEnquiry = async (req: Request<{ studentId: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const enquiry = await admissionEnquiryRepository.findByStudentId(studentId);

    await admissionEnquiryRepository.delete(studentId);

    // Emit real-time event
    getIO(req).to('enquiries').emit('enquiry:deleted', { studentId });

    // Create notification
    if (enquiry) {
      await createNotification(req, {
        title: 'Enquiry Deleted',
        message: `Enquiry for ${enquiry.name} (${enquiry.mobileNumber}) has been deleted`,
        type: 'warning',
        entityType: 'enquiry',
        entityId: studentId
      });
    }

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
};