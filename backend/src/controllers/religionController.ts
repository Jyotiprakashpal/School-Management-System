import { Request, Response } from 'express';
import { religionRepository } from '../models/Religion.js';

export const getReligions = async (_req: Request, res: Response) => {
  try { res.json({ data: await religionRepository.findAll() }); }
  catch (error) { console.error('Get religions error:', error); res.status(500).json({ error: 'Failed to fetch religions' }); }
};

export const createReligion = async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'Religion name is required' });
  try { res.status(201).json({ data: await religionRepository.create(name) }); }
  catch (error) { if ((error as { code?: string })?.code === '23505') return res.status(409).json({ error: 'Religion already exists' }); res.status(500).json({ error: 'Failed to create religion' }); }
};

export const updateReligion = async (req: Request<{ id: string }>, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!Number.isInteger(id) || id <= 0 || !name) return res.status(400).json({ error: 'Valid ID and religion name are required' });
  try { const religion = await religionRepository.update(id, name); if (!religion) return res.status(404).json({ error: 'Religion not found' }); res.json({ data: religion }); }
  catch (error) { if ((error as { code?: string })?.code === '23505') return res.status(409).json({ error: 'Religion already exists' }); res.status(500).json({ error: 'Failed to update religion' }); }
};

export const deleteReligion = async (req: Request<{ id: string }>, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0 || !(await religionRepository.delete(id))) return res.status(404).json({ error: 'Religion not found' });
  res.json({ message: 'Religion deleted successfully' });
};
