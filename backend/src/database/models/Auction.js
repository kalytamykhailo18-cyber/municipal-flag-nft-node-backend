/**
 * Auction Model - Off-chain auction for flags
 *
 * ENHANCED AUCTION FEATURES:
 * - minPrice: Minimum bid price (floor)
 * - buyoutPrice: Instant purchase price (optional)
 * - winnerCategory: Category of winning bidder for tie-breaking
 */
const { DataTypes } = require('sequelize');

// Enum for auction status
const AuctionStatus = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

module.exports = (sequelize) => {
  const Auction = sequelize.define('Auction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    flagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'flag_id',
      references: {
        model: 'flags',
        key: 'id',
      },
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startingPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      field: 'starting_price',
    },
    minPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'min_price',
    },
    buyoutPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true,
      field: 'buyout_price',
    },
    currentHighestBid: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true,
      field: 'current_highest_bid',
    },
    highestBidderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'highest_bidder_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    winnerCategory: {
      type: DataTypes.ENUM('standard', 'plus', 'premium'),
      allowNull: true,
      field: 'winner_category',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AuctionStatus)),
      defaultValue: AuctionStatus.ACTIVE,
    },
    endsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'ends_at',
    },
  }, {
    tableName: 'auctions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Auction.associate = (models) => {
    Auction.belongsTo(models.Flag, {
      foreignKey: 'flag_id',
      as: 'flag',
    });
    Auction.belongsTo(models.User, {
      foreignKey: 'seller_id',
      as: 'seller',
    });
    Auction.belongsTo(models.User, {
      foreignKey: 'highest_bidder_id',
      as: 'highestBidder',
    });
    Auction.hasMany(models.Bid, {
      foreignKey: 'auction_id',
      as: 'bids',
      onDelete: 'CASCADE',
    });
  };

  // Export enum for use elsewhere
  Auction.AuctionStatus = AuctionStatus;

  return Auction;
};
