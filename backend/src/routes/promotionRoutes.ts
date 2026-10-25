import { Router } from 'express';
import {
  getAllPromotionHistory,
  getPromotionStats,
  getPromotionHistoryById,
  createPromotion,
  undoPromotion
} from '../controllers/promotionController.js';

const router: Router = Router();

router.get('/stats', getPromotionStats);
router.get('/', getAllPromotionHistory);
router.get('/:id', getPromotionHistoryById);
router.post('/', createPromotion);
router.delete('/:id', undoPromotion);

export default router;