import { Request, Response } from 'express';
import {
  admissionEnquiryRepository,
  AdmissionEnquiry,
  CreateAdmissionEnquiryDto,
  UpdateAdmissionEnquiryDto,
  AdmissionEnquiryQuery
} from '../models/AdmissionEnquiry.js';

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

    res.json(enquiry);
  } catch (error) {
    console.error('Update enquiry error:', error);
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({ error: 'Enquiry with this mobile number already exists' });
    }
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
};

export const deleteEnquiry = async (req: Request<{ studentId: string }>, res: Response<void | { error: string }>) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    await admissionEnquiryRepository.delete(studentId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete enquiry error:', error);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
};