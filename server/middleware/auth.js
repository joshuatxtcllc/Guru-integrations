/**
 * Frame Guru - Authentication Middleware
 * 
 * This middleware verifies JWT tokens and provides authentication
 * and authorization checks for protected routes.
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Authentication middleware that verifies JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const auth = (req, res, next) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.header('Authorization');
    
    // Check if no authorization header
    if (!authHeader) {
      throw new AppError('No authentication token, access denied', 401);
    }
    
    // Parse the token (Bearer token format)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set the user in the request object
    req.user = verified;
    
    // Continue to the next middleware/route handler
    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    } else if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    // Pass any other errors to the error handler
    next(err);
  }
};

/**
 * Authorization middleware that checks if the user is an admin
 * Must be used after the auth middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  // Check if user exists (auth middleware should have set this)
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return next(new AppError('Admin access required', 403));
  }
  
  // Continue if user is an admin
  next();
};

/**
 * Authorization middleware that checks if the user is a staff member
 * Staff includes admins and regular staff (e.g., frame technicians, customer service)
 * Must be used after the auth middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireStaff = (req, res, next) => {
  // Check if user exists (auth middleware should have set this)
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  // Check if user is staff (admin or staff role)
  if (!req.user.isAdmin && !req.user.isStaff) {
    return next(new AppError('Staff access required', 403));
  }
  
  // Continue if user is staff
  next();
};

/**
 * Authorization middleware that checks if the user owns the resource
 * Compares the user ID with the resource owner ID (customerId)
 * Must be used after the auth middleware
 * @param {Function} getResourceOwnerId - Function that returns the owner ID from the request
 * @returns {Function} Middleware function
 */
const requireOwnership = (getResourceOwnerId) => {
  return (req, res, next) => {
    // Check if user exists (auth middleware should have set this)
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    // Get the owner ID of the resource
    const ownerId = getResourceOwnerId(req);
    
    // Check if the user is the owner or an admin
    if (req.user.isAdmin || req.user.id === ownerId.toString()) {
      return next();
    }
    
    // If not, deny access
    return next(new AppError('Access denied', 403));
  };
};

// Export the middleware functions
module.exports = auth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireStaff = requireStaff;
module.exports.requireOwnership = requireOwnership;
