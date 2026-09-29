import { Newsletter } from '../models/Newsletter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
export const subscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Please provide an email address', 'MISSING_EMAIL'));
  }

  // Check if already subscribed
  let subscriber = await Newsletter.findOne({ email });

  if (subscriber) {
    if (!subscriber.isActive) {
      subscriber.isActive = true;
      await subscriber.save();
      return res.status(200).json({ success: true, message: 'Subscription reactivated' });
    }
    return res.status(400).json({ success: false, message: 'Email is already subscribed' });
  }

  subscriber = await Newsletter.create({ email });

  res.status(201).json({
    success: true,
    message: 'Successfully subscribed to the newsletter',
    data: subscriber
  });
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/v1/newsletter/unsubscribe
// @access  Public
export const unsubscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Please provide an email address', 'MISSING_EMAIL'));
  }

  const subscriber = await Newsletter.findOne({ email });

  if (!subscriber) {
    return next(new ApiError(404, 'Subscriber not found', 'NOT_FOUND'));
  }

  subscriber.isActive = false;
  await subscriber.save();

  res.status(200).json({
    success: true,
    message: 'Successfully unsubscribed from the newsletter'
  });
});
