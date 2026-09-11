import express from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:productId', updateCartItemQuantity);
router.delete('/items/:productId', removeItemFromCart);
router.delete('/', clearCart);

export default router;
