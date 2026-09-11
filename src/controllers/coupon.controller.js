import { Coupon } from '../models/Coupon.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// @desc    Get all coupons
// @route   GET /api/v1/admin/coupons
// @access  Private/Admin
export const getCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.status(200).json({ success: true, data: coupons });
});

// @desc    Create coupon
// @route   POST /api/v1/admin/coupons
// @access  Private/Admin
export const createCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: coupon });
});

// @desc    Update coupon
// @route   PUT /api/v1/admin/coupons/:id
// @access  Private/Admin
export const updateCoupon = asyncHandler(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new ApiError(404, 'Coupon not found'));
  
  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ success: true, data: coupon });
});

// @desc    Delete coupon
// @route   DELETE /api/v1/admin/coupons/:id
// @access  Private/Admin
export const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new ApiError(404, 'Coupon not found'));
  
  await coupon.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
