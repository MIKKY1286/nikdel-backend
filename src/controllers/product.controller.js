import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all products with advanced filtering, sorting, pagination
// @route   GET /api/v1/products
// @access  Public
export const getProducts = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from standard filtering (they have special logic)
  const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'minPrice', 'maxPrice'];
  if (req.query.minPrice || req.query.maxPrice) {
    reqQuery.price = {};
    if (req.query.minPrice) reqQuery.price.gte = req.query.minPrice;
    if (req.query.maxPrice) reqQuery.price.lte = req.query.maxPrice;
  }
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc) for ranges like minPrice
  // Transform standard query like ?price[lte]=100 to Mongo format
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

  const filterObj = JSON.parse(queryStr);

  // If public route, default to only showing published active products
  // Note: Admins can override this by explicitly querying status if they use the admin routes later.
  filterObj.isActive = true;
  filterObj.status = 'published';

  // Handling Text Search
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filterObj.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
      { brand: searchRegex }
    ];
  }

  // Finding resource
  query = Product.find(filterObj);

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Default sort newest first
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20; // safe maximum limit
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Product.countDocuments(filterObj);

  query = query.skip(startIndex).limit(limit);

  // Execute query (Populate category name only, not full object)
  query = query.populate({ path: 'category', select: 'name slug' });
  const products = await query;

  // Pagination result
  const pagination = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: endIndex < total,
    hasPreviousPage: startIndex > 0,
  };

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: products,
    pagination,
  });
});

// @desc    Get single product by ID or slug
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  let query;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = Product.findById(id);
  } else {
    query = Product.findOne({ slug: id });
  }

  const product = await query.populate({ path: 'category', select: 'name slug' });

  if (!product) {
    return next(new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

// @desc    Update product
// @route   PATCH /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND'));
  }

  // If the name is being updated, regenerate the slug
  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true, strict: true });
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

// @desc    Delete product (Hard delete and remove images)
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND'));
  }

  // Delete images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (const url of product.images) {
      try {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/.../upload/v172.../ecommerce/products/xyz.jpg
        const parts = url.split('/');
        const filename = parts.pop().split('.')[0];
        const folder2 = parts.pop();
        const folder1 = parts.pop();
        const publicId = `${folder1}/${folder2}/${filename}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', url, err);
      }
    }
  }

  // Hard delete the product
  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product and associated images deleted successfully',
    data: {},
  });
});
