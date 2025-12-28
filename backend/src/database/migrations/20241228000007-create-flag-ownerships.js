'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flag_ownerships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      ownership_type: {
        type: Sequelize.ENUM('first', 'second'),
        allowNull: false,
      },
      transaction_hash: {
        type: Sequelize.STRING(66),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('flag_ownerships', ['user_id']);
    await queryInterface.addIndex('flag_ownerships', ['flag_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('flag_ownerships');
  },
};
