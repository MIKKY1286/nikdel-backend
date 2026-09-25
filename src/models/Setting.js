import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'Nikdel Webstore',
    },
    contactEmail: {
      type: String,
      default: 'admin@nikdel.com',
    },
    storeDescription: {
      type: String,
      default: 'Premium building materials and agriculture webstore.',
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'NGN'],
      default: 'USD',
    },
    timezone: {
      type: String,
      default: '(GMT+00:00) London',
    }
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
