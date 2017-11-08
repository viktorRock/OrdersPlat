"use strict";

module.exports = function(sequelize, DataTypes) {
  var Spreadsheet = sequelize.define('Spreadsheet', {
    id: {type: DataTypes.STRING, allowNull: false, primaryKey: true},
    sheetId: {type: DataTypes.INTEGER, allowNull: false},
    customerId: {type: DataTypes.STRING, allowNull: false, primaryKey: true},
    name: {type: DataTypes.STRING, allowNull: false}
  });

  return Spreadsheet;
};