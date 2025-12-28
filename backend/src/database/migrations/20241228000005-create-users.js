'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      wallet_address: {
        type: Sequelize.STRING(42),
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reputation_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex('users', ['wallet_address'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
