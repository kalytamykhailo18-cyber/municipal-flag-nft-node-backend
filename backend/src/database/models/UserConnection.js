/**
 * UserConnection Model - Social connection between users (follow relationship)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserConnection = sequelize.define('UserConnection', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'follower_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    followingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'following_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'user_connections',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['follower_id', 'following_id'],
        name: 'unique_follow',
      },
    ],
  });

  UserConnection.associate = (models) => {
    UserConnection.belongsTo(models.User, {
      foreignKey: 'follower_id',
      as: 'follower',
    });
    UserConnection.belongsTo(models.User, {
      foreignKey: 'following_id',
      as: 'followingUser',
    });
  };

  return UserConnection;
};
