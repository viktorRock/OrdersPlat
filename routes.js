
'use strict';

var express = require('express');
var router = express.Router();
var models = require('./models');
var Sequelize = require('sequelize');

// TODO: Show spreadsheets on the main page.
router.get('/', function(req, res, next) {
  var options = {
    order: [['createdAt', 'DESC']]
  };
  Sequelize.Promise.all([
    models.Order.findAll(options),
    models.Spreadsheet.findAll(options)
    ]).then(function(results) {
      res.render('index', {
        orders: results[0],
        spreadsheets: results[1]
      });
    });
  });

router.get('/create', function(req, res, next) {
  res.render('upsert');
});

router.get('/edit/:id', function(req, res, next) {
  models.Order.findById(req.params.id).then(function(order) {
    if (order) {
      res.render('upsert', {
        order: order
      });
    } else {
      next(new Error('Pedido não encontrado: ' + req.params.id));
    }
  });
});

router.get('/delete/:id', function(req, res, next) {
  models.Order.findById(req.params.id)
  .then(function(order) {
    if (!order) {
      throw new Error('Pedido não encontrado: ' + req.params.id);
    }
    return order.destroy();
  })
  .then(function() {
    res.redirect('/');
  }, function(err) {
    next(err);
  });
});

router.get('/close/:id', function(req, res, next) {
  models.Order.findById(req.params.id)
  .then(function(order) {
    if (!order) {
      throw new Error('Pedido não encontrado: ' + req.params.id);
    }
    order.status="ENTREGUE";
    return order.save().then(() => {});
  })
  .then(function() {
    res.redirect('/');
  }, function(err) {
    next(err);
  });
});

router.post('/upsert', function(req, res, next) {
  models.Order.upsert(req.body).then(function() {
    // updateAllSpreadsheets(req,next);
    res.redirect('/');
  }, function(err) {
    next(err);
  });
});

var SheetsHelper = require('./sheets');

router.post('/spreadsheets', function(req, res, next) {
  var helper = getSheetsHelper(req,next);
  var title = 'Relatorio_' + new Date().toLocaleTimeString();
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
    return next(Error('É necessário estar logado.'));
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
      throw new Error('Arquivo não encontrado: ' + req.params.id);
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
