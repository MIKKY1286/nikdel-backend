import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import slugify from 'slugify';

// @desc    Get all active categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true }).lean();

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat._id });
      return { ...cat, productCount };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categoriesWithCount,
  });
});

// @desc    Get single category by ID or slug
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Try finding by ID first, then fallback to slug
  let category;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    category = await Category.findById(id);
  } else {
    category = await Category.findOne({ slug: id });
  }

  if (!category) {
    return next(new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Category retrieved successfully',
    data: category,
  });
});

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

// @desc    Update category
// @route   PATCH /api/v1/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND'));
  }

  // If the name is being updated, regenerate the slug
  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true, strict: true });
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND'));
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: {},
  });
});
