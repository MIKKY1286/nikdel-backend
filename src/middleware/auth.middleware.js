import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

// Protect routes - verifies JWT and sets req.user
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ApiError(401, 'Not authorized to access this route', 'UNAUTHORIZED'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find the user by ID and attach to request object
    // We do not want to attach the password even if it wasn't selected by default
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(new ApiError(401, 'User belonging to this token no longer exists', 'USER_DELETED'));
    }

    if (!req.user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated', 'ACCOUNT_INACTIVE'));
    }

    next();
  } catch (err) {
    return next(new ApiError(401, 'Not authorized to access this route', 'INVALID_TOKEN'));
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role '${req.user.role}' is not authorized to access this route`,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
};
