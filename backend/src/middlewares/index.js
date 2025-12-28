/**
 * Middlewares index
 */
const adminAuth = require('./adminAuth');
const { ApiError, notFound, errorHandler } = require('./errorHandler');
const validateRequest = require('./validateRequest');

module.exports = {
  adminAuth,
  ApiError,
  notFound,
  errorHandler,
  validateRequest,
};
