import express from 'express';
import {
  getMe,
  updateMe,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.patch('/me/password', updatePassword);

// Address management
router.post('/me/addresses', addAddress);
router.patch('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

export default router;
