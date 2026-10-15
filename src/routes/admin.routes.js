import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUserRole,
  getAllOrders,
  updateOrderStatus,
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
router.put('/users/:id', updateUser);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Order Management
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
