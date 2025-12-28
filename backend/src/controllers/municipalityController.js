/**
 * Municipality Controller
 * Handles all municipality-related operations
 */
const { Municipality, Region, Country, Flag, FlagInterest, FlagOwnership, User, UserConnection } = require('../database/models');
const { ApiError } = require('../middlewares');

/**
 * Get all municipalities
 */
const getMunicipalities = async (req, res, next) => {
  try {
    const { visible_only = 'true', region_id } = req.query;
    const visibleOnly = visible_only === 'true';

    const whereClause = {
      ...(visibleOnly && { isVisible: true }),
      ...(region_id && { regionId: parseInt(region_id, 10) }),
    };

    const municipalities = await Municipality.findAll({
      where: whereClause,
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['id', 'name'],
        },
        {
          model: Flag,
          as: 'flags',
          attributes: ['id'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    const result = municipalities.map((mun) => ({
      id: mun.id,
      name: mun.name,
      region_id: mun.regionId,
      latitude: mun.latitude,
      longitude: mun.longitude,
      coordinates: mun.coordinates,
      is_visible: mun.isVisible,
      created_at: mun.createdAt,
      flag_count: mun.flags ? mun.flags.length : 0,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Build user response with counts (matching original Python build_user_response)
 */
const buildUserResponse = async (user) => {
  if (!user) return null;

  const [followersCount, followingCount] = await Promise.all([
    UserConnection.count({ where: { followingId: user.id } }),
    UserConnection.count({ where: { followerId: user.id } }),
  ]);

  return {
    id: user.id,
    wallet_address: user.walletAddress,
    username: user.username,
    reputation_score: user.reputationScore,
    followers_count: followersCount,
    following_count: followingCount,
    created_at: user.createdAt,
  };
};

/**
 * Get single municipality with flags
 */
const getMunicipality = async (req, res, next) => {
  try {
    const { id } = req.params;

    const municipality = await Municipality.findByPk(id, {
      include: [
        {
          model: Region,
          as: 'region',
          include: [
            {
              model: Country,
              as: 'country',
            },
            {
              model: Municipality,
              as: 'municipalities',
              attributes: ['id'],
              required: false,
            },
          ],
        },
        {
          model: Flag,
          as: 'flags',
          include: [
            {
              model: FlagInterest,
              as: 'interests',
              include: [{ model: User, as: 'user' }],
            },
            {
              model: FlagOwnership,
              as: 'ownerships',
              include: [{ model: User, as: 'user' }],
            },
          ],
        },
      ],
    });

    if (!municipality) {
      throw new ApiError(404, `Municipality with id ${id} not found`);
    }

    // Build flags with properly transformed interests and ownerships
    const flagsData = await Promise.all(
      municipality.flags.map(async (flag) => {
        // Build interests with user data (matching original municipalities.py)
        const interestsData = await Promise.all(
          (flag.interests || []).map(async (interest) => ({
            id: interest.id,
            user_id: interest.userId,
            flag_id: interest.flagId,
            created_at: interest.createdAt,
            user: await buildUserResponse(interest.user),
          }))
        );

        // Build ownerships with user data (matching original municipalities.py)
        const ownershipsData = await Promise.all(
          (flag.ownerships || []).map(async (ownership) => ({
            id: ownership.id,
            user_id: ownership.userId,
            flag_id: ownership.flagId,
            ownership_type: ownership.ownershipType,
            transaction_hash: ownership.transactionHash,
            created_at: ownership.createdAt,
            user: await buildUserResponse(ownership.user),
          }))
        );

        return {
          id: flag.id,
          municipality_id: flag.municipalityId,
          name: flag.name,
          location_type: flag.locationType,
          category: flag.category,
          nfts_required: flag.nftsRequired,
          image_ipfs_hash: flag.imageIpfsHash,
          metadata_ipfs_hash: flag.metadataIpfsHash,
          token_id: flag.tokenId,
          price: flag.price,
          first_nft_status: flag.firstNftStatus,
          second_nft_status: flag.secondNftStatus,
          is_pair_complete: flag.isPairComplete,
          created_at: flag.createdAt,
          interest_count: interestsData.length,
          interests: interestsData,
          ownerships: ownershipsData,
        };
      })
    );

    // Build region response with municipality_count
    const regionData = municipality.region
      ? {
          id: municipality.region.id,
          name: municipality.region.name,
          country_id: municipality.region.countryId,
          is_visible: municipality.region.isVisible,
          created_at: municipality.region.createdAt,
          municipality_count: municipality.region.municipalities
            ? municipality.region.municipalities.length
            : 0,
        }
      : null;

    res.json({
      id: municipality.id,
      name: municipality.name,
      region_id: municipality.regionId,
      latitude: municipality.latitude,
      longitude: municipality.longitude,
      coordinates: municipality.coordinates,
      is_visible: municipality.isVisible,
      created_at: municipality.createdAt,
      flag_count: flagsData.length,
      region: regionData,
      flags: flagsData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new municipality (admin only)
 */
const createMunicipality = async (req, res, next) => {
  try {
    const { name, region_id, latitude, longitude, is_visible = true } = req.body;

    // Verify region exists
    const region = await Region.findByPk(region_id);
    if (!region) {
      throw new ApiError(400, `Region with id ${region_id} not found`);
    }

    const municipality = await Municipality.create({
      name,
      regionId: region_id,
      latitude,
      longitude,
      isVisible: is_visible,
    });

    res.status(201).json({
      id: municipality.id,
      name: municipality.name,
      region_id: municipality.regionId,
      latitude: municipality.latitude,
      longitude: municipality.longitude,
      coordinates: municipality.coordinates,
      is_visible: municipality.isVisible,
      created_at: municipality.createdAt,
      flag_count: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a municipality (admin only)
 */
const updateMunicipality = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, region_id, latitude, longitude, is_visible } = req.body;

    const municipality = await Municipality.findByPk(id);

    if (!municipality) {
      throw new ApiError(404, `Municipality with id ${id} not found`);
    }

    // Verify new region exists if provided
    if (region_id) {
      const region = await Region.findByPk(region_id);
      if (!region) {
        throw new ApiError(400, `Region with id ${region_id} not found`);
      }
    }

    await municipality.update({
      ...(name !== undefined && { name }),
      ...(region_id !== undefined && { regionId: region_id }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(is_visible !== undefined && { isVisible: is_visible }),
    });

    const flagCount = await Flag.count({
      where: { municipalityId: municipality.id },
    });

    res.json({
      id: municipality.id,
      name: municipality.name,
      region_id: municipality.regionId,
      latitude: municipality.latitude,
      longitude: municipality.longitude,
      coordinates: municipality.coordinates,
      is_visible: municipality.isVisible,
      created_at: municipality.createdAt,
      flag_count: flagCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a municipality (admin only)
 */
const deleteMunicipality = async (req, res, next) => {
  try {
    const { id } = req.params;

    const municipality = await Municipality.findByPk(id);

    if (!municipality) {
      throw new ApiError(404, `Municipality with id ${id} not found`);
    }

    const municipalityName = municipality.name;
    await municipality.destroy();

    res.json({
      success: true,
      message: `Municipality '${municipalityName}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMunicipalities,
  getMunicipality,
  createMunicipality,
  updateMunicipality,
  deleteMunicipality,
};
