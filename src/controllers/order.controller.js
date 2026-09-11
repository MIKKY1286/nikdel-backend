import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// @desc    Create new order from cart
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddressId, shippingFee = 0 } = req.body;

  // 1. Get user's cart
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new ApiError(400, 'Your cart is empty', 'CART_EMPTY'));
  }

  // 2. Get user's shipping address
  // For this implementation, we will expect the frontend to pass the full address object or we look it up
  // Let's assume the user model has addresses and we find it by ID
  const address = req.user.addresses.id(shippingAddressId);
  if (!address) {
    return next(new ApiError(404, 'Shipping address not found', 'ADDRESS_NOT_FOUND'));
  }

  // 3. Validate stock and build order items
  const orderItems = [];
  let calculatedSubtotal = 0;

  for (const item of cart.items) {
    const product = item.product;

    if (!product) {
       return next(new ApiError(400, 'A product in your cart no longer exists', 'PRODUCT_MISSING'));
    }

    if (product.stock < item.quantity) {
      return next(new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stock}`, 'INSUFFICIENT_STOCK'));
    }

    const price = product.discountPrice ? product.discountPrice : product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      SKU: product.SKU,
      image: product.images[0] || 'no-photo.jpg',
      price: price,
      quantity: item.quantity,
    });

    calculatedSubtotal += price * item.quantity;
  }

  // 4. Calculate total
  const total = calculatedSubtotal + shippingFee;

  // 5. Create Order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    shippingAddress: {
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      phone: req.user.phone || address.phone || '0000000000',
    },
    subtotal: calculatedSubtotal,
    shippingFee,
    total,
  });

  // 6. Clear the user's cart now that the order is created
  cart.items = [];
  cart.subtotal = 0;
  await cart.save();

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

// @desc    Get logged in user's orders
// @route   GET /api/v1/orders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: orders,
  });
});

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

  if (!order) {
    return next(new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND'));
  }

  // Make sure the order belongs to the logged in user OR user is admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to view this order', 'FORBIDDEN'));
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: order,
  });
});
