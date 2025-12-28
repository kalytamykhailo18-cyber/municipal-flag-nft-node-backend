/**
 * Auction Routes
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auctionController = require('../controllers/auctionController');
const { validateRequest } = require('../middlewares');

// Valid categories
const CATEGORIES = ['standard', 'plus', 'premium'];

/**
 * @route   GET /api/auctions
 * @desc    Get all auctions with optional filters
 * @access  Public
 */
router.get(
  '/',
  [
    query('active_only')
      .optional()
      .isBoolean()
      .withMessage('active_only must be a boolean'),
    query('flag_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid flag_id'),
  ],
  validateRequest,
  auctionController.getAuctions
);

/**
 * @route   GET /api/auctions/:id
 * @desc    Get auction details with bid history
 * @access  Public
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid auction ID')],
  validateRequest,
  auctionController.getAuction
);

/**
 * @route   POST /api/auctions
 * @desc    Create a new auction
 * @access  Public (must own the flag)
 */
router.post(
  '/',
  [
    body('flag_id')
      .notEmpty()
      .withMessage('flag_id is required')
      .isInt({ min: 1 })
      .withMessage('Invalid flag_id'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('starting_price')
      .notEmpty()
      .withMessage('starting_price is required')
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Invalid starting_price format'),
    body('min_price')
      .optional()
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Invalid min_price format'),
    body('buyout_price')
      .optional()
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Invalid buyout_price format'),
    body('duration_hours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('duration_hours must be between 1 and 168 (1 week)'),
  ],
  validateRequest,
  auctionController.createAuction
);

/**
 * @route   POST /api/auctions/:id/bid
 * @desc    Place a bid on an auction
 * @access  Public
 */
router.post(
  '/:id/bid',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid auction ID'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('amount')
      .notEmpty()
      .withMessage('amount is required')
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Invalid amount format'),
    body('bidder_category')
      .optional()
      .isIn(CATEGORIES)
      .withMessage('Invalid bidder_category'),
  ],
  validateRequest,
  auctionController.placeBid
);

/**
 * @route   POST /api/auctions/:id/buyout
 * @desc    Instant buyout of an auction
 * @access  Public
 */
router.post(
  '/:id/buyout',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid auction ID'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  auctionController.buyoutAuction
);

/**
 * @route   POST /api/auctions/:id/close
 * @desc    Close an auction (after end time)
 * @access  Public
 */
router.post(
  '/:id/close',
  [param('id').isInt({ min: 1 }).withMessage('Invalid auction ID')],
  validateRequest,
  auctionController.closeAuction
);

/**
 * @route   POST /api/auctions/:id/cancel
 * @desc    Cancel an auction (only seller, if no bids)
 * @access  Public (must be seller)
 */
router.post(
  '/:id/cancel',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid auction ID'),
    body('wallet_address')
      .trim()
      .notEmpty()
      .withMessage('wallet_address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  auctionController.cancelAuction
);

module.exports = router;
