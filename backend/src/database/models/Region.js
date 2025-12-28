/**
 * Region Model - Second level of geographic hierarchy
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Region = sequelize.define('Region', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    countryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'country_id',
      references: {
        model: 'countries',
        key: 'id',
      },
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible',
    },
  }, {
    tableName: 'regions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Region.associate = (models) => {
    Region.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
    });
    Region.hasMany(models.Municipality, {
      foreignKey: 'region_id',
      as: 'municipalities',
      onDelete: 'CASCADE',
    });
  };

  return Region;
};
