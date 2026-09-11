import mongoose from 'mongoose';
import slugify from 'slugify';
import { generateSKU } from '../utils/generateSKU.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a full description'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a regular price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (val) {
          // 'this' refers to the current document only when creating a new document or using save().
          // Using it with update requires special handling if needed, but for simplicity we rely on pre('save') logic or just creating.
          return val === undefined || val === null || val <= this.price;
        },
        message: 'Discount price ({VALUE}) must be less than or equal to regular price',
      },
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Please specify a category'],
    },
    brand: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: ['no-photo.jpg'],
    },
    SKU: {
      type: String,

      unique: true,
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    specifications: {
      type: Map,
      of: String, // E.g., {"Color": "Red", "Weight": "2kg" }
    },
    tags: {
      type: [String],
      index: true,
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must can not be more than 5'],
      default: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished', 'archived'],
      default: 'draft',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching and sorting
productSchema.index({ price: 1, rating: -1 });

// Generate slug and SKU before saving
productSchema.pre('validate', async function () {
  // Generate slug
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Generate SKU if not provided
  if (this.name && !this.SKU) {
    // Attempt to fetch category name to make a smart SKU
    let catName = 'GEN';
    if (this.category) {
      const category = await mongoose.model('Category').findById(this.category);
      if (category) catName = category.name;
    }
    this.SKU = generateSKU(this.name, catName);
  }

  return;
});

export const Product = mongoose.model('Product', productSchema);
