/**
 * Response Transformers
 * Converts Sequelize model instances to snake_case API response format
 * Matches original Python/FastAPI response schemas exactly
 */

/**
 * Transform user to API response format (matches UserResponse schema)
 */
const transformUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    wallet_address: user.walletAddress,
    username: user.username,
    reputation_score: user.reputationScore,
    created_at: user.createdAt,
    flags_owned: user.ownerships ? user.ownerships.length : 0,
    followers_count: user.followers ? user.followers.length : 0,
    following_count: user.following ? user.following.length : 0,
  };
};

/**
 * Transform user with computed counts from associations
 */
const transformUserWithCounts = async (user, models) => {
  if (!user) return null;

  const { FlagOwnership, UserConnection } = models;

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
 * Transform flag to API response format (matches FlagResponse schema)
 */
const transformFlag = (flag) => {
  if (!flag) return null;
  return {
    id: flag.id,
    municipality_id: flag.municipalityId,
    name: flag.name,
    location_type: flag.locationType,
    category: flag.category,
    nfts_required: flag.nftsRequired,
    image_ipfs_hash: flag.imageIpfsHash,
    metadata_ipfs_hash: flag.metadataIpfsHash,
    metadata_hash: flag.metadataHash || null,
    token_id: flag.tokenId,
    price: flag.price ? parseFloat(flag.price).toFixed(8) : '0.00000000',
    first_nft_status: flag.firstNftStatus,
    second_nft_status: flag.secondNftStatus,
    is_pair_complete: flag.isPairComplete,
    created_at: flag.createdAt,
    interest_count: flag.interests ? flag.interests.length : 0,
  };
};

/**
 * Transform flag with full details (matches FlagDetailResponse schema)
 */
const transformFlagDetail = (flag) => {
  if (!flag) return null;

  const baseFlag = transformFlag(flag);

  // Transform interests with user info
  const interests = (flag.interests || []).map((interest) => ({
    id: interest.id,
    user_id: interest.userId,
    flag_id: interest.flagId,
    created_at: interest.createdAt,
    user: transformUser(interest.user),
  }));

  // Transform ownerships with user info
  const ownerships = (flag.ownerships || []).map((ownership) => ({
    id: ownership.id,
    user_id: ownership.userId,
    flag_id: ownership.flagId,
    ownership_type: ownership.ownershipType,
    transaction_hash: ownership.transactionHash,
    created_at: ownership.createdAt,
    user: transformUser(ownership.user),
  }));

  // Transform municipality
  const municipality = flag.municipality
    ? {
        id: flag.municipality.id,
        name: flag.municipality.name,
        region_id: flag.municipality.regionId,
        latitude: flag.municipality.latitude,
        longitude: flag.municipality.longitude,
        coordinates: flag.municipality.coordinates,
        is_visible: flag.municipality.isVisible,
        created_at: flag.municipality.createdAt,
        flag_count: flag.municipality.flags ? flag.municipality.flags.length : 0,
      }
    : null;

  return {
    ...baseFlag,
    municipality,
    interests,
    ownerships,
  };
};

/**
 * Transform flag interest to API response format
 */
const transformFlagInterest = (interest) => {
  if (!interest) return null;
  return {
    id: interest.id,
    user_id: interest.userId,
    flag_id: interest.flagId,
    created_at: interest.createdAt,
    user: transformUser(interest.user),
  };
};

/**
 * Transform flag ownership to API response format
 */
const transformFlagOwnership = (ownership) => {
  if (!ownership) return null;
  return {
    id: ownership.id,
    user_id: ownership.userId,
    flag_id: ownership.flagId,
    ownership_type: ownership.ownershipType,
    transaction_hash: ownership.transactionHash,
    created_at: ownership.createdAt,
    user: transformUser(ownership.user),
  };
};

/**
 * Transform country to API response format
 */
const transformCountry = (country, visibleOnly = true) => {
  if (!country) return null;

  const regions = country.regions || [];
  const regionCount = visibleOnly
    ? regions.filter((r) => r.isVisible).length
    : regions.length;

  return {
    id: country.id,
    name: country.name,
    code: country.code,
    is_visible: country.isVisible,
    created_at: country.createdAt,
    region_count: regionCount,
  };
};

/**
 * Transform region to API response format
 */
const transformRegion = (region, visibleOnly = true) => {
  if (!region) return null;

  const municipalities = region.municipalities || [];
  const municipalityCount = visibleOnly
    ? municipalities.filter((m) => m.isVisible).length
    : municipalities.length;

  return {
    id: region.id,
    name: region.name,
    country_id: region.countryId,
    is_visible: region.isVisible,
    created_at: region.createdAt,
    municipality_count: municipalityCount,
  };
};

/**
 * Transform municipality to API response format
 */
const transformMunicipality = (municipality) => {
  if (!municipality) return null;
  return {
    id: municipality.id,
    name: municipality.name,
    region_id: municipality.regionId,
    latitude: municipality.latitude,
    longitude: municipality.longitude,
    coordinates: municipality.coordinates,
    is_visible: municipality.isVisible,
    created_at: municipality.createdAt,
    flag_count: municipality.flags ? municipality.flags.length : 0,
  };
};

/**
 * Transform auction to API response format
 */
const transformAuction = (auction) => {
  if (!auction) return null;
  return {
    id: auction.id,
    flag_id: auction.flagId,
    seller_id: auction.sellerId,
    starting_price: auction.startingPrice ? parseFloat(auction.startingPrice) : 0,
    min_price: auction.minPrice ? parseFloat(auction.minPrice) : 0,
    buyout_price: auction.buyoutPrice ? parseFloat(auction.buyoutPrice) : null,
    current_highest_bid: auction.currentHighestBid
      ? parseFloat(auction.currentHighestBid)
      : null,
    highest_bidder_id: auction.highestBidderId,
    winner_category: auction.winnerCategory,
    status: auction.status,
    ends_at: auction.endsAt,
    created_at: auction.createdAt,
    flag: transformFlag(auction.flag),
    seller: transformUser(auction.seller),
    bid_count: auction.bids ? auction.bids.length : 0,
  };
};

/**
 * Transform auction with full details
 */
const transformAuctionDetail = (auction) => {
  if (!auction) return null;

  const base = transformAuction(auction);

  // Transform bids sorted by created_at desc
  const sortedBids = [...(auction.bids || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const bids = sortedBids.map((bid) => ({
    id: bid.id,
    auction_id: bid.auctionId,
    bidder_id: bid.bidderId,
    amount: parseFloat(bid.amount),
    bidder_category: bid.bidderCategory,
    created_at: bid.createdAt,
    bidder: transformUser(bid.bidder),
  }));

  return {
    ...base,
    bids,
    highest_bidder: transformUser(auction.highestBidder),
  };
};

/**
 * Transform bid to API response format
 */
const transformBid = (bid) => {
  if (!bid) return null;
  return {
    id: bid.id,
    auction_id: bid.auctionId,
    bidder_id: bid.bidderId,
    amount: parseFloat(bid.amount),
    bidder_category: bid.bidderCategory,
    created_at: bid.createdAt,
    bidder: transformUser(bid.bidder),
  };
};

/**
 * Transform connection to API response format
 */
const transformConnection = (connection, follower, following) => {
  if (!connection) return null;
  return {
    id: connection.id,
    follower_id: connection.followerId,
    following_id: connection.followingId,
    created_at: connection.createdAt,
    follower: transformUser(follower),
    following: transformUser(following),
  };
};

module.exports = {
  transformUser,
  transformUserWithCounts,
  transformFlag,
  transformFlagDetail,
  transformFlagInterest,
  transformFlagOwnership,
  transformCountry,
  transformRegion,
  transformMunicipality,
  transformAuction,
  transformAuctionDetail,
  transformBid,
  transformConnection,
};
