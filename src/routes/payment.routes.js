import express from 'express';
import {
  initializeTransaction,
  paystackWebhook,
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// The webhook must be public so Paystack can reach it.
// It verifies the request internally using a cryptographic signature.
router.post('/webhook', paystackWebhook);

// Protected routes
router.use(protect);
router.post('/initialize/:orderId', initializeTransaction);

export default router;
