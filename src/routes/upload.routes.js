import express from 'express';
import { uploadImages, deleteImage, uploadAvatar } from '../controllers/upload.controller.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected route for all users (e.g., uploading an avatar)
router.post('/avatar', protect, uploadMiddleware.single('avatar'), uploadAvatar);

// Admin only routes below
router.use(protect);
router.use(authorize('admin'));

// Route specifically for uploading an array of images (e.g. for products)
router.post('/images', uploadMiddleware.array('images', 5), uploadImages); // limit to 5 images per request

// Route for deleting an image
router.delete('/images', deleteImage);

export default router;
