import { Post } from '../models/Post.js';
import { Newsletter } from '../models/Newsletter.js';
import { sendEmail } from '../utils/sendEmail.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import slugify from 'slugify';

// @desc    Get all published blog posts
// @route   GET /api/v1/blogs
// @access  Public
export const getPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ status: 'published' })
    .populate('author', 'firstName lastName')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

// @desc    Get single blog post by slug or ID
// @route   GET /api/v1/blogs/:idOrSlug
// @access  Public
export const getPost = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  
  // Try to find by slug first, if not, find by ID
  let post = await Post.findOne({ slug: idOrSlug }).populate('author', 'firstName lastName');
  
  if (!post && idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    post = await Post.findById(idOrSlug).populate('author', 'firstName lastName');
  }

  if (!post) {
    return next(new ApiError(404, 'Post not found', 'NOT_FOUND'));
  }

  // Only allow admins to see draft posts
  if (post.status === 'draft') {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to view this post', 'FORBIDDEN'));
    }
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});

// @desc    Get all blog posts (Admin only, includes drafts)
// @route   GET /api/v1/blogs/admin/all
// @access  Private/Admin
export const getAdminPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find()
    .populate('author', 'firstName lastName')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

// @desc    Create a blog post
// @route   POST /api/v1/blogs
// @access  Private/Admin
export const createPost = asyncHandler(async (req, res, next) => {
  req.body.author = req.user.id;
  
  if (req.body.title && !req.body.slug) {
    req.body.slug = slugify(req.body.title, { lower: true, strict: true });
  }

  const post = await Post.create(req.body);

  if (post.status === 'published' || !req.body.status) {
    const subscribers = await Newsletter.find({ isActive: true });
    
    // Send email to all subscribers asynchronously
    subscribers.forEach(sub => {
      sendEmail({
        email: sub.email,
        subject: `New Blog Post: ${post.title}`,
        message: `Hi there!\n\nA new post titled "${post.title}" has been published on Nikdel.\n\nRead it here: ${process.env.CLIENT_URL || 'http://localhost:5173'}/blog/${post.slug}\n\nCheers,\nNikdel Team`,
      }).catch(err => console.error(err));
    });
  }

  res.status(201).json({
    success: true,
    data: post,
  });
});

// @desc    Update a blog post
// @route   PATCH /api/v1/blogs/:id
// @access  Private/Admin
export const updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ApiError(404, 'Post not found', 'NOT_FOUND'));
  }

  // Check ownership
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to update this post', 'FORBIDDEN'));
  }

  if (req.body.title && !req.body.slug) {
    req.body.slug = slugify(req.body.title, { lower: true, strict: true });
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: post,
  });
});

// @desc    Delete a blog post
// @route   DELETE /api/v1/blogs/:id
// @access  Private/Admin
export const deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ApiError(404, 'Post not found', 'NOT_FOUND'));
  }

  // Check ownership
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to delete this post', 'FORBIDDEN'));
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
