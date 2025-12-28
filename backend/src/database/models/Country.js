/**
 * Country Model - Top level of geographic hierarchy
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Country = sequelize.define('Country', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 3],
      },
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible',
    },
  }, {
    tableName: 'countries',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Country.associate = (models) => {
    Country.hasMany(models.Region, {
      foreignKey: 'country_id',
      as: 'regions',
      onDelete: 'CASCADE',
    });
  };

  return Country;
};
