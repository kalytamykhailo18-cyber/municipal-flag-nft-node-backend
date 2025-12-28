/**
 * User Controller
 * Handles all user-related operations
 */
const { User, UserConnection, FlagOwnership, FlagInterest } = require('../database/models');
const { ApiError } = require('../middlewares');

/**
 * Build user response with counts
 */
const buildUserResponse = async (user) => {
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
 * Get or create user by wallet address
 */
const getOrCreateUser = async (walletAddress) => {
  const wallet = walletAddress.toLowerCase();

  const [user] = await User.findOrCreate({
    where: { walletAddress: wallet },
    defaults: { walletAddress: wallet },
  });

  return user;
};

/**
 * Get user by wallet address
 */
const getUser = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({ where: { walletAddress: wallet } });

    if (!user) {
      throw new ApiError(404, `User with wallet ${wallet_address} not found`);
    }

    const response = await buildUserResponse(user);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create or get user
 */
const createOrGetUser = async (req, res, next) => {
  try {
    const { wallet_address, username } = req.body;

    const user = await getOrCreateUser(wallet_address);

    if (username) {
      await user.update({ username });
    }

    const response = await buildUserResponse(user);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateUser = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const { username } = req.body;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({ where: { walletAddress: wallet } });

    if (!user) {
      throw new ApiError(404, `User with wallet ${wallet_address} not found`);
    }

    if (username !== undefined) {
      await user.update({ username });
    }

    const response = await buildUserResponse(user);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all flags owned by a user
 */
const getUserFlags = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({ where: { walletAddress: wallet } });

    if (!user) {
      throw new ApiError(404, `User with wallet ${wallet_address} not found`);
    }

    const ownerships = await FlagOwnership.findAll({
      where: { userId: user.id },
      include: [{ association: 'flag' }],
    });

    const result = ownerships.map((ownership) => ({
      id: ownership.id,
      user_id: ownership.userId,
      flag_id: ownership.flagId,
      ownership_type: ownership.ownershipType,
      transaction_hash: ownership.transactionHash,
      created_at: ownership.createdAt,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all flag interests for a user
 */
const getUserInterests = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({ where: { walletAddress: wallet } });

    if (!user) {
      throw new ApiError(404, `User with wallet ${wallet_address} not found`);
    }

    const interests = await FlagInterest.findAll({
      where: { userId: user.id },
      include: [{ association: 'flag' }],
    });

    const result = interests.map((interest) => ({
      id: interest.id,
      user_id: interest.userId,
      flag_id: interest.flagId,
      created_at: interest.createdAt,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Follow another user
 */
const followUser = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const { target_wallet } = req.body;

    const followerWallet = wallet_address.toLowerCase();
    const followingWallet = target_wallet.toLowerCase();

    if (followerWallet === followingWallet) {
      throw new ApiError(400, 'Cannot follow yourself');
    }

    // Get or create both users
    const follower = await getOrCreateUser(followerWallet);
    const following = await getOrCreateUser(followingWallet);

    // Check if already following
    const existing = await UserConnection.findOne({
      where: {
        followerId: follower.id,
        followingId: following.id,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Already following this user');
    }

    const connection = await UserConnection.create({
      followerId: follower.id,
      followingId: following.id,
    });

    res.status(201).json({
      id: connection.id,
      follower_id: connection.followerId,
      following_id: connection.followingId,
      created_at: connection.createdAt,
      follower: await buildUserResponse(follower),
      following: await buildUserResponse(following),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfollow a user
 */
const unfollowUser = async (req, res, next) => {
  try {
    const { wallet_address, target_wallet } = req.params;

    const followerWallet = wallet_address.toLowerCase();
    const followingWallet = target_wallet.toLowerCase();

    const follower = await User.findOne({ where: { walletAddress: followerWallet } });
    const following = await User.findOne({ where: { walletAddress: followingWallet } });

    if (!follower || !following) {
      throw new ApiError(404, 'User not found');
    }

    const connection = await UserConnection.findOne({
      where: {
        followerId: follower.id,
        followingId: following.id,
      },
    });

    if (!connection) {
      throw new ApiError(404, 'Connection not found');
    }

    await connection.destroy();

    res.json({
      message: 'Unfollowed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all followers of a user
 */
const getFollowers = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({ where: { walletAddress: wallet } });

    if (!user) {
      throw new ApiError(404, `User with wallet ${wallet_address} not found`);
    }

    const connections = await UserConnection.findAll({
      where: { followingId: user.id },
      include: [{ association: 'follower' }],
    });

    const result = await Promise.all(
      connections.map((conn) => buildUserResponse(conn.follower))
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users that a user is following
 */
const getFollowing = async (req, res, next) => {
  try {
    const { wallet_address } = req.params;
    const wallet = wallet_address.toLowerCase();

    const user = await User.findOne({ where: { walletAddress: wallet } });

    if (!user) {
      throw new ApiError(404, `User with wallet ${wallet_address} not found`);
    }

    const connections = await UserConnection.findAll({
      where: { followerId: user.id },
      include: [{ association: 'followingUser' }],
    });

    const result = await Promise.all(
      connections.map((conn) => buildUserResponse(conn.followingUser))
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUser,
  createOrGetUser,
  updateUser,
  getUserFlags,
  getUserInterests,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
