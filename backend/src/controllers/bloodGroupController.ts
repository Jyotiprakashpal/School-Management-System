import { Request, Response } from 'express';
import { bloodGroupRepository } from '../models/BloodGroup.js';

export const getBloodGroups = async (_req: Request, res: Response) => {
  try { res.json({ data: await bloodGroupRepository.findAll() }); }
  catch (error) { console.error('Get blood groups error:', error); res.status(500).json({ error: 'Failed to fetch blood groups' }); }
};
