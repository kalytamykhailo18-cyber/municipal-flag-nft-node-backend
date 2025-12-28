/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { validateRequest } = require('../middlewares');

/**
 * @route   GET /api/users/:wallet_address
 * @desc    Get user by wallet address
 * @access  Public
 */
router.get(
  '/:wallet_address',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getUser
);

/**
 * @route   POST /api/users
 * @desc    Create a new user or get existing one
 * @access  Public
 */
router.post(
  '/',
  [
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('username')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Username must be at most 50 characters'),
  ],
  validateRequest,
  userController.createOrGetUser
);

/**
 * @route   PUT /api/users/:wallet_address
 * @desc    Update user profile
 * @access  Public
 */
router.put(
  '/:wallet_address',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('username')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Username must be at most 50 characters'),
  ],
  validateRequest,
  userController.updateUser
);

/**
 * @route   GET /api/users/:wallet_address/flags
 * @desc    Get all flags owned by a user
 * @access  Public
 */
router.get(
  '/:wallet_address/flags',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getUserFlags
);

/**
 * @route   GET /api/users/:wallet_address/interests
 * @desc    Get all flag interests for a user
 * @access  Public
 */
router.get(
  '/:wallet_address/interests',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getUserInterests
);

// =============================================================================
// SOCIAL CONNECTIONS
// =============================================================================

/**
 * @route   POST /api/users/:wallet_address/follow
 * @desc    Follow another user
 * @access  Public
 */
router.post(
  '/:wallet_address/follow',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('target_wallet')
      .trim()
      .notEmpty()
      .withMessage('target_wallet is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid target wallet address format'),
  ],
  validateRequest,
  userController.followUser
);

/**
 * @route   DELETE /api/users/:wallet_address/follow/:target_wallet
 * @desc    Unfollow a user
 * @access  Public
 */
router.delete(
  '/:wallet_address/follow/:target_wallet',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    param('target_wallet')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid target wallet address format'),
  ],
  validateRequest,
  userController.unfollowUser
);

/**
 * @route   GET /api/users/:wallet_address/followers
 * @desc    Get all followers of a user
 * @access  Public
 */
router.get(
  '/:wallet_address/followers',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getFollowers
);

/**
 * @route   GET /api/users/:wallet_address/following
 * @desc    Get all users that a user is following
 * @access  Public
 */
router.get(
  '/:wallet_address/following',
  [
    param('wallet_address')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getFollowing
);

module.exports = router;
