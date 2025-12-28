/**
 * Admin Routes
 * Matches original Python admin.py router exactly
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const { adminAuth, validateRequest } = require('../middlewares');

// Valid categories
const CATEGORIES = ['standard', 'plus', 'premium'];

// =============================================================================
// STATS AND HEALTH
// =============================================================================

/**
 * @route   GET /api/admin/stats
 * @desc    Get overall statistics
 * @access  Admin
 */
router.get('/stats', adminAuth, adminController.getStats);

/**
 * @route   GET /api/admin/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  const config = require('../config');
  res.json({
    status: 'healthy',
    project: config.projectName,
    environment: config.env,
  });
});

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * @route   POST /api/admin/seed
 * @desc    Seed the database with demo data (only if empty)
 * @access  Admin
 */
router.post('/seed', adminAuth, adminController.seedDemoData);

/**
 * @route   POST /api/admin/reset
 * @desc    Reset the database (delete all data). USE WITH CAUTION.
 * @access  Admin
 */
router.post('/reset', adminAuth, adminController.resetDatabase);

// =============================================================================
// IPFS OPERATIONS
// =============================================================================

/**
 * @route   GET /api/admin/ipfs-status
 * @desc    Get IPFS upload status
 * @access  Admin
 */
router.get('/ipfs-status', adminAuth, adminController.getIpfsStatus);

/**
 * @route   PATCH /api/admin/flags/:flagId/ipfs
 * @desc    Update IPFS hashes for a specific flag
 * @access  Admin
 */
router.patch(
  '/flags/:flagId/ipfs',
  adminAuth,
  [
    param('flagId').isInt({ min: 1 }).withMessage('Invalid flag ID'),
  ],
  validateRequest,
  adminController.updateFlagIpfsHashes
);

/**
 * @route   POST /api/admin/sync-ipfs-from-pinata
 * @desc    Sync IPFS hashes from Pinata to database flags
 * @access  Admin
 */
router.post('/sync-ipfs-from-pinata', adminAuth, adminController.syncIpfsFromPinata);

// =============================================================================
// DEMO USER ENDPOINTS
// =============================================================================

/**
 * @route   GET /api/admin/demo-user
 * @desc    Get demo user
 * @access  Admin
 */
router.get('/demo-user', adminAuth, adminController.getDemoUser);

/**
 * @route   POST /api/admin/create-demo-user
 * @desc    Create a demo user
 * @access  Admin
 */
router.post(
  '/create-demo-user',
  adminAuth,
  [
    body('wallet_address')
      .optional()
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('username')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Username must be at most 50 characters'),
    body('reputation_score')
      .optional()
      .isInt({ min: 0 })
      .withMessage('reputation_score must be a positive integer'),
  ],
  validateRequest,
  adminController.createDemoUser
);

/**
 * @route   POST /api/admin/seed-demo-ownership
 * @desc    Seed demo user with flag ownerships
 * @access  Admin
 */
router.post(
  '/seed-demo-ownership',
  adminAuth,
  [
    body('user_id')
      .notEmpty()
      .withMessage('user_id is required')
      .isInt({ min: 1 })
      .withMessage('Invalid user_id'),
    body('flag_count')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('flag_count must be between 1 and 50'),
    body('include_categories')
      .optional()
      .isArray()
      .withMessage('include_categories must be an array'),
  ],
  validateRequest,
  adminController.seedDemoUserOwnerships
);

/**
 * @route   DELETE /api/admin/demo-user
 * @desc    Delete demo user
 * @access  Admin
 */
router.delete('/demo-user', adminAuth, adminController.deleteDemoUser);

// =============================================================================
// VISIBILITY TOGGLES
// =============================================================================

/**
 * @route   PATCH /api/admin/countries/:id/visibility
 * @desc    Toggle country visibility
 * @access  Admin
 */
router.patch(
  '/countries/:id/visibility',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid country ID'),
    body('is_visible').isBoolean().withMessage('is_visible is required and must be a boolean'),
  ],
  validateRequest,
  adminController.toggleCountryVisibility
);

/**
 * @route   PATCH /api/admin/regions/:id/visibility
 * @desc    Toggle region visibility
 * @access  Admin
 */
router.patch(
  '/regions/:id/visibility',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid region ID'),
    body('is_visible').isBoolean().withMessage('is_visible is required and must be a boolean'),
  ],
  validateRequest,
  adminController.toggleRegionVisibility
);

/**
 * @route   PATCH /api/admin/municipalities/:id/visibility
 * @desc    Toggle municipality visibility
 * @access  Admin
 */
router.patch(
  '/municipalities/:id/visibility',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid municipality ID'),
    body('is_visible').isBoolean().withMessage('is_visible is required and must be a boolean'),
  ],
  validateRequest,
  adminController.toggleMunicipalityVisibility
);

// =============================================================================
// SERPAPI ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/admin/check-street-view
 * @desc    Check for available images at coordinates
 * @access  Admin
 */
router.post('/check-street-view', adminAuth, adminController.checkStreetView);

/**
 * @route   POST /api/admin/check-image-availability
 * @desc    Check if images are available for a location
 * @access  Admin
 */
router.post('/check-image-availability', adminAuth, adminController.checkImageAvailability);

/**
 * @route   GET /api/admin/serpapi/test
 * @desc    Test SerpAPI connection
 * @access  Admin
 */
router.get('/serpapi/test', adminAuth, adminController.testSerpApi);

/**
 * @route   GET /api/admin/serpapi/discover
 * @desc    Discover locations using SerpAPI
 * @access  Admin
 */
router.get('/serpapi/discover', adminAuth, adminController.serpApiDiscover);

/**
 * @route   GET /api/admin/serpapi/geocode
 * @desc    Geocode an address
 * @access  Admin
 */
router.get('/serpapi/geocode', adminAuth, adminController.serpApiGeocode);

/**
 * @route   GET /api/admin/serpapi/discover-municipality
 * @desc    Discover locations for a municipality
 * @access  Admin
 */
router.get('/serpapi/discover-municipality', adminAuth, adminController.serpApiDiscoverMunicipality);

/**
 * @route   GET /api/admin/serpapi/place-photos
 * @desc    Get photos for a place
 * @access  Admin
 */
router.get('/serpapi/place-photos', adminAuth, adminController.serpApiPlacePhotos);

/**
 * @route   GET /api/admin/serpapi/images
 * @desc    Search for images
 * @access  Admin
 */
router.get('/serpapi/images', adminAuth, adminController.serpApiImages);

/**
 * @route   POST /api/admin/serpapi/generate-flag-from-image
 * @desc    Download an image from SerpAPI search results
 * @access  Admin
 */
router.post('/serpapi/generate-flag-from-image', adminAuth, adminController.serpApiGenerateFlagFromImage);

// =============================================================================
// NFT GENERATION ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/admin/nft-from-coordinates
 * @desc    Generate an NFT flag from geographic coordinates
 * @access  Admin
 */
router.post(
  '/nft-from-coordinates',
  adminAuth,
  [
    body('municipality_id')
      .notEmpty()
      .withMessage('municipality_id is required')
      .isInt({ min: 1 })
      .withMessage('Invalid municipality_id'),
    body('latitude')
      .notEmpty()
      .withMessage('latitude is required')
      .isFloat({ min: -90, max: 90 })
      .withMessage('latitude must be between -90 and 90'),
    body('longitude')
      .notEmpty()
      .withMessage('longitude is required')
      .isFloat({ min: -180, max: 180 })
      .withMessage('longitude must be between -180 and 180'),
    body('location_type')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('location_type must be at most 50 characters'),
    body('category')
      .optional()
      .isIn(CATEGORIES)
      .withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
    body('nfts_required')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('nfts_required must be between 1 and 10'),
    body('custom_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('custom_name must be at most 100 characters'),
  ],
  validateRequest,
  adminController.nftFromCoordinates
);

module.exports = router;
