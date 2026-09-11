import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { initializePayment } from '../services/paystack.service.js';
import { sendOrderReceipt } from '../services/email.service.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// @desc    Initialize payment for an order
// @route   POST /api/v1/payments/initialize/:orderId
// @access  Private
export const initializeTransaction = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId).populate('user', 'email');

  if (!order) {
    return next(new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND'));
  }

  if (order.user._id.toString() !== req.user.id) {
    return next(new ApiError(403, 'Not authorized to pay for this order', 'FORBIDDEN'));
  }

  if (order.paymentStatus === 'paid') {
    return next(new ApiError(400, 'Order is already paid', 'ORDER_ALREADY_PAID'));
  }

  // Initialize payment via Paystack
  const paystackResponse = await initializePayment(
    order.total,
    order.user.email,
    order.orderNumber // Use our generated order number as the Paystack reference
  );

  // Save the reference to the order for tracking
  order.paymentReference = order.orderNumber;
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Payment initialized',
    data: {
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
    },
  });
});

// @desc    Paystack Webhook for asynchronous payment verification
// @route   POST /api/v1/payments/webhook
// @access  Public (Secured via crypto signature)
export const paystackWebhook = asyncHandler(async (req, res, next) => {
  // Validate Paystack signature
  const hash = crypto
    .createHmac('sha512', config.paystackSecretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    logger.warn('Invalid Paystack signature detected in webhook');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  // We only care about successful charges for fulfilling orders
  if (event.event === 'charge.success') {
    const reference = event.data.reference;

    // Find the order using the reference and populate user for email
    const order = await Order.findOne({ orderNumber: reference }).populate('user', 'firstName email');

    if (!order) {
      logger.error(`Webhook error: Order not found for reference ${reference}`);
      return res.status(200).send('Order not found');
    }

    // Ensure we don't process the same webhook twice
    if (order.paymentStatus !== 'paid') {
      // 1. Mark Order as paid
      order.paymentStatus = 'paid';
      order.paidAt = Date.now();
      order.orderStatus = 'processing';
      await order.save();

      // 2. Reduce Inventory
      // Iterate through order items and reduce stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true, runValidators: true }
        );
      }

      logger.info(`Order ${order.orderNumber} paid and inventory reduced.`);
      
      // 3. Send Receipt Asynchronously
      if (order.user && order.user.email) {
        sendOrderReceipt(order.user.email, order.user.firstName, order.orderNumber, order.total);
      }
    }
  }

  // Always return 200 OK to acknowledge receipt to Paystack
  res.status(200).send('Webhook received');
});
