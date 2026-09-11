import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
  logger.warn('Cloudinary credentials are missing. Image uploads will fail.');
}

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export default cloudinary;
