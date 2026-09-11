import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import reviewRouter from './review.routes.js';

const router = express.Router();

// Re-route into other resource routers
router.use('/:productId/reviews', reviewRouter);

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected Admin routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
