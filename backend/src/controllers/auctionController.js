/**
 * Auction Controller
 * Handles all auction-related operations
 */
const { Op } = require('sequelize');
const { Auction, Bid, Flag, User, FlagOwnership } = require('../database/models');
const { ApiError } = require('../middlewares');

// Category priority for tie-breaking (higher = better)
const CATEGORY_PRIORITY = {
  standard: 1,
  plus: 2,
  premium: 3,
};

/**
 * Determine auction winner based on:
 * 1. Highest bid amount
 * 2. If tie: Category (Premium > Plus > Standard)
 * 3. If still tie: Earliest timestamp
 */
const determineWinner = (bids) => {
  if (!bids || bids.length === 0) return null;

  const sortedBids = [...bids].sort((a, b) => {
    // First by amount (descending)
    const amountDiff = parseFloat(b.amount) - parseFloat(a.amount);
    if (amountDiff !== 0) return amountDiff;

    // Then by category priority (descending)
    const catA = CATEGORY_PRIORITY[a.bidderCategory] || 1;
    const catB = CATEGORY_PRIORITY[b.bidderCategory] || 1;
    if (catB !== catA) return catB - catA;

    // Finally by created_at (ascending - earlier wins)
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return sortedBids[0];
};

/**
 * Get all auctions
 */
const getAuctions = async (req, res, next) => {
  try {
    // Match original Python: active_only defaults to true
    const { active_only = 'true', flag_id } = req.query;
    const activeOnly = active_only === 'true';

    const whereClause = {
      ...(activeOnly && { status: 'active' }),
      ...(flag_id && { flagId: parseInt(flag_id, 10) }),
    };

    const auctions = await Auction.findAll({
      where: whereClause,
      include: [
        { association: 'flag' },
        { association: 'seller' },
        {
          model: Bid,
          as: 'bids',
          attributes: ['id'],
        },
      ],
      order: [['endsAt', 'ASC']], // Match original: order by ends_at
    });

    // Transform user object to snake_case
    const transformUser = (user) => {
      if (!user) return null;
      return {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
      };
    };

    // Transform flag object to snake_case
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
        token_id: flag.tokenId,
        price: parseFloat(flag.price),
        first_nft_status: flag.firstNftStatus,
        second_nft_status: flag.secondNftStatus,
        is_pair_complete: flag.isPairComplete,
        created_at: flag.createdAt,
      };
    };

    const result = auctions.map((auction) => ({
      id: auction.id,
      flag_id: auction.flagId,
      seller_id: auction.sellerId,
      starting_price: parseFloat(auction.startingPrice),
      min_price: parseFloat(auction.minPrice),
      buyout_price: auction.buyoutPrice ? parseFloat(auction.buyoutPrice) : null,
      current_highest_bid: auction.currentHighestBid ? parseFloat(auction.currentHighestBid) : null,
      highest_bidder_id: auction.highestBidderId,
      winner_category: auction.winnerCategory,
      status: auction.status,
      ends_at: auction.endsAt,
      created_at: auction.createdAt,
      flag: transformFlag(auction.flag),
      seller: transformUser(auction.seller),
      bid_count: auction.bids ? auction.bids.length : 0,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single auction with bids
 */
const getAuction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findByPk(id, {
      include: [
        { association: 'flag' },
        { association: 'seller' },
        { association: 'highestBidder' },
        {
          model: Bid,
          as: 'bids',
          include: [{ association: 'bidder' }],
          order: [['amount', 'DESC']],
        },
      ],
    });

    if (!auction) {
      throw new ApiError(404, `Auction with id ${id} not found`);
    }

    // Transform user object to snake_case
    const transformUser = (user) => {
      if (!user) return null;
      return {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
      };
    };

    // Transform flag object to snake_case
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
        token_id: flag.tokenId,
        price: parseFloat(flag.price),
        first_nft_status: flag.firstNftStatus,
        second_nft_status: flag.secondNftStatus,
        is_pair_complete: flag.isPairComplete,
        created_at: flag.createdAt,
      };
    };

    // Transform bids to snake_case
    const transformedBids = (auction.bids || []).map((bid) => ({
      id: bid.id,
      auction_id: bid.auctionId,
      bidder_id: bid.bidderId,
      amount: parseFloat(bid.amount),
      bidder_category: bid.bidderCategory,
      created_at: bid.createdAt,
      bidder: transformUser(bid.bidder),
    }));

    res.json({
      id: auction.id,
      flag_id: auction.flagId,
      seller_id: auction.sellerId,
      starting_price: parseFloat(auction.startingPrice),
      min_price: parseFloat(auction.minPrice),
      buyout_price: auction.buyoutPrice ? parseFloat(auction.buyoutPrice) : null,
      current_highest_bid: auction.currentHighestBid ? parseFloat(auction.currentHighestBid) : null,
      highest_bidder_id: auction.highestBidderId,
      winner_category: auction.winnerCategory,
      status: auction.status,
      ends_at: auction.endsAt,
      created_at: auction.createdAt,
      flag: transformFlag(auction.flag),
      seller: transformUser(auction.seller),
      highest_bidder: transformUser(auction.highestBidder),
      bids: transformedBids,
      bid_count: transformedBids.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new auction
 */
const createAuction = async (req, res, next) => {
  try {
    const {
      flag_id,
      wallet_address,
      starting_price,
      min_price,
      buyout_price,
      duration_hours,
    } = req.body;

    // Verify flag exists
    const flag = await Flag.findByPk(flag_id);
    if (!flag) {
      throw new ApiError(400, `Flag with id ${flag_id} not found`);
    }

    // Get or create user using findOrCreate to prevent race condition
    const wallet = wallet_address.toLowerCase();
    const [user] = await User.findOrCreate({
      where: { walletAddress: wallet },
      defaults: { walletAddress: wallet },
    });

    const ownership = await FlagOwnership.findOne({
      where: {
        userId: user.id,
        flagId: flag_id,
      },
    });

    if (!ownership) {
      throw new ApiError(400, 'You do not own this flag');
    }

    // Check no active auction for this flag
    const activeAuction = await Auction.findOne({
      where: {
        flagId: flag_id,
        status: 'active',
      },
    });

    if (activeAuction) {
      throw new ApiError(400, 'Flag already has an active auction');
    }

    // Calculate end time
    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + duration_hours);

    const auction = await Auction.create({
      flagId: flag_id,
      sellerId: user.id,
      startingPrice: starting_price,
      minPrice: min_price || starting_price,
      buyoutPrice: buyout_price,
      endsAt,
    });

    res.status(201).json({
      id: auction.id,
      flag_id: auction.flagId,
      seller_id: auction.sellerId,
      starting_price: parseFloat(auction.startingPrice),
      min_price: parseFloat(auction.minPrice),
      buyout_price: auction.buyoutPrice ? parseFloat(auction.buyoutPrice) : null,
      current_highest_bid: null,
      highest_bidder_id: null,
      winner_category: null,
      status: auction.status,
      ends_at: auction.endsAt,
      created_at: auction.createdAt,
      bid_count: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Place a bid
 */
const placeBid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address, amount, bidder_category = 'standard' } = req.body;

    const auction = await Auction.findByPk(id);

    if (!auction) {
      throw new ApiError(404, `Auction with id ${id} not found`);
    }

    if (auction.status !== 'active') {
      throw new ApiError(400, 'Auction is not active');
    }

    if (new Date() > new Date(auction.endsAt)) {
      throw new ApiError(400, 'Auction has ended');
    }

    // Validate bid amount
    if (parseFloat(amount) < parseFloat(auction.minPrice)) {
      throw new ApiError(400, `Bid must be at least ${auction.minPrice}`);
    }

    if (auction.currentHighestBid && parseFloat(amount) <= parseFloat(auction.currentHighestBid)) {
      throw new ApiError(400, 'Bid must be higher than current highest bid');
    }

    // Get or create user using findOrCreate to prevent race condition
    const wallet = wallet_address.toLowerCase();
    const [user] = await User.findOrCreate({
      where: { walletAddress: wallet },
      defaults: { walletAddress: wallet },
    });

    // Create bid
    const bid = await Bid.create({
      auctionId: auction.id,
      bidderId: user.id,
      amount,
      bidderCategory: bidder_category,
    });

    // Update auction
    await auction.update({
      currentHighestBid: amount,
      highestBidderId: user.id,
      winnerCategory: bidder_category,
    });

    res.status(201).json({
      id: bid.id,
      auction_id: bid.auctionId,
      bidder_id: bid.bidderId,
      amount: parseFloat(bid.amount),
      bidder_category: bid.bidderCategory,
      created_at: bid.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Instant buyout of an auction at the buyout price.
 * This immediately closes the auction and transfers ownership.
 */
const buyoutAuction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address } = req.body;

    const auction = await Auction.findByPk(id, {
      include: [
        { association: 'flag' },
        { association: 'seller' },
        {
          model: Bid,
          as: 'bids',
          attributes: ['id'],
        },
      ],
    });

    if (!auction) {
      throw new ApiError(404, `Auction with id ${id} not found`);
    }

    if (auction.status !== 'active') {
      throw new ApiError(400, 'Auction is not active');
    }

    if (!auction.buyoutPrice) {
      throw new ApiError(400, 'This auction does not have a buyout option');
    }

    // Check auction hasn't ended
    if (new Date() > new Date(auction.endsAt)) {
      throw new ApiError(400, 'Auction has ended');
    }

    // Get or create user using findOrCreate to prevent race condition
    const wallet = wallet_address.toLowerCase();
    const [buyer] = await User.findOrCreate({
      where: { walletAddress: wallet },
      defaults: { walletAddress: wallet },
    });

    // Can't buyout own auction
    if (buyer.id === auction.sellerId) {
      throw new ApiError(400, 'Cannot buyout your own auction');
    }

    // Close the auction with buyout
    await auction.update({
      status: 'closed',
      currentHighestBid: auction.buyoutPrice,
      highestBidderId: buyer.id,
    });

    // Award reputation to buyer (+20 bonus for buyout)
    await buyer.update({
      reputationScore: buyer.reputationScore + 20,
    });

    // Return full auction response matching original Python
    const transformUser = (user) => {
      if (!user) return null;
      return {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
        flags_owned: 0,
        followers_count: 0,
        following_count: 0,
      };
    };

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
        token_id: flag.tokenId,
        price: flag.price,
        first_nft_status: flag.firstNftStatus,
        second_nft_status: flag.secondNftStatus,
        is_pair_complete: flag.isPairComplete,
        created_at: flag.createdAt,
        interest_count: 0,
      };
    };

    res.json({
      id: auction.id,
      flag_id: auction.flagId,
      seller_id: auction.sellerId,
      starting_price: parseFloat(auction.startingPrice),
      min_price: parseFloat(auction.minPrice),
      buyout_price: parseFloat(auction.buyoutPrice),
      current_highest_bid: parseFloat(auction.buyoutPrice),
      highest_bidder_id: buyer.id,
      winner_category: auction.winnerCategory,
      status: 'closed',
      ends_at: auction.endsAt,
      created_at: auction.createdAt,
      flag: transformFlag(auction.flag),
      seller: transformUser(auction.seller),
      bid_count: auction.bids ? auction.bids.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close an auction (can be called by anyone after end time)
 * Winner determination:
 * 1. Highest bid amount
 * 2. If tie: Category (Premium > Plus > Standard)
 * 3. If still tie: Earliest timestamp
 */
const closeAuction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findByPk(id, {
      include: [
        { association: 'flag' },
        { association: 'seller' },
        {
          model: Bid,
          as: 'bids',
          include: [{ association: 'bidder' }],
        },
      ],
    });

    if (!auction) {
      throw new ApiError(404, `Auction with id ${id} not found`);
    }

    if (auction.status !== 'active') {
      throw new ApiError(400, 'Auction is not active');
    }

    // Check if auction time has ended
    if (new Date() < new Date(auction.endsAt)) {
      throw new ApiError(400, 'Auction has not ended yet');
    }

    // Determine winner using enhanced logic
    const winningBid = determineWinner(auction.bids);

    // Close the auction
    const updateData = { status: 'closed' };

    if (winningBid) {
      updateData.highestBidderId = winningBid.bidderId;
      updateData.currentHighestBid = winningBid.amount;
      updateData.winnerCategory = winningBid.bidderCategory;

      // Award reputation to winner (+15)
      const winner = await User.findByPk(winningBid.bidderId);
      if (winner) {
        await winner.update({
          reputationScore: winner.reputationScore + 15,
        });
      }
    }

    await auction.update(updateData);

    // Return full auction response
    const transformUser = (user) => {
      if (!user) return null;
      return {
        id: user.id,
        wallet_address: user.walletAddress,
        username: user.username,
        reputation_score: user.reputationScore,
        created_at: user.createdAt,
        flags_owned: 0,
        followers_count: 0,
        following_count: 0,
      };
    };

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
        token_id: flag.tokenId,
        price: flag.price,
        first_nft_status: flag.firstNftStatus,
        second_nft_status: flag.secondNftStatus,
        is_pair_complete: flag.isPairComplete,
        created_at: flag.createdAt,
        interest_count: 0,
      };
    };

    res.json({
      id: auction.id,
      flag_id: auction.flagId,
      seller_id: auction.sellerId,
      starting_price: parseFloat(auction.startingPrice),
      min_price: parseFloat(auction.minPrice),
      buyout_price: auction.buyoutPrice ? parseFloat(auction.buyoutPrice) : null,
      current_highest_bid: auction.currentHighestBid ? parseFloat(auction.currentHighestBid) : null,
      highest_bidder_id: auction.highestBidderId,
      winner_category: auction.winnerCategory,
      status: auction.status,
      ends_at: auction.endsAt,
      created_at: auction.createdAt,
      flag: transformFlag(auction.flag),
      seller: transformUser(auction.seller),
      bid_count: auction.bids ? auction.bids.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an auction
 */
const cancelAuction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address } = req.body;

    const auction = await Auction.findByPk(id, {
      include: [{ association: 'seller' }],
    });

    if (!auction) {
      throw new ApiError(404, `Auction with id ${id} not found`);
    }

    if (auction.status !== 'active') {
      throw new ApiError(400, 'Can only cancel active auctions');
    }

    // Verify seller
    const wallet = wallet_address.toLowerCase();
    if (auction.seller.walletAddress !== wallet) {
      throw new ApiError(403, 'Only the seller can cancel this auction');
    }

    // Cannot cancel if there are bids
    const bidCount = await Bid.count({ where: { auctionId: auction.id } });
    if (bidCount > 0) {
      throw new ApiError(400, 'Cannot cancel auction with existing bids');
    }

    await auction.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Auction cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuctions,
  getAuction,
  createAuction,
  placeBid,
  buyoutAuction,
  closeAuction,
  cancelAuction,
};
