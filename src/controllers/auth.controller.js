import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../services/email.service.js';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new ApiError(400, 'User already exists', 'USER_ALREADY_EXISTS'));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || "customer",
  });

  // Send welcome email
  sendWelcomeEmail(user.email, user.name);

  // Generate Token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email and password are provided
  if (!email || !password) {
    return next(new ApiError(400, 'Please provide an email and password', 'MISSING_CREDENTIALS'));
  }

  // Check for user (we must explicitly select password here since it is select: false in schema)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS'));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS'));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ApiError(403, 'Your account has been deactivated', 'ACCOUNT_INACTIVE'));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // Generate Token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'User logged in successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});
