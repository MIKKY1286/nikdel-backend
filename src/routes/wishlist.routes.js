import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
