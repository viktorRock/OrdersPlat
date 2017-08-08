'use strict';

var express = require('express');
var router = express.Router();
var models = require('./models');
var Sequelize = require('sequelize');


var sortCriteriaList = ['createdAt', 'DESC'];
var reportNamePreffix = "Relatorio_";
var OAUTH_GRANT_TYPE = "refresh_token";

var STATUS_VALUE_DONE = "ENTREGUE";
var MSG_ORDER_NOT_FOUND = "Pedido não encontrado: ";
var MSG_AUTH_NEEEDED = "É necessário estar logado.";
var MSG_FILE_NOT_FOUND = "Arquivo não encontrado: ";

// var signIn = new OktaSignIn({baseUrl: 'https://ordersplat.herokuapp.com/'});

// TODO: Show spreadsheets on the main page.
router.get('/', function(req, res, next) {
  // res.redirect('/login');
  res.redirect('https://dev-525342.oktapreview.com/home/oidc_client/0oabi7ct5jlaJ0hoF0h7/aln5z7uhkbM6y7bMy0g7');
  
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/orders', function(req, res, next) {
  var options = {
    order: [sortCriteriaList]
  };
  Sequelize.Promise.all([
    models.Order.findAll(options),
    models.Spreadsheet.findAll(options)
    ]).then(function(results) {
      res.render('orders', {
        orders: results[0],
        spreadsheets: results[1]
      });
    });
  });


router.get('/orders/create', function(req, res, next) {
  res.render('orders_upsert');
});

router.get('/orders/edit/:id', function(req, res, next) {
  models.Order.findById(req.params.id).then(function(order) {
    if (order) {
      res.render('orders_upsert', {
        order: order
      });
    } else {
      next(new Error(MSG_ORDER_NOT_FOUND + req.params.id));
    }
  });
});

router.get('/orders/delete/:id', function(req, res, next) {
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

router.get('/orders/close/:id', function(req, res, next) {
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

router.post('/orders/upsert', function(req, res, next) {
  models.Order.upsert(req.body).then(function() {
    // updateAllSpreadsheets(req,next);
    res.redirect('/orders');
  }, function(err) {
    next(err);
  });
});

var SheetsHelper = require('./sheets');

router.post('/spreadsheets', function(req, res, next) {
  var helper = getSheetsHelper(req,next);
  var title = reportNamePreffix + new Date().toLocaleTimeString();
  helper.createSpreadsheet(title, function(err, spreadsheet) {
    if (err) {
      return next(err);
    }
    var model = {
      id: spreadsheet.spreadsheetId,
      sheetId: spreadsheet.sheets[0].properties.sheetId,
      name: spreadsheet.properties.title
    };
    models.Spreadsheet.create(model).then(function() {
     updateSpreadsheet(model,helper);
     return res.json(model);
   });

  });
});

function getSheetsHelper(request,next){
  var accessToken = getATolkien(request,next);
  return new SheetsHelper(accessToken);
}

function getATolkien(request, next){
  var auth = request.get('Authorization');
  if (!auth) {
    return next(Error(MSG_AUTH_NEEEDED));
  }
  return auth.split(' ')[1];
}

function updateAllSpreadsheets(request,next){
  var sheetsHelper  = getSheetsHelper(request,next);
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
        console.log("err = " + err);
        return (err);
      }
      return orders.lenght;
    });
  });
}

router.post('/spreadsheets/:id/delete', function(req, res, next) {
  models.Spreadsheet.findById(req.params.id)
  .then(function(result) {
    if (!result) {
      throw new Error(MSG_FILE_NOT_FOUND + req.params.id);
    }
    return result.destroy();
  })
  .then(function() {
    res.redirect('/');
  }, function(err) {
    next(err);
  });
});

module.exports = router;