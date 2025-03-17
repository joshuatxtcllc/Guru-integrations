/**
 * Frame Guru - Error Handler Middleware
 * 
 * This middleware handles all errors in the application and provides
 * consistent error responses for API clients.
 */

/**
 * Global error handler for Express
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Check if we've already started sending a response
  if (res.headersSent) {
    return next(err);
  }

  // Default error status and message
  let statusCode = 500;
  let message = 'Server Error';
  let errors = null;
  let data = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(error => error.message);
  } else if (err.name === 'CastError') {
    // Mongoose bad ObjectId
    statusCode = 400;
    message = 'Resource not found';
  } else if (err.code === 11000) {
    // Mongoose duplicate key
    statusCode = 400;
    message = 'Duplicate field value entered';
    // Extract the field name from the error message
    const field = Object.keys(err.keyValue)[0];
    errors = [`${field} already exists`];
  } else if (err.name === 'JsonWebTokenError') {
    // JWT validation error
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = 401;
    message = 'Token expired';
  } else if (err.statusCode) {
    // Custom error with status code
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    data = err.data;
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errors && { errors }),
      ...(data && { data }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Also export a custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, errors = null, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
