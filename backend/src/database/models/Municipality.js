/**
 * Municipality Model - Third level of geographic hierarchy
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Municipality = sequelize.define('Municipality', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    regionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'region_id',
      references: {
        model: 'regions',
        key: 'id',
      },
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible',
    },
  }, {
    tableName: 'municipalities',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    getterMethods: {
      coordinates() {
        return `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`;
      },
    },
  });

  Municipality.associate = (models) => {
    Municipality.belongsTo(models.Region, {
      foreignKey: 'region_id',
      as: 'region',
    });
    Municipality.hasMany(models.Flag, {
      foreignKey: 'municipality_id',
      as: 'flags',
      onDelete: 'CASCADE',
    });
  };

  return Municipality;
};
