import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity can not be less then 1.'],
    default: 1,
  },
  // Price snapshot at the time the item is in the cart
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to automatically calculate subtotal before saving
cartSchema.pre('save', function () {
  this.subtotal = this.items.reduce((total, item) => total + item.quantity * item.price, 0);
  
});

export const Cart = mongoose.model('Cart', cartSchema);
