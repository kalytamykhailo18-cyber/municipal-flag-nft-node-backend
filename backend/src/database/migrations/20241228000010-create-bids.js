'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bids', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      auction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auctions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bidder_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: false,
      },
      bidder_category: {
        type: Sequelize.ENUM('standard', 'plus', 'premium'),
        defaultValue: 'standard',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('bids', ['auction_id']);
    await queryInterface.addIndex('bids', ['bidder_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bids');
  },
};
