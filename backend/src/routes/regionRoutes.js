/**
 * Region Routes
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const regionController = require('../controllers/regionController');
const { adminAuth, validateRequest } = require('../middlewares');

/**
 * @route   GET /api/regions
 * @desc    Get all regions, optionally filtered by country
 * @access  Public
 */
router.get(
  '/',
  [
    query('country_id').optional().isInt({ min: 1 }).withMessage('Invalid country_id'),
    query('visible_only')
      .optional()
      .isBoolean()
      .withMessage('visible_only must be a boolean'),
  ],
  validateRequest,
  regionController.getRegions
);

/**
 * @route   GET /api/regions/:id
 * @desc    Get single region with municipalities
 * @access  Public
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid region ID')],
  validateRequest,
  regionController.getRegion
);

/**
 * @route   POST /api/regions
 * @desc    Create a new region
 * @access  Admin
 */
router.post(
  '/',
  adminAuth,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Region name is required')
      .isLength({ max: 100 })
      .withMessage('Region name must be at most 100 characters'),
    body('country_id')
      .notEmpty()
      .withMessage('country_id is required')
      .isInt({ min: 1 })
      .withMessage('Invalid country_id'),
    body('is_visible').optional().isBoolean().withMessage('is_visible must be a boolean'),
  ],
  validateRequest,
  regionController.createRegion
);

/**
 * @route   PUT /api/regions/:id
 * @desc    Update a region
 * @access  Admin
 */
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid region ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Region name must be at most 100 characters'),
    body('country_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid country_id'),
    body('is_visible').optional().isBoolean().withMessage('is_visible must be a boolean'),
  ],
  validateRequest,
  regionController.updateRegion
);

/**
 * @route   DELETE /api/regions/:id
 * @desc    Delete a region
 * @access  Admin
 */
router.delete(
  '/:id',
  adminAuth,
  [param('id').isInt({ min: 1 }).withMessage('Invalid region ID')],
  validateRequest,
  regionController.deleteRegion
);

module.exports = router;
