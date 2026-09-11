import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res, next) => {
  let query;

  if (req.params.productId) {
    query = Review.find({ product: req.params.productId });
  } else {
    query = Review.find().populate({
      path: 'product',
      select: 'name description',
    });
  }

  const reviews = await query.populate({
    path: 'user',
    select: 'firstName lastName avatar',
  });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate({
      path: 'product',
      select: 'name description',
    })
    .populate({
      path: 'user',
      select: 'firstName lastName avatar',
    });

  if (!review) {
    return next(new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Add review
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
export const addReview = asyncHandler(async (req, res, next) => {
  req.body.product = req.params.productId;
  req.body.user = req.user.id;

  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND'));
  }

  // Note: The unique index on the schema will throw an error if the user already reviewed this.
  // We'll let the global error handler catch the duplicate key error.

  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc    Update review
// @route   PATCH /api/v1/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND'));
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to update review', 'FORBIDDEN'));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Since we used findByIdAndUpdate, the 'save' hook isn't triggered automatically.
  // We need to call the static method manually to recalculate the rating.
  await Review.getAverageRating(review.product);

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND'));
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to delete review', 'FORBIDDEN'));
  }

  await review.deleteOne(); // Triggers the 'deleteOne' document hook

  res.status(200).json({
    success: true,
    data: {},
  });
});
