/**
 * Flag Controller
 * Handles all flag-related operations
 */
const { Flag, Municipality, User, FlagInterest, FlagOwnership } = require('../database/models');
const { ApiError } = require('../middlewares');

/**
 * Get all flags
 */
const getFlags = async (req, res, next) => {
  try {
    const { municipality_id, category } = req.query;

    const whereClause = {
      ...(municipality_id && { municipalityId: parseInt(municipality_id, 10) }),
      ...(category && { category }),
    };

    const flags = await Flag.findAll({
      where: whereClause,
      include: [
        {
          model: Municipality,
          as: 'municipality',
          attributes: ['id', 'name'],
        },
        {
          model: FlagInterest,
          as: 'interests',
          attributes: ['id'],
        },
      ],
      order: [['id', 'ASC']],
    });

    const result = flags.map((flag) => ({
      id: flag.id,
      municipality_id: flag.municipalityId,
      name: flag.name,
      location_type: flag.locationType,
      category: flag.category,
      nfts_required: flag.nftsRequired,
      image_ipfs_hash: flag.imageIpfsHash,
      metadata_ipfs_hash: flag.metadataIpfsHash,
      metadata_hash: flag.metadataHash,
      token_id: flag.tokenId,
      price: parseFloat(flag.price).toFixed(8),
      first_nft_status: flag.firstNftStatus,
      second_nft_status: flag.secondNftStatus,
      is_pair_complete: flag.isPairComplete,
      created_at: flag.createdAt,
      interest_count: flag.interests ? flag.interests.length : 0,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single flag with details
 */
const getFlag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const flag = await Flag.findByPk(id, {
      include: [
        {
          model: Municipality,
          as: 'municipality',
        },
        {
          model: FlagInterest,
          as: 'interests',
          include: [{ association: 'user' }],
        },
        {
          model: FlagOwnership,
          as: 'ownerships',
          include: [{ association: 'user' }],
        },
      ],
    });

    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    // Transform interests to snake_case format
    const transformedInterests = (flag.interests || []).map((interest) => ({
      id: interest.id,
      user_id: interest.userId,
      flag_id: interest.flagId,
      created_at: interest.createdAt,
      user: interest.user
        ? {
            id: interest.user.id,
            wallet_address: interest.user.walletAddress,
            username: interest.user.username,
            reputation_score: interest.user.reputationScore,
            created_at: interest.user.createdAt,
          }
        : null,
    }));

    // Transform ownerships to snake_case format
    const transformedOwnerships = (flag.ownerships || []).map((ownership) => ({
      id: ownership.id,
      user_id: ownership.userId,
      flag_id: ownership.flagId,
      ownership_type: ownership.ownershipType,
      transaction_hash: ownership.transactionHash,
      created_at: ownership.createdAt,
      user: ownership.user
        ? {
            id: ownership.user.id,
            wallet_address: ownership.user.walletAddress,
            username: ownership.user.username,
            reputation_score: ownership.user.reputationScore,
            created_at: ownership.user.createdAt,
          }
        : null,
    }));

    // Transform municipality to snake_case format
    const transformedMunicipality = flag.municipality
      ? {
          id: flag.municipality.id,
          name: flag.municipality.name,
          country_code: flag.municipality.countryCode,
          region: flag.municipality.region,
          latitude: flag.municipality.latitude,
          longitude: flag.municipality.longitude,
          created_at: flag.municipality.createdAt,
        }
      : null;

    res.json({
      id: flag.id,
      municipality_id: flag.municipalityId,
      name: flag.name,
      location_type: flag.locationType,
      category: flag.category,
      nfts_required: flag.nftsRequired,
      image_ipfs_hash: flag.imageIpfsHash,
      metadata_ipfs_hash: flag.metadataIpfsHash,
      metadata_hash: flag.metadataHash,
      token_id: flag.tokenId,
      price: parseFloat(flag.price).toFixed(8),
      first_nft_status: flag.firstNftStatus,
      second_nft_status: flag.secondNftStatus,
      is_pair_complete: flag.isPairComplete,
      created_at: flag.createdAt,
      interest_count: transformedInterests.length,
      municipality: transformedMunicipality,
      interests: transformedInterests,
      ownerships: transformedOwnerships,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new flag (admin only)
 */
const createFlag = async (req, res, next) => {
  try {
    const {
      municipality_id,
      name,
      location_type,
      category = 'standard',
      nfts_required = 1,
      image_ipfs_hash,
      metadata_ipfs_hash,
      price = 0.01,
    } = req.body;

    // Verify municipality exists
    const municipality = await Municipality.findByPk(municipality_id);
    if (!municipality) {
      throw new ApiError(400, `Municipality with id ${municipality_id} not found`);
    }

    const flag = await Flag.create({
      municipalityId: municipality_id,
      name,
      locationType: location_type,
      category,
      nftsRequired: nfts_required,
      imageIpfsHash: image_ipfs_hash,
      metadataIpfsHash: metadata_ipfs_hash,
      price,
    });

    res.status(201).json({
      id: flag.id,
      municipality_id: flag.municipalityId,
      name: flag.name,
      location_type: flag.locationType,
      category: flag.category,
      nfts_required: flag.nftsRequired,
      image_ipfs_hash: flag.imageIpfsHash,
      metadata_ipfs_hash: flag.metadataIpfsHash,
      token_id: flag.tokenId,
      price: parseFloat(flag.price).toFixed(8),
      first_nft_status: flag.firstNftStatus,
      second_nft_status: flag.secondNftStatus,
      is_pair_complete: flag.isPairComplete,
      created_at: flag.createdAt,
      interest_count: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a flag (admin only)
 */
const updateFlag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      location_type,
      category,
      nfts_required,
      image_ipfs_hash,
      metadata_ipfs_hash,
      price,
    } = req.body;

    const flag = await Flag.findByPk(id);

    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    await flag.update({
      ...(name !== undefined && { name }),
      ...(location_type !== undefined && { locationType: location_type }),
      ...(category !== undefined && { category }),
      ...(nfts_required !== undefined && { nftsRequired: nfts_required }),
      ...(image_ipfs_hash !== undefined && { imageIpfsHash: image_ipfs_hash }),
      ...(metadata_ipfs_hash !== undefined && { metadataIpfsHash: metadata_ipfs_hash }),
      ...(price !== undefined && { price }),
    });

    const interestCount = await FlagInterest.count({
      where: { flagId: flag.id },
    });

    res.json({
      id: flag.id,
      municipality_id: flag.municipalityId,
      name: flag.name,
      location_type: flag.locationType,
      category: flag.category,
      nfts_required: flag.nftsRequired,
      image_ipfs_hash: flag.imageIpfsHash,
      metadata_ipfs_hash: flag.metadataIpfsHash,
      metadata_hash: flag.metadataHash,
      token_id: flag.tokenId,
      price: parseFloat(flag.price).toFixed(8),
      first_nft_status: flag.firstNftStatus,
      second_nft_status: flag.secondNftStatus,
      is_pair_complete: flag.isPairComplete,
      created_at: flag.createdAt,
      interest_count: interestCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a flag (admin only)
 */
const deleteFlag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const flag = await Flag.findByPk(id);

    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    await flag.destroy();

    res.json({
      success: true,
      message: `Flag deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Express interest in a flag
 */
const expressInterest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address } = req.body;

    const flag = await Flag.findByPk(id);
    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    // Get or create user using findOrCreate to prevent race condition
    const wallet = wallet_address.toLowerCase();
    const [user] = await User.findOrCreate({
      where: { walletAddress: wallet },
      defaults: { walletAddress: wallet },
    });

    // Use findOrCreate for interest too to prevent race condition
    const [interest, created] = await FlagInterest.findOrCreate({
      where: {
        userId: user.id,
        flagId: flag.id,
      },
      defaults: {
        userId: user.id,
        flagId: flag.id,
      },
    });

    if (!created) {
      throw new ApiError(400, 'User already expressed interest in this flag');
    }

    res.status(201).json({
      id: interest.id,
      user_id: interest.userId,
      flag_id: interest.flagId,
      created_at: interest.createdAt,
      user: {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get interests for a flag
 */
const getFlagInterests = async (req, res, next) => {
  try {
    const { id } = req.params;

    const flag = await Flag.findByPk(id);
    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    const interests = await FlagInterest.findAll({
      where: { flagId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'walletAddress', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(
      interests.map((interest) => ({
        id: interest.id,
        user_id: interest.userId,
        flag_id: interest.flagId,
        wallet_address: interest.user?.walletAddress,
        username: interest.user?.username,
        created_at: interest.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Claim first NFT for a flag
 */
const claimFirstNft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address, transaction_hash } = req.body;

    const flag = await Flag.findByPk(id);
    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    if (flag.firstNftStatus !== 'available') {
      throw new ApiError(400, 'First NFT already claimed');
    }

    // Get or create user using findOrCreate to prevent race condition
    const wallet = wallet_address.toLowerCase();
    const [user] = await User.findOrCreate({
      where: { walletAddress: wallet },
      defaults: { walletAddress: wallet },
    });

    const ownership = await FlagOwnership.create({
      userId: user.id,
      flagId: flag.id,
      ownershipType: 'first',
      transactionHash: transaction_hash,
    });

    // Update flag status to 'claimed' (not 'purchased')
    await flag.update({ firstNftStatus: 'claimed' });

    // Increase user reputation by 10 points
    await user.update({ reputationScore: user.reputationScore + 10 });

    res.status(201).json({
      id: ownership.id,
      user_id: ownership.userId,
      flag_id: ownership.flagId,
      ownership_type: ownership.ownershipType,
      transaction_hash: ownership.transactionHash,
      created_at: ownership.createdAt,
      user: {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Purchase second NFT for a flag
 */
const purchaseSecondNft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address, transaction_hash } = req.body;

    const flag = await Flag.findByPk(id);
    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    // First NFT must be claimed before purchasing second
    if (flag.firstNftStatus !== 'claimed') {
      throw new ApiError(400, 'First NFT must be claimed before purchasing second');
    }

    if (flag.secondNftStatus !== 'available') {
      throw new ApiError(400, 'Second NFT already purchased');
    }

    // Get or create user using findOrCreate to prevent race condition
    const wallet = wallet_address.toLowerCase();
    const [user] = await User.findOrCreate({
      where: { walletAddress: wallet },
      defaults: { walletAddress: wallet },
    });

    const ownership = await FlagOwnership.create({
      userId: user.id,
      flagId: flag.id,
      ownershipType: 'second',
      transactionHash: transaction_hash,
    });

    // Update flag status
    await flag.update({
      secondNftStatus: 'purchased',
      isPairComplete: true,
    });

    // Increase user reputation by 25 points
    await user.update({ reputationScore: user.reputationScore + 25 });

    res.status(201).json({
      id: ownership.id,
      user_id: ownership.userId,
      flag_id: ownership.flagId,
      ownership_type: ownership.ownershipType,
      transaction_hash: ownership.transactionHash,
      created_at: ownership.createdAt,
      user: {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ownerships for a flag
 */
const getFlagOwnerships = async (req, res, next) => {
  try {
    const { id } = req.params;

    const flag = await Flag.findByPk(id);
    if (!flag) {
      throw new ApiError(404, `Flag with id ${id} not found`);
    }

    const ownerships = await FlagOwnership.findAll({
      where: { flagId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'walletAddress', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(
      ownerships.map((ownership) => ({
        id: ownership.id,
        user_id: ownership.userId,
        flag_id: ownership.flagId,
        ownership_type: ownership.ownershipType,
        transaction_hash: ownership.transactionHash,
        wallet_address: ownership.user?.walletAddress,
        username: ownership.user?.username,
        created_at: ownership.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFlags,
  getFlag,
  createFlag,
  updateFlag,
  deleteFlag,
  expressInterest,
  getFlagInterests,
  claimFirstNft,
  purchaseSecondNft,
  getFlagOwnerships,
};
