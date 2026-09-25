import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';

// NOTE: You must initialize the Firebase Admin SDK somewhere in your application startup (e.g., server.js or a dedicated config file).
// Example initialization:
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountJson)
// });
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

// @desc    Login/Register user with Google
// @route   POST /api/v1/auth/google
// @access  Public
export const googleSignIn = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new ApiError(400, 'Please provide a Firebase ID token', 'MISSING_TOKEN'));
  }

  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(token);
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return next(new ApiError(401, `Invalid Firebase ID token: ${error.message}`, 'INVALID_TOKEN'));
  }

  const { email, name, picture } = decodedToken;

  // Check if user already exists
  let user = await User.findOne({ email });

  if (!user) {
    // Generate a secure random password since it is required by the User schema
    const secureRandomPassword = crypto.randomBytes(20).toString('hex');
    
    user = await User.create({
      name: name || 'Google User',
      email,
      password: secureRandomPassword,
      avatar: picture || 'no-photo.jpg',
      isVerified: true, // OAuth emails are generally already verified
    });
    
    // Optional: Send welcome email for newly registered Google users
    sendWelcomeEmail(user.email, user.name);
  } else {
    // If the user already exists, you can optionally update their avatar or name if they have changed
    if (picture && user.avatar === 'no-photo.jpg') {
      user.avatar = picture;
    }
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // Generate our API Token
  const jwtToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'User authenticated via Google successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: jwtToken,
    },
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ApiError(404, 'There is no user with that email', 'USER_NOT_FOUND'));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  // Assuming frontend is running on localhost:5173 or similar, or getting it from req origin
  const origin = req.get('origin') || 'http://localhost:5173';
  const resetUrl = `${origin}/reset-password?token=${resetToken}`;

  const { sendPasswordResetEmail } = await import('../services/email.service.js');
  
  // Log the URL so you can easily copy-paste it during testing when email fails
  console.log(`\n======================================================\nPASSWORD RESET URL (Click or Copy):\n${resetUrl}\n======================================================\n`);

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    
    res.status(200).json({
      success: true,
      data: 'Email sent',
      // Useful for testing if email service isn't fully configured
      resetToken: resetToken 
    });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ApiError(500, 'Email could not be sent', 'EMAIL_ERROR'));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError(400, 'Invalid token', 'INVALID_TOKEN'));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

