import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// @desc    Get current logged in user profile
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  // req.user is set by the protect middleware
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: req.user,
  });
});

// @desc    Update user profile
// @route   PATCH /api/v1/users/me
// @access  Private
export const updateMe = asyncHandler(async (req, res, next) => {
  // Prevent users from updating sensitive fields via this endpoint
  if (req.body.password || req.body.role || req.body.email) {
    return next(
      new ApiError(
        400,
        'Cannot update password, role, or email through this endpoint',
        'INVALID_UPDATE_FIELDS'
      )
    );
  }

  // Filter out unwanted fields
  const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };

  const filteredBody = filterObj(req.body, 'name', 'phone', 'avatar');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

// @desc    Update user password
// @route   PATCH /api/v1/users/me/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Please provide current and new password', 'MISSING_CREDENTIALS'));
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(currentPassword))) {
    return next(new ApiError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS'));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: null,
  });
});

// @desc    Add a new address
// @route   POST /api/v1/users/me/addresses
// @access  Private
export const addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // If this is the first address, make it default
  if (user.addresses.length === 0) {
    req.body.isDefault = true;
  } else if (req.body.isDefault) {
    // If the new address is set to default, unset all others
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: user.addresses,
  });
});

// @desc    Update an address
// @route   PATCH /api/v1/users/me/addresses/:addressId
// @access  Private
export const updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const addressId = req.params.addressId;

  const address = user.addresses.id(addressId);

  if (!address) {
    return next(new ApiError(404, 'Address not found', 'ADDRESS_NOT_FOUND'));
  }

  // If this address is being set to default, unset others
  if (req.body.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // Update fields
  const allowedFields = ['street', 'city', 'state', 'country', 'zipCode', 'isDefault'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      address[field] = req.body[field];
    }
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: user.addresses,
  });
});

// @desc    Delete an address
// @route   DELETE /api/v1/users/me/addresses/:addressId
// @access  Private
export const deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const addressId = req.params.addressId;

  const address = user.addresses.id(addressId);

  if (!address) {
    return next(new ApiError(404, 'Address not found', 'ADDRESS_NOT_FOUND'));
  }

  user.addresses.pull(addressId);
  
  // If the deleted address was default, make the first one default if it exists
  if (address.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: user.addresses,
  });
});
