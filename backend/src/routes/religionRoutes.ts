import { Router } from 'express';
import { createReligion, deleteReligion, getReligions, updateReligion } from '../controllers/religionController.js';

const router = Router();
router.get('/', getReligions);
router.post('/', createReligion);
router.put('/:id', updateReligion);
router.delete('/:id', deleteReligion);
export default router;
