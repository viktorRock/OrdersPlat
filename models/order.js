"use strict";
var pagSeguro = require('../lib/pagSeg');

module.exports = function(sequelize, DataTypes) {
  const Order = sequelize.define('Order', {
    customerName: {type: DataTypes.STRING, allowNull: false},
    productCode: {type: DataTypes.STRING, allowNull: false},
    unitsOrdered: {type: DataTypes.INTEGER, allowNull: false},
    unitPrice: {type: DataTypes.FLOAT, allowNull: false},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDENTE'},
    ip: {type: DataTypes.STRING, allowNull: false, defaultValue: '127.0.0.1'},
    paymURL: {type: DataTypes.STRING, allowNull: true, },
    paymURLDate: {type: DataTypes.STRING, allowNull: false, defaultValue: new Date().toLocaleDateString()}
  }, {
    hooks : {
      afterUpsert : (Order, options) =>{
        console.log('afterUpsert ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      } 
      ,afterValidate : (Order, options) =>{
        console.log('afterValidate ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      }
      ,afterUpdate : (Order, options) =>{
        console.log('afterUpdate ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      }
     
    }
  });
  Order.afterCreate ((order,option) => {
    console.log('Instance hooks afterUpdate  ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    // let orderAux = order.dataValues;
    console.log(order);
    updatePagSegURL(order);
  });
  // Method 2 via the .hook() method (or its alias .addHook() method)
  Order.hook('afterUpsert', (order, options) => {
    console.log('Declaring Hooks afterUpsert  ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(order);
    updatePagSegURL(order);
  });
  return Order;
  
};


function updatePagSegURL(order){
  var pagSegJSON = orderTopagSeg(order);
  pagSeguro.pay(pagSegJSON,  function (output){
    order.paymURL = output.checkout.code;
    order.paymURLDate = output.checkout.date;
  });
}

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