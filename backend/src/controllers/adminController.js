/**
 * Admin Controller
 * Handles admin-related operations
 * Matches original Python admin.py router exactly
 */
const { Op } = require('sequelize');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const {
  Country,
  Region,
  Municipality,
  Flag,
  User,
  FlagInterest,
  FlagOwnership,
  Auction,
  UserConnection,
  Bid,
} = require('../database/models');
const { ApiError } = require('../middlewares');
const config = require('../config');
const {
  SerpAPIError,
  discoverLocations,
  geocodeLocation,
  discoverLocationsForMunicipality,
  getPlacePhotos,
  searchImages,
  getImageBytes,
  testSerpApiConnection,
} = require('../services/serpApiService');
const {
  IPFSError,
  uploadImage,
  uploadMetadata,
  generateMetadata,
  calculateContentHash,
} = require('../services/ipfsService');

/**
 * Build user response with counts (matching original Python build_user_response)
 */
const buildUserResponse = async (user) => {
  if (!user) return null;

  const [ownershipsCount, followersCount, followingCount] = await Promise.all([
    FlagOwnership.count({ where: { userId: user.id } }),
    UserConnection.count({ where: { followingId: user.id } }),
    UserConnection.count({ where: { followerId: user.id } }),
  ]);

  return {
    id: user.id,
    wallet_address: user.walletAddress,
    username: user.username,
    reputation_score: user.reputationScore,
    created_at: user.createdAt,
    flags_owned: ownershipsCount,
    followers_count: followersCount,
    following_count: followingCount,
  };
};

/**
 * Get admin statistics
 * GET /api/admin/stats
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalCountries,
      totalRegions,
      totalMunicipalities,
      totalFlags,
      totalUsers,
      totalInterests,
      totalOwnerships,
      totalAuctions,
      activeAuctions,
      completedPairs,
    ] = await Promise.all([
      Country.count(),
      Region.count(),
      Municipality.count(),
      Flag.count(),
      User.count(),
      FlagInterest.count(),
      FlagOwnership.count(),
      Auction.count(),
      Auction.count({ where: { status: 'active' } }),
      Flag.count({ where: { isPairComplete: true } }),
    ]);

    res.json({
      total_countries: totalCountries,
      total_regions: totalRegions,
      total_municipalities: totalMunicipalities,
      total_flags: totalFlags,
      total_users: totalUsers,
      total_interests: totalInterests,
      total_ownerships: totalOwnerships,
      total_auctions: totalAuctions,
      active_auctions: activeAuctions,
      completed_pairs: completedPairs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed demo data (only if database is empty)
 * POST /api/admin/seed
 */
const seedDemoData = async (req, res, next) => {
  try {
    const existingCountries = await Country.count();
    if (existingCountries > 0) {
      throw new ApiError(400, 'Database already has data. Cannot seed.');
    }

    // Import and run seed function
    const { seedDatabase } = require('../database/seed');
    await seedDatabase();

    res.json({
      message: 'Demo data seeded successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset the database (delete all data). USE WITH CAUTION.
 * POST /api/admin/reset
 */
const resetDatabase = async (req, res, next) => {
  try {
    // Delete in correct order to respect foreign keys
    await FlagInterest.destroy({ where: {}, truncate: true, cascade: true });
    await FlagOwnership.destroy({ where: {}, truncate: true, cascade: true });
    await Bid.destroy({ where: {}, truncate: true, cascade: true });
    await Auction.destroy({ where: {}, truncate: true, cascade: true });
    await UserConnection.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Flag.destroy({ where: {}, truncate: true, cascade: true });
    await Municipality.destroy({ where: {}, truncate: true, cascade: true });
    await Region.destroy({ where: {}, truncate: true, cascade: true });
    await Country.destroy({ where: {}, truncate: true, cascade: true });

    res.json({
      message: 'Database reset successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simple health check endpoint
 * GET /api/admin/health
 */
const healthCheck = async (req, res) => {
  res.json({
    status: 'healthy',
    project: config.projectName || 'NFT Flag Game',
    environment: config.env || 'development',
  });
};

/**
 * Get IPFS upload status for all flags
 * GET /api/admin/ipfs-status
 */
const getIpfsStatus = async (req, res, next) => {
  try {
    const [totalFlags, flagsWithImageHash, flagsWithMetadataHash] = await Promise.all([
      Flag.count(),
      Flag.count({ where: { imageIpfsHash: { [Op.ne]: null } } }),
      Flag.count({ where: { metadataIpfsHash: { [Op.ne]: null } } }),
    ]);

    res.json({
      total_flags: totalFlags,
      flags_with_image_hash: flagsWithImageHash,
      flags_with_metadata_hash: flagsWithMetadataHash,
      flags_pending_upload: totalFlags - flagsWithImageHash,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update IPFS hashes for a specific flag
 * PATCH /api/admin/flags/:flagId/ipfs
 */
const updateFlagIpfsHashes = async (req, res, next) => {
  try {
    const { flagId } = req.params;
    const { image_ipfs_hash, metadata_ipfs_hash } = req.body;

    const flag = await Flag.findByPk(flagId);
    if (!flag) {
      throw new ApiError(404, `Flag with id ${flagId} not found`);
    }

    const updates = {};
    if (image_ipfs_hash) {
      updates.imageIpfsHash = image_ipfs_hash;
    }
    if (metadata_ipfs_hash) {
      updates.metadataIpfsHash = metadata_ipfs_hash;
    }

    if (Object.keys(updates).length > 0) {
      await flag.update(updates);
    }

    res.json({
      flag_id: parseInt(flagId, 10),
      image_ipfs_hash: flag.imageIpfsHash,
      metadata_ipfs_hash: flag.metadataIpfsHash,
      message: 'IPFS hashes updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync IPFS hashes from Pinata to database flags
 * POST /api/admin/sync-ipfs-from-pinata
 */
const syncIpfsFromPinata = async (req, res, next) => {
  try {
    if (!config.pinata.jwt) {
      throw new ApiError(400, 'Pinata JWT not configured');
    }

    // Fetch all pinned files from Pinata
    const response = await axios.get('https://api.pinata.cloud/data/pinList', {
      params: { status: 'pinned', pageLimit: 1000 },
      headers: { Authorization: `Bearer ${config.pinata.jwt}` },
      timeout: 30000,
    });

    if (response.status !== 200) {
      throw new ApiError(502, `Failed to fetch from Pinata: ${response.statusText}`);
    }

    const pinataData = response.data;

    // Build mapping of flag_id -> ipfs_hash for images and metadata
    const imageMap = {}; // Primary: {COUNTRY}_{city}_{id}.png
    const imageMapFallback = {}; // Fallback: flag_{id}.png
    const metadataMap = {};

    for (const pin of pinataData.rows || []) {
      const name = pin.metadata?.name || '';
      const ipfsHash = pin.ipfs_pin_hash;

      if (!name || !ipfsHash) continue;

      // Match PRIMARY image files: {COUNTRY_CODE}_{municipality}_{flag_id}.png
      let match = name.match(/^[A-Z]{3}_[a-z]+_(\d+)\.png$/);
      if (match) {
        const flagId = parseInt(match[1], 10);
        imageMap[flagId] = ipfsHash;
        continue;
      }

      // Match FALLBACK: flag_{id}.png format
      match = name.match(/^flag_(\d+)\.png$/);
      if (match) {
        const flagId = parseInt(match[1], 10);
        imageMapFallback[flagId] = ipfsHash;
        continue;
      }

      // Match metadata files: flag_{id}_metadata.json
      match = name.match(/^flag_(\d+)_metadata\.json$/);
      if (match) {
        const flagId = parseInt(match[1], 10);
        metadataMap[flagId] = ipfsHash;
      }
    }

    // Merge fallback into main map (only if not already present)
    for (const [flagId, ipfsHash] of Object.entries(imageMapFallback)) {
      if (!imageMap[flagId]) {
        imageMap[flagId] = ipfsHash;
      }
    }

    // Get all flags and update them
    const flags = await Flag.findAll();
    let updatedCount = 0;

    for (const flag of flags) {
      const imageHash = imageMap[flag.id];
      const metadataHash = metadataMap[flag.id];

      let updated = false;
      if (imageHash && flag.imageIpfsHash !== imageHash) {
        flag.imageIpfsHash = imageHash;
        updated = true;
      }
      if (metadataHash && flag.metadataIpfsHash !== metadataHash) {
        flag.metadataIpfsHash = metadataHash;
        updated = true;
      }

      if (updated) {
        await flag.save();
        updatedCount++;
      }
    }

    res.json({
      message: `Synced IPFS hashes. Updated ${updatedCount} flags. Found ${Object.keys(imageMap).length} images and ${Object.keys(metadataMap).length} metadata files in Pinata.`,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// DEMO USER ENDPOINTS
// =============================================================================

/**
 * Get the demo user by wallet address
 * GET /api/admin/demo-user
 */
const getDemoUser = async (req, res, next) => {
  try {
    const { wallet_address = '0xdemo000000000000000000000000000000000001' } = req.query;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({
      where: { walletAddress: wallet },
    });

    if (!user) {
      throw new ApiError(404, 'Demo user not found. Create one first with POST /admin/create-demo-user');
    }

    const userResponse = await buildUserResponse(user);

    res.json({
      user: userResponse,
      message: 'Demo user retrieved successfully',
      created: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a demo user for testing and presentation purposes.
 * If a user with the wallet address already exists, returns that user.
 * POST /api/admin/create-demo-user
 */
const createDemoUser = async (req, res, next) => {
  try {
    const {
      wallet_address = '0xdemo000000000000000000000000000000000001',
      username = 'Demo User',
      reputation_score = 100,
    } = req.body;

    const wallet = wallet_address.toLowerCase();

    // Check if demo user already exists
    const existingUser = await User.findOne({ where: { walletAddress: wallet } });

    if (existingUser) {
      const userResponse = await buildUserResponse(existingUser);
      return res.json({
        user: userResponse,
        message: 'Demo user already exists',
        created: false,
      });
    }

    // Create new demo user
    const demoUser = await User.create({
      walletAddress: wallet,
      username,
      reputationScore: reputation_score,
    });

    const userResponse = await buildUserResponse(demoUser);

    res.status(201).json({
      user: userResponse,
      message: 'Demo user created successfully',
      created: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed demo user with flag ownerships for testing.
 * POST /api/admin/seed-demo-ownership
 */
const seedDemoUserOwnerships = async (req, res, next) => {
  try {
    const {
      user_id,
      flag_count = 5,
      include_categories = ['standard', 'plus', 'premium'],
    } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      throw new ApiError(404, `User with id ${user_id} not found`);
    }

    // Get flags already owned by this user
    const existingOwnerships = await FlagOwnership.findAll({
      where: { userId: user.id },
      attributes: ['flagId'],
    });
    const ownedFlagIds = existingOwnerships.map((o) => o.flagId);

    // Query available flags (not already owned by this user)
    const whereClause = {
      category: include_categories,
    };
    if (ownedFlagIds.length > 0) {
      whereClause.id = { [Op.notIn]: ownedFlagIds };
    }

    const availableFlags = await Flag.findAll({
      where: whereClause,
      limit: flag_count * 2,
    });

    if (availableFlags.length === 0) {
      throw new ApiError(400, 'No available flags found to assign ownership');
    }

    const flagsOwned = [];
    let ownershipsCreated = 0;

    // Assign ownership to flags (limited to flag_count)
    for (const flag of availableFlags.slice(0, flag_count)) {
      // Create first NFT ownership
      await FlagOwnership.create({
        userId: user.id,
        flagId: flag.id,
        ownershipType: 'first',
        transactionHash: `0xDEMO${'0'.repeat(58)}${String(flag.id).padStart(4, '0')}`,
      });
      await flag.update({ firstNftStatus: 'claimed' });
      ownershipsCreated += 1;

      // 50% chance to also give second NFT (complete pair)
      if (Math.random() > 0.5) {
        await FlagOwnership.create({
          userId: user.id,
          flagId: flag.id,
          ownershipType: 'second',
          transactionHash: `0xDEMO${'1'.repeat(58)}${String(flag.id).padStart(4, '0')}`,
        });
        await flag.update({
          secondNftStatus: 'purchased',
          isPairComplete: true,
        });
        ownershipsCreated += 1;
      }

      flagsOwned.push(flag.id);
    }

    res.json({
      ownerships_created: ownershipsCreated,
      flags_owned: flagsOwned,
      message: `Successfully assigned ownership of ${flagsOwned.length} flags to user ${user.username || user.walletAddress}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete the demo user and all associated data.
 * DELETE /api/admin/demo-user
 */
const deleteDemoUser = async (req, res, next) => {
  try {
    const { wallet_address = '0xdemo000000000000000000000000000000000001' } = req.query;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({
      where: { walletAddress: wallet },
      include: [
        {
          model: FlagOwnership,
          as: 'ownerships',
          include: [{ model: Flag, as: 'flag' }],
        },
      ],
    });

    if (!user) {
      throw new ApiError(404, 'Demo user not found');
    }

    // Reset flag statuses for owned flags
    for (const ownership of user.ownerships || []) {
      const flag = ownership.flag;
      if (flag) {
        if (ownership.ownershipType === 'first') {
          await flag.update({ firstNftStatus: 'available' });
        } else {
          await flag.update({ secondNftStatus: 'available' });
        }
        await flag.update({ isPairComplete: false });
      }
    }

    // Delete user (cascades to interests, ownerships, bids via database)
    await user.destroy();

    res.json({
      message: `Demo user ${wallet} deleted successfully`,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// VISIBILITY TOGGLES
// =============================================================================

/**
 * Toggle country visibility
 * PATCH /api/admin/countries/:id/visibility
 */
const toggleCountryVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    const country = await Country.findByPk(id);
    if (!country) {
      throw new ApiError(404, 'Country not found');
    }

    await country.update({ isVisible: is_visible });

    res.json({
      success: true,
      message: `Country visibility set to ${is_visible}`,
      is_visible: is_visible,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle region visibility
 * PATCH /api/admin/regions/:id/visibility
 */
const toggleRegionVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    const region = await Region.findByPk(id);
    if (!region) {
      throw new ApiError(404, 'Region not found');
    }

    await region.update({ isVisible: is_visible });

    res.json({
      success: true,
      message: `Region visibility set to ${is_visible}`,
      is_visible: is_visible,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle municipality visibility
 * PATCH /api/admin/municipalities/:id/visibility
 */
const toggleMunicipalityVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    const municipality = await Municipality.findByPk(id);
    if (!municipality) {
      throw new ApiError(404, 'Municipality not found');
    }

    await municipality.update({ isVisible: is_visible });

    res.json({
      success: true,
      message: `Municipality visibility set to ${is_visible}`,
      is_visible: is_visible,
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// SERPAPI ENDPOINTS
// =============================================================================

/**
 * Check for available images at coordinates
 * POST /api/admin/check-street-view
 */
const checkStreetView = async (req, res, next) => {
  try {
    const { latitude, longitude, location_type } = req.query;

    if (!latitude || !longitude) {
      throw new ApiError(400, 'latitude and longitude are required');
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Build search query
    let searchQuery;
    if (location_type) {
      searchQuery = `${location_type} ${lat} ${lon}`;
    } else {
      searchQuery = `landmark building ${lat} ${lon}`;
    }

    const images = await searchImages({ query: searchQuery, limit: 5 });

    if (images && images.length > 0) {
      const imageItems = images
        .filter((img) => img.url || img.thumbnail)
        .map((img) => ({
          url: img.url || '',
          thumbnail: img.thumbnail || '',
          title: img.title || '',
          source: img.source || '',
        }));

      res.json({
        message: `Found ${imageItems.length} images at (${lat}, ${lon})`,
        success: true,
        images: imageItems,
      });
    } else {
      throw new ApiError(
        400,
        `No images found at (${lat}, ${lon}). Try using /serpapi/images with a specific search query.`
      );
    }
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(400, `SerpAPI error: ${error.message}`));
    } else {
      next(error);
    }
  }
};

/**
 * Check image availability using SerpAPI
 * POST /api/admin/check-image-availability
 */
const checkImageAvailability = async (req, res, next) => {
  try {
    const { latitude, longitude, location_type = 'landmark' } = req.query;

    if (!latitude || !longitude) {
      throw new ApiError(400, 'latitude and longitude are required');
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const searchQuery = `${location_type} near ${lat},${lon}`;
    const images = await searchImages({ query: searchQuery, limit: 1 });

    if (images && images.length > 0) {
      res.json({
        message: `Images available for location (${lat}, ${lon}). Found ${images.length} result(s).`,
        success: true,
      });
    } else {
      throw new ApiError(400, `No images found for location (${lat}, ${lon})`);
    }
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(400, `SerpAPI error: ${error.message}`));
    } else {
      next(error);
    }
  }
};

/**
 * Test SerpAPI connection
 * GET /api/admin/serpapi/test
 */
const testSerpApi = async (req, res, next) => {
  try {
    const result = await testSerpApiConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Discover locations using SerpAPI
 * GET /api/admin/serpapi/discover
 */
const serpApiDiscover = async (req, res, next) => {
  try {
    const { query, latitude, longitude, zoom = 14, limit = 10 } = req.query;

    if (!query || !latitude || !longitude) {
      throw new ApiError(400, 'query, latitude, and longitude are required');
    }

    const locations = await discoverLocations({
      query,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      zoom: parseInt(zoom, 10),
      limit: parseInt(limit, 10),
    });

    res.json({
      query,
      center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      count: locations.length,
      locations,
    });
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(500, error.message));
    } else if (error instanceof Error && error.message.includes('Invalid')) {
      next(new ApiError(400, error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Geocode an address
 * GET /api/admin/serpapi/geocode
 */
const serpApiGeocode = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      throw new ApiError(400, 'address is required');
    }

    const result = await geocodeLocation(address);

    if (result) {
      res.json({
        address,
        latitude: result.latitude,
        longitude: result.longitude,
        success: true,
      });
    } else {
      throw new ApiError(404, `Could not geocode address: ${address}`);
    }
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(500, error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Discover locations for a municipality
 * GET /api/admin/serpapi/discover-municipality
 */
const serpApiDiscoverMunicipality = async (req, res, next) => {
  try {
    const { municipality_name, country_name, location_types } = req.query;

    if (!municipality_name || !country_name) {
      throw new ApiError(400, 'municipality_name and country_name are required');
    }

    let typesList = null;
    if (location_types) {
      typesList = location_types.split(',').map((t) => t.trim());
    }

    const results = await discoverLocationsForMunicipality({
      municipalityName: municipality_name,
      countryName: country_name,
      locationTypes: typesList,
    });

    const totalFound = Object.values(results).reduce((sum, locs) => sum + locs.length, 0);

    res.json({
      municipality: municipality_name,
      country: country_name,
      total_locations_found: totalFound,
      results,
    });
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(500, error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Get photos for a place
 * GET /api/admin/serpapi/place-photos
 */
const serpApiPlacePhotos = async (req, res, next) => {
  try {
    const { place_id, limit = 5 } = req.query;

    if (!place_id) {
      throw new ApiError(400, 'place_id is required');
    }

    const photos = await getPlacePhotos(place_id, parseInt(limit, 10));

    res.json({
      place_id,
      count: photos.length,
      photos,
    });
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(500, error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Search for images
 * GET /api/admin/serpapi/images
 */
const serpApiImages = async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query) {
      throw new ApiError(400, 'query is required');
    }

    const images = await searchImages({ query, limit: parseInt(limit, 10) });

    res.json({
      query,
      count: images.length,
      images,
    });
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(500, error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Download an image from SerpAPI search results
 * POST /api/admin/serpapi/generate-flag-from-image
 */
const serpApiGenerateFlagFromImage = async (req, res, next) => {
  try {
    const { image_url, flag_name, location_type = 'Landmark' } = req.body;

    if (!image_url || !flag_name) {
      throw new ApiError(400, 'image_url and flag_name are required');
    }

    const imageBytes = await getImageBytes(image_url);

    if (!imageBytes) {
      throw new ApiError(400, 'Could not download image from URL');
    }

    const flagBase64 = imageBytes.toString('base64');

    res.json({
      success: true,
      flag_name,
      location_type,
      source_url: image_url,
      flag_image_base64: flagBase64,
      image_size_bytes: imageBytes.length,
      message: 'Image downloaded successfully. Use this base64 to upload to IPFS.',
    });
  } catch (error) {
    if (error instanceof SerpAPIError) {
      next(new ApiError(400, `Failed to download image: ${error.message}`));
    } else {
      next(error);
    }
  }
};

// =============================================================================
// NFT GENERATION FROM COORDINATES
// =============================================================================

/**
 * Run Hardhat script to register flag on blockchain
 * @param {number} flagId - The flag ID to register
 * @param {string} category - The flag category (standard, plus, premium)
 * @returns {Promise<{success: boolean, message: string}>}
 */
const runBlockchainRegistration = async (flagId, category) => {
  return new Promise((resolve) => {
    const contractsDir = path.resolve(__dirname, '../../../../contracts');
    const registerScript = path.join(contractsDir, 'scripts', 'register-flag.js');

    // Map category to integer
    const categoryMap = { standard: 0, plus: 1, premium: 2 };
    const categoryInt = categoryMap[category.toLowerCase()] || 0;

    // Set environment variables for the script
    const env = {
      ...process.env,
      FLAG_ID: flagId.toString(),
      CATEGORY: categoryInt.toString(),
    };

    try {
      const child = spawn('npx', ['hardhat', 'run', registerScript, '--network', 'amoy'], {
        cwd: contractsDir,
        env,
        shell: true,
        timeout: 120000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`Successfully registered flag ${flagId} on blockchain`);
          resolve({ success: true, message: stdout });
        } else {
          console.error(`Failed to register flag ${flagId}: ${stderr}`);
          resolve({ success: false, message: stderr });
        }
      });

      child.on('error', (err) => {
        console.error(`Error running blockchain registration: ${err.message}`);
        resolve({ success: false, message: err.message });
      });
    } catch (err) {
      console.error(`Error spawning blockchain registration: ${err.message}`);
      resolve({ success: false, message: err.message });
    }
  });
};

/**
 * Generate an NFT from geographic coordinates
 * POST /api/admin/nft-from-coordinates
 *
 * Full pipeline:
 * 1. Validate coordinates and municipality
 * 2. Search for location image using SerpAPI Google Images
 * 3. Upload image to IPFS via Pinata
 * 4. Generate and upload metadata to IPFS
 * 5. Create Flag record in database
 * 6. Register flag on blockchain using Hardhat script
 */
const nftFromCoordinates = async (req, res, next) => {
  try {
    const {
      municipality_id,
      latitude,
      longitude,
      location_type = 'Landmark',
      category = 'standard',
      nfts_required = 1,
      custom_name,
    } = req.body;

    // Step 1: Validate municipality exists
    const municipality = await Municipality.findByPk(municipality_id, {
      include: [
        {
          model: Region,
          as: 'region',
          include: [{ model: Country, as: 'country' }],
        },
      ],
    });

    if (!municipality) {
      throw new ApiError(404, `Municipality with id ${municipality_id} not found`);
    }

    const region = municipality.region;
    const country = region.country;

    // Step 2: Generate flag name
    const coordinatesStr = `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
    const flagName = custom_name || `${municipality.name} ${location_type} (${coordinatesStr})`;

    // Check if flag with same name already exists
    const existingFlag = await Flag.findOne({ where: { name: flagName } });
    if (existingFlag) {
      throw new ApiError(409, `Flag with name '${flagName}' already exists`);
    }

    // Step 3: Search for location image using SerpAPI
    const searchQuery = `${municipality.name} ${location_type} ${country.name} building landmark`;
    let flagImage;

    try {
      const images = await searchImages({ query: searchQuery, limit: 5 });

      if (!images || images.length === 0) {
        throw new ApiError(400, `No images found for: ${searchQuery}`);
      }

      // Download the first available image
      for (const img of images) {
        try {
          const imageUrl = img.url || img.original || img.thumbnail;
          if (imageUrl) {
            flagImage = await getImageBytes(imageUrl);
            if (flagImage) break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!flagImage) {
        throw new ApiError(400, 'Could not download any images from search results');
      }
    } catch (error) {
      if (error instanceof SerpAPIError) {
        throw new ApiError(400, `SerpAPI image search failed: ${error.message}`);
      }
      throw error;
    }

    // Step 4: Upload image to IPFS
    let imageIpfsHash;
    try {
      imageIpfsHash = await uploadImage(flagImage, `flag_${municipality.name}_${location_type}`, {
        municipality: municipality.name,
        location_type: location_type,
        coordinates: coordinatesStr,
      });
    } catch (error) {
      if (error instanceof IPFSError) {
        throw new ApiError(500, `Failed to upload image to IPFS: ${error.message}`);
      }
      throw error;
    }

    // Step 5: Determine price based on category
    const categoryPrices = {
      standard: config.game?.prices?.standard || 0.01,
      plus: config.game?.prices?.plus || 0.02,
      premium: config.game?.prices?.premium || 0.05,
    };
    const price = categoryPrices[category] || categoryPrices.standard;

    // Step 6: Create flag record first to get ID
    const flag = await Flag.create({
      municipalityId: municipality_id,
      name: flagName,
      locationType: location_type,
      category,
      nftsRequired: nfts_required,
      imageIpfsHash,
      price,
    });

    // Step 7: Generate and upload metadata
    const metadata = generateMetadata({
      flagName,
      locationType: location_type,
      category,
      nftsRequired: nfts_required,
      coordinates: coordinatesStr,
      imageIpfsHash,
      countryName: country.name,
      regionName: region.name,
      municipalityName: municipality.name,
      flagId: flag.id,
    });

    const metadataHash = calculateContentHash(metadata);

    let metadataIpfsHash;
    try {
      metadataIpfsHash = await uploadMetadata(metadata, `flag_${flag.id}_metadata`);
    } catch (error) {
      // Rollback flag creation
      await flag.destroy();
      if (error instanceof IPFSError) {
        throw new ApiError(500, `Failed to upload metadata to IPFS: ${error.message}`);
      }
      throw error;
    }

    // Step 8: Update flag with metadata hashes
    await flag.update({
      metadataIpfsHash,
      metadataHash,
    });

    // Step 9: Register flag on blockchain (non-blocking)
    runBlockchainRegistration(flag.id, category)
      .then((result) => {
        if (result.success) {
          console.log(`Blockchain registration successful for flag ${flag.id}`);
        } else {
          console.error(`Blockchain registration failed for flag ${flag.id}: ${result.message}`);
        }
      })
      .catch((err) => {
        console.error(`Blockchain registration error for flag ${flag.id}: ${err.message}`);
      });

    res.status(201).json({
      flag_id: flag.id,
      flag_name: flag.name,
      image_ipfs_hash: imageIpfsHash,
      metadata_ipfs_hash: metadataIpfsHash,
      metadata_hash: metadataHash,
      coordinates: coordinatesStr,
      message: `Successfully created NFT flag '${flagName}' from coordinates`,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Stats and health
  getStats,
  healthCheck,
  // Database operations
  seedDemoData,
  resetDatabase,
  // IPFS operations
  getIpfsStatus,
  updateFlagIpfsHashes,
  syncIpfsFromPinata,
  // Demo user operations
  getDemoUser,
  createDemoUser,
  seedDemoUserOwnerships,
  deleteDemoUser,
  // Visibility toggles
  toggleCountryVisibility,
  toggleRegionVisibility,
  toggleMunicipalityVisibility,
  // SerpAPI endpoints
  checkStreetView,
  checkImageAvailability,
  testSerpApi,
  serpApiDiscover,
  serpApiGeocode,
  serpApiDiscoverMunicipality,
  serpApiPlacePhotos,
  serpApiImages,
  serpApiGenerateFlagFromImage,
  // NFT generation
  nftFromCoordinates,
};
