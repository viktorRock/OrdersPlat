'use strict';

const express = require('express');
const router = express.Router();
const models = require('./models');
const Sequelize = require('sequelize');
const SheetsHelper = require('./sheets');

const sortCriteriaList = ['createdAt', 'DESC'];
const reportNamePreffix = "Relatorio_";
const OAUTH_GRANT_TYPE = "refresh_token";

const STATUS_VALUE_DONE = "ENTREGUE";
const MSG_ORDER_NOT_FOUND = "Pedido não encontrado: ";
const MSG_AUTH_NEEEDED = "É necessário estar logado.";
const MSG_FILE_NOT_FOUND = "Arquivo não encontrado: ";

const oauth2 = require('./lib/oauth2');
// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
router.use(oauth2.template);

// var signIn = new OktaSignIn({baseUrl: 'https://ordersplat.herokuapp.com/'});

// TODO: Show spreadsheets on the main page.
router.get('/', function(req, res, next) {
  console.log("##### 1 - router.get('/',");
  console.log(res.locals);

  console.log("##### 2 - router.get('/',");
  console.log(req.session);

  console.log("##### 3 - router.get('/',");
  console.log(res.authInfo);

  console.log("##### 4 - router.get('/',");
  console.log(req.session);

  res.redirect('/orders');
});

router.get('/login', function(req, res, next) {
  res.render('login',{
   locals : res.locals
 });
  console.log("ordersLOGIN ####");
  console.log(res.locals);
});

router.get('/orders', function(req, res, next) {
  var options = {
    order: [sortCriteriaList]
  };
  
  console.log("LOCALS ####");
  console.log(req._passport.instance._strategies.google._oauth2);

  console.log("LOCALS 2 ####");
  console.log(res.locals);

  console.log("LOCALS 3 ####");
  console.log(req.session.passport);


  Sequelize.Promise.all([
    models.Order.findAll(options),
    models.Spreadsheet.findAll(options)
    ]).then(function(results) {
      res.render('orders', {
        orders: results[0],
        spreadsheets: results[1],
        locals : res.locals
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
    updateAllSpreadsheets(req,next);
    res.redirect('/orders');
  }, function(err) {
    next(err);
  });
});

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

function getATolkien(request, next){
  var auth = request.get('Authorization');
  if (!auth) {
    return next(Error(MSG_AUTH_NEEEDED));
  }
  return auth.split(' ')[1];
}

function getSheetsHelper(request,next){
  var accessToken = getATolkien(request,next);
  return new SheetsHelper(accessToken);
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
        console.log("UpdateSpreadErr = " + err);
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
    res.redirect('/orders');
  }, function(err) {
    next(err);
  });
});

module.exports = router;