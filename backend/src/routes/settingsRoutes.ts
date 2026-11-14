import { Router } from 'express';
import { getSettings, updateSettings, uploadSchoolLogo, uploadLogo } from '../controllers/settingsController.js';

const router: Router = Router();

router.get('/', getSettings);
router.post('/', updateSettings);
router.post('/logo', uploadLogo.single('logo'), uploadSchoolLogo);
router.put('/', updateSettings);

export default router;
