
/**
 * Global error handling middleware for Frame Guru
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
