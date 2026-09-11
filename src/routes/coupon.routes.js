import express from 'express';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/coupon.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.route('/:id')
  .put(updateCoupon)
  .delete(deleteCoupon);

export default router;
