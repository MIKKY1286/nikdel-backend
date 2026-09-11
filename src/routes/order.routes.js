import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All standard order routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

export default router;
