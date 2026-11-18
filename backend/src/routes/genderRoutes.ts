import { Router } from 'express';
import { getGenders } from '../controllers/genderController.js';

const router = Router();
router.get('/', getGenders);
export default router;
