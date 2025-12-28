/**
 * FlagInterest Model - Tracks user interest in a flag (for first NFT claim)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FlagInterest = sequelize.define('FlagInterest', {
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
  }, {
    tableName: 'flag_interests',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'flag_id'],
        name: 'unique_user_flag_interest',
      },
    ],
  });

  FlagInterest.associate = (models) => {
    FlagInterest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    FlagInterest.belongsTo(models.Flag, {
      foreignKey: 'flag_id',
      as: 'flag',
    });
  };

  return FlagInterest;
};
