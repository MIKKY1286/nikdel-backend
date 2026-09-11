import mongoose from 'mongoose';
import { Product } from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating can not be more than 5'],
      required: [true, 'Please add a rating between 1 and 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please add some text'],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get average rating and save it to the product
reviewSchema.statics.getAverageRating = async function (productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  try {
    if (obj[0]) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        rating: Math.round(obj[0].averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: obj[0].reviewCount,
      });
    } else {
      // If there are no reviews left, reset to default
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        rating: 5,
        reviewCount: 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after saving a review
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before removing a review
// Note: In Mongoose 6+, document.deleteOne() triggers 'deleteOne' document middleware
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.getAverageRating(this.product);
});

export const Review = mongoose.model('Review', reviewSchema);
