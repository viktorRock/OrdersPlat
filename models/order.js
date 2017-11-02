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
      afterUpsert : (Order) =>{
        console.log('afterUpsert ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      } 
      ,afterValidate : (Order) =>{
        console.log('afterValidate ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        Order.customerName = "Paulinho";
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      }
      ,afterUpdate : (Order) =>{
        console.log('afterUpdate ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      }
      ,afterCreate : (Order) =>{
        console.log('afterCreate ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        let order = Order.dataValues;
        updatePagSegURL(order);
        console.log(order);
      }

    }
  });
  Order.afterCreate ((order) => {
    console.log('Instance hooks afterUpdate  ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    // let orderAux = order.dataValues;
    console.log(order);
    updatePagSegURL(order);
  });
  Order.afterUpdate((order) => {
    console.log('Instance hooks afterUpdate  ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    // let orderAux = order.dataValues;
    console.log(order);
    updatePagSegURL(order);
  });
  // Method 2 via the .hook() method (or its alias .addHook() method)
  Order.hook('afterCreate', (order) => {
    console.log('Declaring Hooks afterCreate  ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(order);
    updatePagSegURL(order);
  });
   // Method 2 via the .hook() method (or its alias .addHook() method)
   Order.hook('afterUpdate', (order) => {
    console.log('Declaring Hooks afterUpdate  ##### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(order);
    updatePagSegURL(order);
  });
   return Order;

 };


 function updatePagSegURL(order){
  // Inserir Promises Aqui
  console.log("updatePagSegURL START %%%%%%%%%%% ");
  var paymDetails = pagSeguro.pay(orderTopagSeg(order));
  console.log("updatePagSegURL UPDATE %%%%%%%%%%% ");
  order.paymURL = paymDetails.checkout.code;
  order.paymURLDate = paymDetails.checkout.date;
  console.log("updatePagSegURL END %%%%%%%%%%% ");
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