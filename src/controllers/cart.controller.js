import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Helper to get or create cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name images stock price discountPrice',
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  const cart = await getOrCreateCart(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Cart retrieved successfully',
    data: cart,
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
export const addItemToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  // 1. Validate product exists and has stock
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND'));
  }
  if (!product.isActive || product.status !== 'published') {
    return next(new ApiError(400, 'Product is not available for purchase', 'PRODUCT_UNAVAILABLE'));
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Use discount price if it exists, otherwise regular price
  const activePrice = product.discountPrice ? product.discountPrice : product.price;

  // 2. Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Item exists, update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Re-verify stock
    if (newQuantity > product.stock) {
      return next(new ApiError(400, `Only ${product.stock} items in stock`, 'INSUFFICIENT_STOCK'));
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    // Always update the price to the latest from DB
    cart.items[existingItemIndex].price = activePrice;
  } else {
    // New item
    if (quantity > product.stock) {
      return next(new ApiError(400, `Only ${product.stock} items in stock`, 'INSUFFICIENT_STOCK'));
    }
    
    cart.items.push({
      product: productId,
      quantity,
      price: activePrice,
    });
  }

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name images stock price discountPrice',
  });

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: cart,
  });
});

// @desc    Update cart item quantity
// @route   PATCH /api/v1/cart/items/:productId
// @access  Private
export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return next(new ApiError(400, 'Quantity must be at least 1', 'INVALID_QUANTITY'));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ApiError(404, 'Cart not found', 'CART_NOT_FOUND'));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return next(new ApiError(404, 'Item not found in cart', 'ITEM_NOT_FOUND'));
  }

  // Re-verify stock with DB
  const product = await Product.findById(productId);
  if (quantity > product.stock) {
    return next(new ApiError(400, `Only ${product.stock} items in stock`, 'INSUFFICIENT_STOCK'));
  }

  // Update quantity and sync price
  const activePrice = product.discountPrice ? product.discountPrice : product.price;
  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].price = activePrice;

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name images stock price discountPrice',
  });

  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    data: cart,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:productId
// @access  Private
export const removeItemFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ApiError(404, 'Cart not found', 'CART_NOT_FOUND'));
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name images stock price discountPrice',
  });

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart,
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: cart || { user: req.user.id, items: [], subtotal: 0 },
  });
});
