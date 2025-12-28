/**
 * Ranking Routes
 */
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const rankingController = require('../controllers/rankingController');
const { validateRequest } = require('../middlewares');

/**
 * @route   GET /api/rankings/users
 * @desc    Get top users by reputation score
 * @access  Public
 */
router.get(
  '/users',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],
  validateRequest,
  rankingController.getUserRankings
);

/**
 * @route   GET /api/rankings/collectors
 * @desc    Get top users by number of flags owned
 * @access  Public
 */
router.get(
  '/collectors',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],
  validateRequest,
  rankingController.getCollectorRankings
);

/**
 * @route   GET /api/rankings/flags
 * @desc    Get most popular flags by interest count
 * @access  Public
 */
router.get(
  '/flags',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],
  validateRequest,
  rankingController.getFlagRankings
);

/**
 * @route   GET /api/rankings/active-collectors
 * @desc    Get most active users (interests + ownerships + connections)
 * @access  Public
 */
router.get(
  '/active-collectors',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],
  validateRequest,
  rankingController.getActiveCollectors
);

module.exports = router;
