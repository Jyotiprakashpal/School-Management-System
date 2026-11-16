import { Request, Response } from 'express';
import { schoolClassRepository, SchoolClass } from '../models/SchoolClass.js';

export const getAllClasses = async (_req: Request, res: Response<SchoolClass[] | { error: string }>) => {
  try {
    res.json(await schoolClassRepository.findAll());
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};
