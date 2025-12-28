/**
 * Ranking Controller
 * Handles ranking-related operations
 * Matches original Python/FastAPI rankings.py exactly
 */
const {
  User,
  Flag,
  FlagOwnership,
  FlagInterest,
  UserConnection,
} = require('../database/models');

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
 * Transform user to simple response (for nested user in interests/ownerships)
 */
const transformUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    wallet_address: user.walletAddress,
    username: user.username,
    reputation_score: user.reputationScore,
    created_at: user.createdAt,
    followers_count: user.followers ? user.followers.length : 0,
    following_count: user.following ? user.following.length : 0,
  };
};

/**
 * Get top users by reputation score
 * GET /api/rankings/users
 */
const getUserRankings = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.findAll({
      order: [['reputationScore', 'DESC']],
      limit: parseInt(limit, 10),
    });

    const result = await Promise.all(
      users.map(async (user, index) => {
        const userResponse = await buildUserResponse(user);
        return {
          rank: index + 1,
          user: userResponse,
          score: user.reputationScore,
        };
      })
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get top users by number of flags owned
 * GET /api/rankings/collectors
 */
const getCollectorRankings = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get users who have at least one flag ownership
    const users = await User.findAll({
      include: [
        { model: FlagOwnership, as: 'ownerships', attributes: ['id'] },
        { model: UserConnection, as: 'followers', attributes: ['id'] },
        { model: UserConnection, as: 'following', attributes: ['id'] },
      ],
    });

    // Filter users with at least one ownership and calculate counts
    const usersWithOwnerships = users
      .filter((user) => user.ownerships && user.ownerships.length > 0)
      .map((user) => ({
        user,
        ownershipCount: user.ownerships.length,
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0,
      }))
      .sort((a, b) => b.ownershipCount - a.ownershipCount)
      .slice(0, parseInt(limit, 10));

    const result = usersWithOwnerships.map((item, index) => ({
      rank: index + 1,
      user: {
        id: item.user.id,
        wallet_address: item.user.walletAddress,
        username: item.user.username,
        reputation_score: item.user.reputationScore,
        created_at: item.user.createdAt,
        flags_owned: item.ownershipCount,
        followers_count: item.followersCount,
        following_count: item.followingCount,
      },
      score: item.ownershipCount,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get most popular flags by interest count
 * GET /api/rankings/flags
 */
const getFlagRankings = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get flags with their interests and ownerships
    const flags = await Flag.findAll({
      include: [
        {
          model: FlagInterest,
          as: 'interests',
          include: [
            {
              model: User,
              as: 'user',
              include: [
                { model: UserConnection, as: 'followers', attributes: ['id'] },
                { model: UserConnection, as: 'following', attributes: ['id'] },
              ],
            },
          ],
        },
        {
          model: FlagOwnership,
          as: 'ownerships',
          include: [
            {
              model: User,
              as: 'user',
              include: [
                { model: UserConnection, as: 'followers', attributes: ['id'] },
                { model: UserConnection, as: 'following', attributes: ['id'] },
              ],
            },
          ],
        },
      ],
    });

    // Sort by interest count and limit
    const sortedFlags = flags
      .map((flag) => ({
        flag,
        interestCount: flag.interests ? flag.interests.length : 0,
      }))
      .sort((a, b) => b.interestCount - a.interestCount)
      .slice(0, parseInt(limit, 10));

    const result = sortedFlags.map((item, index) => {
      const { flag, interestCount } = item;

      // Build interests list with user info
      const interests = (flag.interests || []).map((interest) => ({
        id: interest.id,
        user_id: interest.userId,
        flag_id: interest.flagId,
        created_at: interest.createdAt,
        user: transformUser(interest.user),
      }));

      // Build ownerships list with user info
      const ownerships = (flag.ownerships || []).map((ownership) => ({
        id: ownership.id,
        user_id: ownership.userId,
        flag_id: ownership.flagId,
        ownership_type: ownership.ownershipType,
        transaction_hash: ownership.transactionHash,
        created_at: ownership.createdAt,
        user: transformUser(ownership.user),
      }));

      return {
        rank: index + 1,
        flag: {
          id: flag.id,
          municipality_id: flag.municipalityId,
          name: flag.name,
          location_type: flag.locationType,
          category: flag.category,
          nfts_required: flag.nftsRequired,
          image_ipfs_hash: flag.imageIpfsHash,
          metadata_ipfs_hash: flag.metadataIpfsHash,
          token_id: flag.tokenId,
          price: flag.price ? parseFloat(flag.price).toFixed(8) : '0.00000000',
          first_nft_status: flag.firstNftStatus,
          second_nft_status: flag.secondNftStatus,
          is_pair_complete: flag.isPairComplete,
          created_at: flag.createdAt,
          interest_count: interestCount,
          interests,
          ownerships,
        },
        interest_count: interestCount,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get most active users (interests + ownerships + connections)
 * GET /api/rankings/active-collectors
 */
const getActiveCollectors = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get all users with their related data
    const users = await User.findAll({
      include: [
        { model: FlagInterest, as: 'interests' },
        { model: FlagOwnership, as: 'ownerships' },
        { model: UserConnection, as: 'followers' },
        { model: UserConnection, as: 'following' },
      ],
    });

    // Calculate activity score for each user
    // Original formula: interests*1 + ownerships*5 + followers*2 + following*1
    const userScores = users
      .map((user) => {
        const interestsCount = user.interests ? user.interests.length : 0;
        const ownershipsCount = user.ownerships ? user.ownerships.length : 0;
        const followersCount = user.followers ? user.followers.length : 0;
        const followingCount = user.following ? user.following.length : 0;

        const activityScore =
          interestsCount * 1 +
          ownershipsCount * 5 +
          followersCount * 2 +
          followingCount * 1;

        return {
          user,
          activityScore,
          ownershipsCount,
          followersCount,
          followingCount,
        };
      })
      .filter((item) => item.activityScore > 0)
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, parseInt(limit, 10));

    const result = userScores.map((item, index) => ({
      rank: index + 1,
      user: {
        id: item.user.id,
        wallet_address: item.user.walletAddress,
        username: item.user.username,
        reputation_score: item.user.reputationScore,
        created_at: item.user.createdAt,
        flags_owned: item.ownershipsCount,
        followers_count: item.followersCount,
        following_count: item.followingCount,
      },
      score: item.activityScore,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserRankings,
  getCollectorRankings,
  getFlagRankings,
  getActiveCollectors,
};
