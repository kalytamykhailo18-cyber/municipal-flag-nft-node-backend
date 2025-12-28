/**
 * Country Routes
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const countryController = require('../controllers/countryController');
const { adminAuth, validateRequest } = require('../middlewares');

/**
 * @route   GET /api/countries
 * @desc    Get all countries
 * @access  Public
 */
router.get(
  '/',
  [
    query('visible_only')
      .optional()
      .isBoolean()
      .withMessage('visible_only must be a boolean'),
  ],
  validateRequest,
  countryController.getCountries
);

/**
 * @route   GET /api/countries/:id
 * @desc    Get single country with regions
 * @access  Public
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid country ID')],
  validateRequest,
  countryController.getCountry
);

/**
 * @route   POST /api/countries
 * @desc    Create a new country
 * @access  Admin
 */
router.post(
  '/',
  adminAuth,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Country name is required')
      .isLength({ max: 100 })
      .withMessage('Country name must be at most 100 characters'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Country code is required')
      .isLength({ min: 2, max: 3 })
      .withMessage('Country code must be 2-3 characters'),
    body('is_visible').optional().isBoolean().withMessage('is_visible must be a boolean'),
  ],
  validateRequest,
  countryController.createCountry
);

/**
 * @route   PUT /api/countries/:id
 * @desc    Update a country
 * @access  Admin
 */
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid country ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country name must be at most 100 characters'),
    body('code')
      .optional()
      .trim()
      .isLength({ min: 2, max: 3 })
      .withMessage('Country code must be 2-3 characters'),
    body('is_visible').optional().isBoolean().withMessage('is_visible must be a boolean'),
  ],
  validateRequest,
  countryController.updateCountry
);

/**
 * @route   DELETE /api/countries/:id
 * @desc    Delete a country
 * @access  Admin
 */
router.delete(
  '/:id',
  adminAuth,
  [param('id').isInt({ min: 1 }).withMessage('Invalid country ID')],
  validateRequest,
  countryController.deleteCountry
);

module.exports = router;
