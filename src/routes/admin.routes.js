import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAllOrders,
  getAdvancedReports,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ALL admin routes strictly require authentication AND admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats
router.get('/stats', getDashboardStats);

// Advanced Reports
router.get('/reports', getAdvancedReports);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

// Order Management
router.get('/orders', getAllOrders);

export default router;
