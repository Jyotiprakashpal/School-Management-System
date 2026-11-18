import { Router } from 'express';
import { getBloodGroups } from '../controllers/bloodGroupController.js';

const router = Router();
router.get('/', getBloodGroups);
export default router;
