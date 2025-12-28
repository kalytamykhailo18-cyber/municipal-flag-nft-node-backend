/**
 * Bid Model - Bid in an auction
 *
 * ENHANCED BID FEATURES:
 * - bidderCategory: Category of the bidder for tie-breaking
 *   (Premium > Plus > Standard when bid amounts are equal)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bid = sequelize.define('Bid', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    auctionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'auction_id',
      references: {
        model: 'auctions',
        key: 'id',
      },
    },
    bidderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'bidder_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    bidderCategory: {
      type: DataTypes.ENUM('standard', 'plus', 'premium'),
      defaultValue: 'standard',
      allowNull: false,
      field: 'bidder_category',
    },
  }, {
    tableName: 'bids',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  Bid.associate = (models) => {
    Bid.belongsTo(models.Auction, {
      foreignKey: 'auction_id',
      as: 'auction',
    });
    Bid.belongsTo(models.User, {
      foreignKey: 'bidder_id',
      as: 'bidder',
    });
  };

  return Bid;
};
