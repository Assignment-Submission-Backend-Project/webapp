'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acc_assignment', {
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('acc_assignment');
  }
};
