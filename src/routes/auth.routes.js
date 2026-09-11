import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limiter for auth routes to prevent brute-force and credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;
