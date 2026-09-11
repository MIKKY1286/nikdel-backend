import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`, 'ROUTE_NOT_FOUND');
  next(error);
};
