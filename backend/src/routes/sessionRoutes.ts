import { Router } from 'express';
import {
  getAllSessions,
  getAllSessionsSimple,
  getSessionById,
  getCurrentSession,
  createSession,
  updateSession,
  setCurrentSession,
  deleteSession
} from '../controllers/sessionController.js';

const router = Router();

// Simple list (for dropdowns, etc.)
router.get('/simple', getAllSessionsSimple);

// Current session
router.get('/current', getCurrentSession);

// CRUD
router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.post('/', createSession);
router.put('/:id', updateSession);
router.put('/:id/set-current', setCurrentSession);
router.delete('/:id', deleteSession);

export default router;