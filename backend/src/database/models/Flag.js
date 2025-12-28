/**
 * Flag Model - NFT flag with pair logic
 *
 * MULTI-NFT FEATURE:
 * Some flags require multiple NFTs to obtain (grouped NFTs).
 * - nftsRequired=1: Standard single NFT flag
 * - nftsRequired=3: Requires 3 NFTs to obtain the flag (grouped)
 */
const { DataTypes } = require('sequelize');

// Enums
const FlagCategory = {
  STANDARD: 'standard',
  PLUS: 'plus',
  PREMIUM: 'premium',
};

const NFTStatus = {
  AVAILABLE: 'available',
  CLAIMED: 'claimed',
  PURCHASED: 'purchased',
};

module.exports = (sequelize) => {
  const Flag = sequelize.define('Flag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    municipalityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'municipality_id',
      references: {
        model: 'municipalities',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    locationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'location_type',
    },
    category: {
      type: DataTypes.ENUM(...Object.values(FlagCategory)),
      defaultValue: FlagCategory.STANDARD,
    },
    nftsRequired: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      field: 'nfts_required',
      validate: {
        min: 1,
        max: 10,
      },
    },
    imageIpfsHash: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'image_ipfs_hash',
    },
    metadataIpfsHash: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'metadata_ipfs_hash',
    },
    metadataHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'metadata_hash',
    },
    tokenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'token_id',
    },
    price: {
      type: DataTypes.DECIMAL(18, 8),
      defaultValue: 0.01,
    },
    firstNftStatus: {
      type: DataTypes.ENUM(...Object.values(NFTStatus)),
      defaultValue: NFTStatus.AVAILABLE,
      field: 'first_nft_status',
    },
    secondNftStatus: {
      type: DataTypes.ENUM(...Object.values(NFTStatus)),
      defaultValue: NFTStatus.AVAILABLE,
      field: 'second_nft_status',
    },
    isPairComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pair_complete',
    },
  }, {
    tableName: 'flags',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Flag.associate = (models) => {
    Flag.belongsTo(models.Municipality, {
      foreignKey: 'municipality_id',
      as: 'municipality',
    });
    Flag.hasMany(models.FlagInterest, {
      foreignKey: 'flag_id',
      as: 'interests',
      onDelete: 'CASCADE',
    });
    Flag.hasMany(models.FlagOwnership, {
      foreignKey: 'flag_id',
      as: 'ownerships',
      onDelete: 'CASCADE',
    });
    Flag.hasMany(models.Auction, {
      foreignKey: 'flag_id',
      as: 'auctions',
      onDelete: 'CASCADE',
    });
  };

  // Export enums for use elsewhere
  Flag.FlagCategory = FlagCategory;
  Flag.NFTStatus = NFTStatus;

  return Flag;
};
