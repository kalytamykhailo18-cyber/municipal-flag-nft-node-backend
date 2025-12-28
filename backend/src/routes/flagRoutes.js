/**
 * Flag Routes
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const flagController = require('../controllers/flagController');
const { adminAuth, validateRequest } = require('../middlewares');

// Valid categories and statuses
const CATEGORIES = ['standard', 'plus', 'premium'];

/**
 * @route   GET /api/flags
 * @desc    Get all flags with optional filters
 * @access  Public
 */
router.get(
  '/',
  [
    query('municipality_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid municipality_id'),
    query('category')
      .optional()
      .isIn(CATEGORIES)
      .withMessage('Invalid category'),
    query('available_only')
      .optional()
      .isBoolean()
      .withMessage('available_only must be a boolean'),
  ],
  validateRequest,
  flagController.getFlags
);

/**
 * @route   GET /api/flags/:id
 * @desc    Get single flag with full details
 * @access  Public
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid flag ID')],
  validateRequest,
  flagController.getFlag
);

/**
 * @route   POST /api/flags
 * @desc    Create a new flag
 * @access  Admin
 */
router.post(
  '/',
  adminAuth,
  [
    body('municipality_id')
      .notEmpty()
      .withMessage('municipality_id is required')
      .isInt({ min: 1 })
      .withMessage('Invalid municipality_id'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Flag name is required')
      .isLength({ max: 200 })
      .withMessage('Flag name must be at most 200 characters'),
    body('location_type')
      .trim()
      .notEmpty()
      .withMessage('location_type is required')
      .isLength({ max: 50 })
      .withMessage('location_type must be at most 50 characters'),
    body('category')
      .optional()
      .isIn(CATEGORIES)
      .withMessage('Invalid category'),
    body('nfts_required')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('nfts_required must be between 1 and 10'),
    body('image_ipfs_hash')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('image_ipfs_hash must be at most 100 characters'),
    body('metadata_ipfs_hash')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('metadata_ipfs_hash must be at most 100 characters'),
    body('price')
      .optional()
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Invalid price format'),
  ],
  validateRequest,
  flagController.createFlag
);

/**
 * @route   PUT /api/flags/:id
 * @desc    Update a flag
 * @access  Admin
 */
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid flag ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Flag name must be at most 200 characters'),
    body('location_type')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('location_type must be at most 50 characters'),
    body('category')
      .optional()
      .isIn(CATEGORIES)
      .withMessage('Invalid category'),
    body('image_ipfs_hash')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('image_ipfs_hash must be at most 100 characters'),
    body('metadata_ipfs_hash')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('metadata_ipfs_hash must be at most 100 characters'),
    body('price')
      .optional()
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Invalid price format'),
  ],
  validateRequest,
  flagController.updateFlag
);

/**
 * @route   DELETE /api/flags/:id
 * @desc    Delete a flag
 * @access  Admin
 */
router.delete(
  '/:id',
  adminAuth,
  [param('id').isInt({ min: 1 }).withMessage('Invalid flag ID')],
  validateRequest,
  flagController.deleteFlag
);

// =============================================================================
// INTEREST ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/flags/:id/interest
 * @desc    Register user interest in a flag
 * @access  Public
 */
router.post(
  '/:id/interest',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid flag ID'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  flagController.expressInterest
);

/**
 * @route   GET /api/flags/:id/interests
 * @desc    Get all users interested in a flag
 * @access  Public
 */
router.get(
  '/:id/interests',
  [param('id').isInt({ min: 1 }).withMessage('Invalid flag ID')],
  validateRequest,
  flagController.getFlagInterests
);

// =============================================================================
// OWNERSHIP ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/flags/:id/claim
 * @desc    Record first NFT claim
 * @access  Public
 */
router.post(
  '/:id/claim',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid flag ID'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('transaction_hash')
      .optional()
      .trim()
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid transaction hash format'),
  ],
  validateRequest,
  flagController.claimFirstNft
);

/**
 * @route   POST /api/flags/:id/purchase
 * @desc    Record second NFT purchase
 * @access  Public
 */
router.post(
  '/:id/purchase',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid flag ID'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('transaction_hash')
      .optional()
      .trim()
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid transaction hash format'),
  ],
  validateRequest,
  flagController.purchaseSecondNft
);

/**
 * @route   GET /api/flags/:id/ownerships
 * @desc    Get ownership records for a flag
 * @access  Public
 */
router.get(
  '/:id/ownerships',
  [param('id').isInt({ min: 1 }).withMessage('Invalid flag ID')],
  validateRequest,
  flagController.getFlagOwnerships
);

module.exports = router;
