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
      default: 'NGN',
    },
    timezone: {
      type: String,
      default: '(GMT+01:00) West Africa Time (Lagos/Ibadan)',
    },
    storeAddress: {
      type: String,
      default: 'Wema Complex, Ibadan, Oyo State, Nigeria',
    },
    storePhone: {
      type: String,
      default: '+234 907 579 3786',
    },
    whatsappNumber: {
      type: String,
      default: '2349075793786',
    },
    operatingHours: {
      type: String,
      default: 'Mon - Sat: 8:00 AM - 6:00 PM (WAT)',
    }
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
