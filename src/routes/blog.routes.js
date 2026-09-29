import express from 'express';
import {
  getPosts,
  getPost,
  getAdminPosts,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/blog.controller.js';
import { protect, authorize, optionallyProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getPosts);

// Admin-specific route to get all posts including drafts
router.get('/admin/all', protect, authorize('admin'), getAdminPosts);

// Note: getPost is optionally protected so we can check if user is admin to show drafts
router.get('/:idOrSlug', optionallyProtect, getPost);

// Protected routes (Create, Update, Delete)
router.use(protect);

router.post('/', createPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
