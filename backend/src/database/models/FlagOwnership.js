/**
 * FlagOwnership Model - Tracks NFT ownership
 */
const { DataTypes } = require('sequelize');

// Enum for ownership type
const OwnershipType = {
  FIRST: 'first',
  SECOND: 'second',
};

module.exports = (sequelize) => {
  const FlagOwnership = sequelize.define('FlagOwnership', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
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
    ownershipType: {
      type: DataTypes.ENUM(...Object.values(OwnershipType)),
      allowNull: false,
      field: 'ownership_type',
    },
    transactionHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: 'transaction_hash',
    },
  }, {
    tableName: 'flag_ownerships',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  FlagOwnership.associate = (models) => {
    FlagOwnership.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    FlagOwnership.belongsTo(models.Flag, {
      foreignKey: 'flag_id',
      as: 'flag',
    });
  };

  // Export enum for use elsewhere
  FlagOwnership.OwnershipType = OwnershipType;

  return FlagOwnership;
};
