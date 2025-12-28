'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      municipality_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'municipalities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      location_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('standard', 'plus', 'premium'),
        defaultValue: 'standard',
      },
      nfts_required: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      image_ipfs_hash: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      metadata_ipfs_hash: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      metadata_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      token_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(18, 8),
        defaultValue: 0.01,
      },
      first_nft_status: {
        type: Sequelize.ENUM('available', 'claimed', 'purchased'),
        defaultValue: 'available',
      },
      second_nft_status: {
        type: Sequelize.ENUM('available', 'claimed', 'purchased'),
        defaultValue: 'available',
      },
      is_pair_complete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('flags', ['municipality_id']);
    await queryInterface.addIndex('flags', ['category']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('flags');
  },
};
