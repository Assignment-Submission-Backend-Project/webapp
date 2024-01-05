'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Assignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Assignment.init({
    name: DataTypes.STRING,
    points: DataTypes.INTEGER,
    num_of_attemps: DataTypes.INTEGER,
    deadline: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'assignment',
  });
  return Assignment;
};