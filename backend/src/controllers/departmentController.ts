import { Request, Response } from 'express';
import { departmentRepository, Department } from '../models/Department.js';

export const getAllDepartments = async (req: Request, res: Response<{ data: Department[] } | { error: string }>) => {
  try {
    const data = await departmentRepository.findMany(String(req.query.search || ''));
    res.json({ data });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req: Request<{ id: string }>, res: Response<{ data: Department } | { error: string }>) => {
  try {
    const department = await departmentRepository.findById(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ data: department });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

export const createDepartment = async (req: Request, res: Response<{ data: Department } | { error: string }>) => {
  try {
    const departmentName = typeof req.body?.departmentName === 'string' ? req.body.departmentName.trim() : '';
    if (!departmentName) return res.status(400).json({ error: 'Department name is required' });
    if (await departmentRepository.findByName(departmentName)) {
      return res.status(409).json({ error: 'Department with this name already exists' });
    }
    const department = await departmentRepository.create(departmentName, req.body?.createdBy);
    res.status(201).json({ data: department });
  } catch (error) {
    console.error('Create department error:', error);
    if ((error as { code?: string })?.code === '23505') return res.status(409).json({ error: 'Department with this name already exists' });
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: Request<{ id: string }>, res: Response<{ data: Department } | { error: string }>) => {
  try {
    const departmentName = typeof req.body?.departmentName === 'string' ? req.body.departmentName.trim() : '';
    if (!departmentName) return res.status(400).json({ error: 'Department name is required' });
    const department = await departmentRepository.update(req.params.id, departmentName);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ data: department });
  } catch (error) {
    console.error('Update department error:', error);
    if ((error as { code?: string })?.code === '23505') return res.status(409).json({ error: 'Department with this name already exists' });
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!(await departmentRepository.findById(req.params.id))) return res.status(404).json({ error: 'Department not found' });
    await departmentRepository.delete(req.params.id);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
