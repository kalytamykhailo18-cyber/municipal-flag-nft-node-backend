/**
 * Municipality Routes
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const municipalityController = require('../controllers/municipalityController');
const { adminAuth, validateRequest } = require('../middlewares');

/**
 * @route   GET /api/municipalities
 * @desc    Get all municipalities, optionally filtered by region
 * @access  Public
 */
router.get(
  '/',
  [
    query('region_id').optional().isInt({ min: 1 }).withMessage('Invalid region_id'),
    query('visible_only')
      .optional()
      .isBoolean()
      .withMessage('visible_only must be a boolean'),
  ],
  validateRequest,
  municipalityController.getMunicipalities
);

/**
 * @route   GET /api/municipalities/:id
 * @desc    Get single municipality with flags
 * @access  Public
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid municipality ID')],
  validateRequest,
  municipalityController.getMunicipality
);

/**
 * @route   POST /api/municipalities
 * @desc    Create a new municipality
 * @access  Admin
 */
router.post(
  '/',
  adminAuth,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Municipality name is required')
      .isLength({ max: 100 })
      .withMessage('Municipality name must be at most 100 characters'),
    body('region_id')
      .notEmpty()
      .withMessage('region_id is required')
      .isInt({ min: 1 })
      .withMessage('Invalid region_id'),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('is_visible').optional().isBoolean().withMessage('is_visible must be a boolean'),
  ],
  validateRequest,
  municipalityController.createMunicipality
);

/**
 * @route   PUT /api/municipalities/:id
 * @desc    Update a municipality
 * @access  Admin
 */
router.put(
  '/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid municipality ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Municipality name must be at most 100 characters'),
    body('region_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid region_id'),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('is_visible').optional().isBoolean().withMessage('is_visible must be a boolean'),
  ],
  validateRequest,
  municipalityController.updateMunicipality
);

/**
 * @route   DELETE /api/municipalities/:id
 * @desc    Delete a municipality
 * @access  Admin
 */
router.delete(
  '/:id',
  adminAuth,
  [param('id').isInt({ min: 1 }).withMessage('Invalid municipality ID')],
  validateRequest,
  municipalityController.deleteMunicipality
);

module.exports = router;
