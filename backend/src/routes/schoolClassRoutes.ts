import { Router } from 'express';
import { getAllClasses } from '../controllers/schoolClassController.js';

const router: Router = Router();
router.get('/', getAllClasses);

export default router;
