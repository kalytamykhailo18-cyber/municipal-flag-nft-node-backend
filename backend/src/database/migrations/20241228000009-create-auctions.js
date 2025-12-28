'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auctions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      flag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'flags',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      starting_price: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: false,
      },
      min_price: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
      },
      buyout_price: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: true,
      },
      current_highest_bid: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: true,
      },
      highest_bidder_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      winner_category: {
        type: Sequelize.ENUM('standard', 'plus', 'premium'),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'cancelled'),
        defaultValue: 'active',
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('auctions', ['flag_id']);
    await queryInterface.addIndex('auctions', ['seller_id']);
    await queryInterface.addIndex('auctions', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auctions');
  },
};
