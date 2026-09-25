import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/settings', getSettings);
router.put('/admin/settings', protect, authorize('admin'), updateSettings);

export default router;
