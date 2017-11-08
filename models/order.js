"use strict";
var pagSeguro = require('../lib/pagSeg');

module.exports = function(sequelize, DataTypes) {
  const Order = sequelize.define('Order', {
    customerId: {type: DataTypes.STRING, allowNull: false},
    customerName: {type: DataTypes.STRING, allowNull: false},
    customerEmail: {type: DataTypes.STRING, allowNull: false},
    productCode: {type: DataTypes.STRING, allowNull: false},
    unitsOrdered: {type: DataTypes.INTEGER, allowNull: false},
    unitPrice: {type: DataTypes.FLOAT, allowNull: false},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDENTE'},
    ip: {type: DataTypes.STRING, allowNull: false, defaultValue: '127.0.0.1'},
    paymURL: {type: DataTypes.STRING, allowNull: true, },
    paymURLDate: {type: DataTypes.STRING, allowNull: false, defaultValue: new Date().toLocaleDateString()}
  }, {
    hooks : {
      beforeValidate : (Order) =>{
        return pagSeguro.getPagSeg(orderTopagSeg(Order.dataValues)).then((pagSeg) => {
          Order.paymURL = pagSeg.checkout.code;
          Order.paymURLDate = pagSeg.checkout.date;
        });
      }
    }
  });
  return Order;
};

function orderTopagSeg(order){
  var output = {
    "checkout": {
      // "sender" : { "name": order.customerName,"ip" : order.ip },
      "currency": "BRL",
      "items": {
        "item": {
          "id": order.id || "01",
          "description": order.productCode,
          "amount": parseFloat(order.unitPrice).toFixed(2),
          "quantity": order.unitsOrdered
        }
      }
    }
  }
  return output;
}