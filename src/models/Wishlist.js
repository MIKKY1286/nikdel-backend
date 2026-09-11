import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One wishlist per user
    },
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
