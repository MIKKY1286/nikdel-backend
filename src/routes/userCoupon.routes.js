import express from 'express';
import { validateCoupon } from '../controllers/coupon.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.post('/validate', validateCoupon);

export default router;
