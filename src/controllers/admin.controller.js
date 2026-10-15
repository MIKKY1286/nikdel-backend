import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  // 1. Calculate Total Revenue (Sum of all non-cancelled orders)
  const revenueAggregation = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' }, count: { $sum: 1 } } }
  ]);
  const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;
  const nonCancelledCount = revenueAggregation.length > 0 ? revenueAggregation[0].count : 0;

  // 2. Count totals concurrently for performance
  const [totalOrders, totalUsers, totalProducts, activeOrderUsers] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.distinct('user', { orderStatus: { $ne: 'cancelled' } })
  ]);

  // Average Order Value
  const avgOrderValue = (nonCancelledCount || totalOrders) > 0 
    ? Math.round((totalRevenue / (nonCancelledCount || totalOrders)) * 100) / 100 
    : 0;

  // Active Customers: customers who placed non-cancelled orders or registered customers
  const totalCustomers = Math.max(activeOrderUsers.length, totalUsers);

  // 3. Find Low Stock Products (where stock is less than or equal to lowStockThreshold)
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  }).select('name stock lowStockThreshold SKU images');

  res.status(200).json({
    success: true,
    data: {
      totalSales: totalRevenue,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalCustomers,
      totalUsers,
      totalProducts,
      lowStockProducts,
      lowStockCount: lowStockProducts.length
    }
  });
});

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password').sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Update user role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!['customer', 'admin'].includes(role)) {
    return next(new ApiError(400, 'Invalid role specified', 'INVALID_ROLE'));
  }

  // Prevent admin from demoting themselves accidentally
  if (req.params.id === req.user.id && role !== 'admin') {
     return next(new ApiError(400, 'You cannot demote yourself', 'CANNOT_DEMOTE_SELF'));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(new ApiError(404, 'User not found', 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: user,
  });
});

// @desc    Update customer details (Admin)
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, role, isActive, status } = req.body;

  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(404, 'User not found', 'USER_NOT_FOUND'));
  }

  // Prevent admin from demoting or deactivating their own account
  if (req.params.id === req.user.id) {
    if (role && role !== 'admin') {
      return next(new ApiError(400, 'You cannot demote yourself', 'CANNOT_DEMOTE_SELF'));
    }
    if (isActive === false || status === 'suspended') {
      return next(new ApiError(400, 'You cannot deactivate yourself', 'CANNOT_DEACTIVATE_SELF'));
    }
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (status !== undefined) user.isActive = status !== 'suspended';

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
});

// @desc    Delete user permanently (Admin)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new ApiError(400, 'You cannot delete your own admin account', 'CANNOT_DELETE_SELF'));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(404, 'User not found', 'USER_NOT_FOUND'));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
    data: {},
  });
});

// @desc    Get all orders (master list)
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find()
    .populate('user', 'name firstName lastName email phone')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Update order status
// @route   PATCH /api/v1/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status?.toLowerCase())) {
    return next(new ApiError(400, 'Invalid order status', 'INVALID_STATUS'));
  }

  // Support both _id and orderNumber lookups depending on what frontend sends
  const query = req.params.id.startsWith('ORD-') ? { orderNumber: req.params.id } : { _id: req.params.id };
  
  const order = await Order.findOneAndUpdate(
    query,
    { orderStatus: status.toLowerCase() },
    { new: true, runValidators: true }
  );

  if (!order) {
    return next(new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order,
  });
});

// @desc    Get advanced reports (historical)
// @route   GET /api/v1/admin/reports
// @access  Private/Admin
export const getAdvancedReports = asyncHandler(async (req, res, next) => {
  const now = new Date();
  
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Current month revenue
  const currentRevAggr = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: currentMonthStart } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const currentRevenue = currentRevAggr.length > 0 ? currentRevAggr[0].total : 0;
  
  // Previous month revenue
  const prevRevAggr = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const prevRevenue = prevRevAggr.length > 0 ? prevRevAggr[0].total : 0;
  
  // Orders count
  const currentOrders = await Order.countDocuments({ createdAt: { $gte: currentMonthStart } });
  const prevOrders = await Order.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } });
  
  // Users count
  const currentUsers = await User.countDocuments({ createdAt: { $gte: currentMonthStart } });
  const prevUsers = await User.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } });
  
  res.status(200).json({
    success: true,
    data: {
      revenue: {
        current: currentRevenue,
        previous: prevRevenue,
        growth: prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100
      },
      orders: {
        current: currentOrders,
        previous: prevOrders,
        growth: prevOrders === 0 ? 100 : ((currentOrders - prevOrders) / prevOrders) * 100
      },
      customers: {
        current: currentUsers,
        previous: prevUsers,
        growth: prevUsers === 0 ? 100 : ((currentUsers - prevUsers) / prevUsers) * 100
      },
      conversion: {
        current: 3.8, // Mocked for now since tracking anonymous visits requires an external analytics provider
        previous: 3.8,
        growth: 0
      }
    }
  });
});
