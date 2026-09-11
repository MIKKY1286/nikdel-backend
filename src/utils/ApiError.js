export class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
