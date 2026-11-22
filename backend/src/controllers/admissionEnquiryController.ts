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
import { userRepository } from '../models/User.js';
import { cashflowRepository } from '../models/Cashflow.js';

const getIO = (req: Request): SocketIOServer => req.app.get('io');

const getActorUserId = async (req: Request): Promise<string | undefined> => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';
  const userId = Number(token.match(/^session-(\d+)-/)?.[1] || 0);
  if (!userId) return undefined;
  const user = await userRepository.findById(userId);
  return user?.userId || undefined;
};

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
      entityType: 'enquiry',
      createdBy: await getActorUserId(req),
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
  if (typeof body.mobileNumber !== 'string' || !/^\d{10}$/.test(body.mobileNumber.trim())) return 'Enter a valid 10-digit mobile number';
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
    const { name, fatherName, mobileNumber, classInterested, address, remarks, revenue, createdBy } = req.body;

    const validationError = validateEnquiryBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingEnquiry = await admissionEnquiryRepository.findByMobile(mobileNumber);
    if (existingEnquiry) {
      return res.status(409).json({ error: 'Enquiry with this mobile number already exists' });
    }
    if (fatherName?.trim()) {
      const existingIdentity = await admissionEnquiryRepository.findByStudentAndFather(
        name,
        fatherName
      );
      if (existingIdentity) {
        return res.status(409).json({ error: 'An enquiry with this name and father name already exists' });
      }
    }

    const enquiry = await admissionEnquiryRepository.create({
      name,
      fatherName,
      mobileNumber,
      classInterested,
      address,
      remarks,
      revenue,
      createdBy: createdBy?.trim() || await getActorUserId(req) || 'System'
    });

    if (enquiry.revenue > 0) {
      await cashflowRepository.createCashflow({
        type: 'Income',
        category: 'Admission Fees',
        description: `Admission enquiry revenue from ${enquiry.name}`,
        amount: enquiry.revenue,
        date: new Date().toISOString().slice(0, 10),
        mode: 'Cash',
        reference: `ENQUIRY-${enquiry.studentId}`,
        createdBy: await getActorUserId(req),
      });
    }

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

    const { name, fatherName, mobileNumber, classInterested, address, remarks, revenue, status } = req.body;

    if (status !== undefined && status !== 'Form Issued' && status !== 'Admitted') {
      return res.status(400).json({ error: 'Invalid enquiry status' });
    }

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'Student name must be a non-empty string' });
    }
    if (mobileNumber !== undefined && (typeof mobileNumber !== 'string' || !/^\d{10}$/.test(mobileNumber.trim()))) {
      return res.status(400).json({ error: 'Mobile number must be a valid 10-digit number' });
    }
    if (classInterested !== undefined && (typeof classInterested !== 'string' || !classInterested.trim())) {
      return res.status(400).json({ error: 'Class interested in must be a non-empty string' });
    }

    if (mobileNumber !== undefined) {
      const existingMobile = await admissionEnquiryRepository.findByMobile(mobileNumber.trim(), studentId);
      if (existingMobile) {
        return res.status(409).json({ error: 'Enquiry with this mobile number already exists' });
      }
    }

    const current = await admissionEnquiryRepository.findByStudentId(studentId);
    if (!current) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const finalName = name?.trim() || current.name;
    const finalFatherName = fatherName !== undefined ? fatherName?.trim() : current.fatherName;
    if (finalFatherName) {
      const existingIdentity = await admissionEnquiryRepository.findByStudentAndFather(
        finalName,
        finalFatherName,
        studentId
      );
      if (existingIdentity) {
        return res.status(409).json({ error: 'An enquiry with this name and father name already exists' });
      }
    }

    const enquiry = await admissionEnquiryRepository.update(studentId, { name, fatherName, mobileNumber, classInterested, address, remarks, revenue, status });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    const income = await cashflowRepository.findByReference(`ENQUIRY-${enquiry.studentId}`);
    if (enquiry.revenue > 0) {
      const payload = {
        category: 'Admission Fees',
        description: `Admission enquiry revenue from ${enquiry.name}`,
        amount: enquiry.revenue,
        date: new Date(enquiry.updatedAt).toISOString().slice(0, 10),
        mode: 'Cash',
        reference: `ENQUIRY-${enquiry.studentId}`,
      };
      if (income) await cashflowRepository.updateCashflow(income.id, payload);
      else await cashflowRepository.createCashflow({ type: 'Income', ...payload, createdBy: await getActorUserId(req) });
    } else if (income) {
      await cashflowRepository.deleteCashflow(income.id);
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
    await cashflowRepository.deleteByReference(`ENQUIRY-${studentId}`);

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
