/**
 * User Model - Identified by wallet address
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    walletAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      unique: true,
      field: 'wallet_address',
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/,
      },
      set(value) {
        // Always store lowercase
        this.setDataValue('walletAddress', value.toLowerCase());
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    reputationScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'reputation_score',
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  User.associate = (models) => {
    User.hasMany(models.FlagInterest, {
      foreignKey: 'user_id',
      as: 'interests',
      onDelete: 'CASCADE',
    });
    User.hasMany(models.FlagOwnership, {
      foreignKey: 'user_id',
      as: 'ownerships',
      onDelete: 'CASCADE',
    });
    // Social connections - followers (users who follow this user)
    User.hasMany(models.UserConnection, {
      foreignKey: 'following_id',
      as: 'followers',
      onDelete: 'CASCADE',
    });
    // Social connections - following (users this user follows)
    User.hasMany(models.UserConnection, {
      foreignKey: 'follower_id',
      as: 'following',
      onDelete: 'CASCADE',
    });
    // Auctions created by this user
    User.hasMany(models.Auction, {
      foreignKey: 'seller_id',
      as: 'auctionsCreated',
    });
    // Bids placed by this user
    User.hasMany(models.Bid, {
      foreignKey: 'bidder_id',
      as: 'bids',
      onDelete: 'CASCADE',
    });
  };

  return User;
};
