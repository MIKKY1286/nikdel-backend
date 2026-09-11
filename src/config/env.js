import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  fromEmail: process.env.FROM_EMAIL || 'noreply@yourecommerce.com',
};

if (!config.mongoUri) {
  console.error('MONGO_URI is missing in environment variables');
  process.exit(1);
}

if (!config.jwtSecret) {
  console.error('JWT_SECRET is missing in environment variables');
  process.exit(1);
}
