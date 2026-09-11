import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const errorHandler = (err, req, res, next) => { console.error('ORIGINAL ERROR:', err);
  let error = err;

  // If it's not our custom ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof mongoose?.Error ? 400 : 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, 'INTERNAL_ERROR', false, err.stack);
  }

  // Log error (hide stack trace in production)
  if (config.env === 'development') {
    logger.error(error);
  } else if (error.statusCode === 500) {
    logger.error(`[500] ${error.message}`);
  }

  const response = {
    success: false,
    message: error.message,
    error: {
      code: error.code,
    }
  };

  // Add stack trace only in development
  if (config.env === 'development') {
    response.error.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};
