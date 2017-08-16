/*
  Copyright 2016 Google, Inc.

  Licensed to the Apache Software Foundation (ASF) under one or more contributor
  license agreements. See the NOTICE file distributed with this work for
  additional information regarding copyright ownership. The ASF licenses this
  file to you under the Apache License, Version 2.0 (the "License"); you may not
  use this file except in compliance with the License. You may obtain a copy of
  the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
  License for the specific language governing permissions and limitations under
  the License.
  */

// Bind handlers when the page loads.
var profileDiv = "#profile"
var MSG_USER_SIGNOUT = "Usuário Saiu !";
var MSG_SHEET_UPDATED = "Relatórios Atualizados";
var MSG_SHEET_CREATED = "Relatório Criado";
var MSG_SHEET_DELETED = "Relatório Deletado";
var msgDict = {
  'spreadSheetDelete' : MSG_SHEET_DELETED,
  'spreadSheetCreate' : MSG_SHEET_CREATED,
  'spreadSheetSync'   : MSG_SHEET_UPDATED
};

function setSpinnerActive(isActive) {
  if (isActive) {
    $('#spinner').addClass('is-active');
  } else {
    $('#spinner').removeClass('is-active');
  }
}

function showError(error) {
  console.log(error);
  var snackbar = $('#snackbar');
  snackbar.addClass('error');
  snackbar.get(0).MaterialSnackbar.showSnackbar(error);
}

function showMessage(message) {
  var snackbar = $('#snackbar');
  snackbar.removeClass('error');
  snackbar.get(0).MaterialSnackbar.showSnackbar({
    message: message
  });
}

// Sending User Session to the server
$(function() {
  $('button[rel="spreadSheet"]').click(function() {
    var url = $(this).attr('href');
    var relatedElem = $(this).attr('rel');
    var method = 'POST';

    makeRequest(method, url, function(err, spreadsheet) {
      if (err) return showError(err);
      window.location.reload();
      if(!msgDict[relatedElem]){showMessage(msgDict[relatedElem]);}
    });
  });

  $('a.mdl-button').click(function() {
    setSpinnerActive(true);
  });
});

function makeRequest(method, url, callback) {
  setSpinnerActive(true);
  $.ajax(url, {
    method: method, headers: {}
    ,success: function(response) {
      setSpinnerActive(false);
      return callback(null, response);
    }
    ,error: function(response) {
      setSpinnerActive(false);
      return callback(new Error(response.responseJSON.message));
    }
  });
}

var uolRequestURL = "https://ws.pagseguro.uol.com.br/v2/pre-approvals/request?";

function uolPayment(paymentCode){

  PagSeguroLightbox({
    code: paymentCode
    }, {
    success : function(transactionCode) {
        alert("success - " + transactionCode);
    },
    abort : function() {
        alert("abort");
    }
});
}