/**
 * Admin Authentication Middleware
 * Verifies admin API key for protected endpoints
 */
const config = require('../config');

const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-admin-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Missing admin API key',
    });
  }

  if (apiKey !== config.adminApiKey) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin API key',
    });
  }

  next();
};

module.exports = adminAuth;
