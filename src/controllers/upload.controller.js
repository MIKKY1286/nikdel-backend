import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import cloudinary from '../config/cloudinary.js';

// Helper function to handle stream uploads
const streamUpload = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `ecommerce/${folder}` },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    // End the stream with the buffer
    stream.end(fileBuffer);
  });
};

// @desc    Upload multiple product images
// @route   POST /api/v1/uploads/images
// @access  Private/Admin
export const uploadImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'Please upload at least one image', 'NO_FILE_UPLOADED'));
  }

  const uploadPromises = req.files.map((file) => streamUpload(file.buffer, 'products'));

  try {
    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    }));

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: formattedResults,
    });
  } catch (error) {
    return next(new ApiError(500, 'Error uploading images to Cloudinary', 'CLOUDINARY_UPLOAD_ERROR'));
  }
});

// @desc    Delete an image from Cloudinary
// @route   DELETE /api/v1/uploads/images
// @access  Private/Admin
export const deleteImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.body;

  if (!publicId) {
    return next(new ApiError(400, 'Please provide the publicId of the image to delete', 'MISSING_PUBLIC_ID'));
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok' && result.result !== 'not found') {
      return next(new ApiError(500, 'Failed to delete image', 'CLOUDINARY_DELETE_ERROR'));
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {},
    });
  } catch (error) {
    return next(new ApiError(500, 'Error deleting image from Cloudinary', 'CLOUDINARY_DELETE_ERROR'));
  }
});
