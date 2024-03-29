'use strict';

const express = require('express');
const router = express.Router();
const models = require('./models');
const Sequelize = require('sequelize');
const SheetsHelper = require('./sheets');
const extend = require('util')._extend;
const config = require('./config');
const sortCriteriaList = ['createdAt', 'DESC'];
const reportNamePreffix = "Relatorio_";
const OAUTH_GRANT_TYPE = "refresh_token";

const STATUS_VALUE_DONE = "ENTREGUE";
const MSG_ORDER_NOT_FOUND = "Pedido não encontrado: ";
const MSG_AUTH_NEEEDED = "É necessário estar logado.";
const MSG_FILE_NOT_FOUND = "Arquivo não encontrado: ";
const oauth2 = require('./lib/oauth2');
var pagSeguro = require('./lib/pagSeg');

// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
router.use(oauth2.template);

// var signIn = new OktaSignIn({baseUrl: 'https://ordersplat.herokuapp.com/'});
router.get('/', function(req, res, next) {
  res.redirect('/index');
});

router.get('/index', function(req, res, next) {
  res.render('index',{
    locals : res.locals
  });
});

router.get('/reports', oauth2.required, function(req, res, next) {
  var options = {
    order: [sortCriteriaList]
  };
  Sequelize.Promise.all([
    models.Spreadsheet.findAll()
    ]).then(function(results) {
      res.render('reports', {
        spreadsheets: results[0],
        locals : res.locals
      });  
    }); 
  });

router.get('/policy', function(req, res, next) {
  res.render('policy',{
    locals : res.locals
  });
});

router.get('/orders', oauth2.required, function(req, res, next) {
  var options = {
    order: [sortCriteriaList]
  };

  Sequelize.Promise.all([
    models.Order.findAll(options)
    ]).then(function(results) {

      res.render('orders', {
        orders: results[0],
        locals : res.locals,
        paymJS : getPagSegJS()
      });  
    });
  });

router.get('/orders/create', oauth2.required, function(req, res, next) {
  res.render('orders_upsert', {
    locals : res.locals
  });
});

router.get('/orders/edit/:id', oauth2.required, function(req, res, next) {
  models.Order.findById(req.params.id).then(function(order) {
    if (order) {
      res.render('orders_upsert', {
        order: order,
        locals : res.locals
      });
    } else {
      next(new Error(MSG_ORDER_NOT_FOUND + req.params.id));
    }
  });
});

router.get('/orders/delete/:id', oauth2.required, function(req, res, next) {
  models.Order.findById(req.params.id)
  .then(function(order) {
    if (!order) {
      throw new Error(MSG_ORDER_NOT_FOUND + req.params.id);
    }
    return order.destroy();
  })
  .then(function() {
    res.redirect('/orders');
  }, function(err) {
    next(err);
  });
});

router.get('/orders/close/:id', oauth2.required, function(req, res, next) {
  models.Order.findById(req.params.id)
  .then(function(order) {
    if (!order) {
      throw new Error(MSG_ORDER_NOT_FOUND + req.params.id);
    }
    order.status= STATUS_VALUE_DONE;
    return order.save().then(() => {});
  })
  .then(function() {
    res.redirect('/orders');
  }, function(err) {
    next(err);
  });
});

router.post('/orders/upsert', oauth2.required, function(req, res, next) {
  req.body.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.body.customerId=res.locals.profile.id;
  req.body.customerEmail=res.locals.profile.email;
  var options = {
    hooks: true
  };
  models.Order.upsert(req.body, options).then(function() {
    updateAllSpreadsheets(req,res, next);
    res.redirect('/orders');
  }, function(err) {
    next(err);
  });
});

function updatePagSegURL(order){
  var pagSegJSON = orderTopagSeg(order);
  pagSeguro.pay(pagSegJSON,  function (output){
    order.paymURL = output.checkout.code;
    order.paymURLDate = output.checkout.date;
    order.save().then(() => {});
  });
}

function orderTopagSeg(order){
  var output = {
    "checkout": {
      // "sender" : { "name": order.customerName,"ip" : order.ip },
      "currency": "BRL",
      "items": {
        "item": {
          "id": order.id,
          "description": order.productCode,
          "amount": order.unitPrice.toFixed(2),
          "quantity": order.unitsOrdered
        }
      }
    }
  }
  return output;
}

router.post('/spreadsheets', oauth2.required, function(req, res, next) {
  var helper = getSheetsHelper(req,res,next);
  var title = reportNamePreffix + new Date().toLocaleTimeString();
  helper.createSpreadsheet(title, function(err, spreadsheet) {
    if (err) {
      return next(err);
    }
    var model = {
      id: spreadsheet.spreadsheetId,
      sheetId: spreadsheet.sheets[0].properties.sheetId,
      customerId : res.locals.profile.id,
      name: spreadsheet.properties.title
    };
    models.Spreadsheet.create(model).then(function() {
     updateSpreadsheet(model,helper);
     return res.json(model);
   });
  });
});

router.post('/spreadsheets/:id/delete', oauth2.required, function(req, res, next) {
  models.Spreadsheet.findById(req.params.id)
  .then(function(result) {
    if (!result) {
      throw new Error(MSG_FILE_NOT_FOUND + req.params.id);
    }
    return result.destroy();
  })
  .then(function() {
    res.redirect('/reports');
  }, function(err) {
    next(err);
  });
});

function getATolkien(req, res, next){
  var auth;
  if(res.locals.profile){
    auth = 'Bearer ' + res.locals.profile.tolkien;
  }else{
    return next(Error(MSG_AUTH_NEEEDED));
  }
  return auth.split(' ')[1];
}

function getSheetsHelper(req, res, next){
  var accessToken = getATolkien(req, res, next);
  return new SheetsHelper(accessToken);
}

function updateAllSpreadsheets(req, res, next){
  var sheetsHelper  = getSheetsHelper(req, res, next);
  Sequelize.Promise.all([models.Spreadsheet.findAll(), models.Order.findAll()]).then(function(results) {
    var spreadSheetsList = results[0];
    var orders = results[1];
    spreadSheetsList.forEach(function (spreadSheet) {
      updateSpreadsheet(spreadSheet,sheetsHelper);
    });

  });
}

function updateSpreadsheet(spreadSheet, sheetsHelper) {
  Sequelize.Promise.all([models.Order.findAll()]).then(function(results) {
    var orders = results[0];
    sheetsHelper.sync(spreadSheet.id, spreadSheet.sheetId, orders, function(err) {
      if (err) {
        console.log("UpdateSpreadErr = " + err);
        return (err);
      }
      return orders.lenght;
    });
  });
}

function getPagSegJS(){
  return config.get('PAGSEG_JS');
}

//before customerID logic, it was 
//Sequelize.Promise.all([models.Spreadsheet.findAll(), models.Order.findAll()])
//.then(function(results)
function getSheetsByCustId(custID){
  return models.Spreadsheet.findAll({
    where: {
      customerId: custID
    }
  });
}

function getOrdersByCustId(custID){
  return models.Order.findAll({
    where: {
      customerId: custID
    }
  });
}

module.exports = router;