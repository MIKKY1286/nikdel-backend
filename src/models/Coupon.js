import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    trim: true,
    uppercase: true
  },
  value: {
    type: Number,
    required: [true, 'Please add a discount value'],
    min: 0
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    default: 'percentage'
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date']
  },
  usageCount: {
    type: Number,
    default: 100
  },
  uses: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

export const Coupon = mongoose.model('Coupon', couponSchema);
