import { Request, Response } from 'express';
import { genderRepository } from '../models/Gender.js';

export const getGenders = async (_req: Request, res: Response) => {
  try { res.json({ data: await genderRepository.findAll() }); }
  catch (error) { console.error('Get genders error:', error); res.status(500).json({ error: 'Failed to fetch genders' }); }
};
