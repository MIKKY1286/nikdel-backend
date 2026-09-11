import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// We use memory storage so the file is available as a Buffer in req.file
// This avoids writing temporarily to the disk which is safer for ephemeral environments (e.g. Render, Heroku)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    // Only accept specific image types to prevent malicious uploads (like SVG XSS)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Unsupported image format. Please upload JPG, PNG, or WEBP.', 'INVALID_FILE_FORMAT'), false);
    }
  } else {
    cb(new ApiError(400, 'Please upload only images', 'NOT_AN_IMAGE'), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});
