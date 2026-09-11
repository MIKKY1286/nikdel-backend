import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Helper to get or create wishlist
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    select: 'name images stock price discountPrice isActive status',
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  return wishlist;
};

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await getOrCreateWishlist(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Wishlist retrieved successfully',
    data: wishlist,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist/:productId
// @access  Private
export const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  // 1. Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND'));
  }

  // 2. Get or create wishlist
  let wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user.id, products: [] });
  }

  // 3. Add to array if it doesn't exist
  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate({
    path: 'products',
    select: 'name images stock price discountPrice isActive status',
  });

  res.status(200).json({
    success: true,
    message: 'Product added to wishlist',
    data: wishlist,
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });
  
  if (!wishlist) {
    return next(new ApiError(404, 'Wishlist not found', 'WISHLIST_NOT_FOUND'));
  }

  // Pull product from array
  wishlist.products.pull(productId);
  await wishlist.save();

  await wishlist.populate({
    path: 'products',
    select: 'name images stock price discountPrice isActive status',
  });

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
    data: wishlist,
  });
});
