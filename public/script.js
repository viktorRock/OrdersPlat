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
var signoutButton;
var GoogleAuthTkn;

// var config = {
//   "oidc": {
//     "oktaUrl": "https://dev-525342.oktapreview.com",
//     "clientId": "0oabi7ct5jlaJ0hoF0h7",
//     "clientSecret": "gG_H59WfxOnBfOQpMhTWpDSOFarkGkvBTYy8EXFm",
//     "redirectUri": "http://localhost:3000/authorization-code/callback"
//   }
// }
// var test = new LoginCustomController(config);


// var orgUrl = 'https://dev-525342.oktapreview.com/oauth2/ausbjcmbafTS5Tcb80h7';
// var orgUrl = 'https://dev-525342-admin.oktapreview.com/admin/app/oidc_client/instance/0oabi7ct5jlaJ0hoF0h7';
var orgUrl = "https://dev-525342.oktapreview.com";
// var orgUrl = "https://ordersplat.herokuapp.com";

var redirectUrl = 'https://ordersplat.herokuapp.com/orders';
var oktaSignIn = new OktaSignIn({baseUrl: orgUrl});
var oktaSigninEl = "#okta-login-container";

$(oktaSigninEl).ready(function() {
  oktaSignIn.renderEl(
    { el: oktaSigninEl },
    function (res) {
      if (res.status === 'SUCCESS') { 
       console.log("Success");
       res.session.setCookieAndRedirect(redirectUrl); 
     }else{

      console.log("ELSE");
    }
  }
  );
});



function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

$(  function() {
  $('a.mdl-button').click(function() {
    setSpinnerActive(true);
  });
}

);

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

function onSignIn(user) {
  var profile = user.getBasicProfile();
  $(profileDiv + ' .name').text(profile.getName());
  $(profileDiv + ' .email').text(profile.getEmail());
  // The ID token you need to pass to your backend:
  GoogleAuthTkn = user.getAuthResponse().id_token;
  signoutButton = document.getElementById('signOut');
  signoutButton.style.visibility = 'visible';
  // user.grantOfflineAccess();
}


function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
   $( profileDiv ).load(window.location.href + " " + profileDiv );
   console.log('User signed out.');
   signoutButton.style.visibility = 'hidden';
 });
}
// Add spreadsheet control handlers.
$(function() {
  $('button[rel="create"]').click(function() {
    makeRequest('POST', '/spreadsheets/', function(err, spreadsheet) {
      if (err) return showError(err);
      window.location.reload();
      showMessage('Relatório Criado');
    });
  });
  $('button[rel="sync"]').click(function() {
    var spreadsheetId = $(this).data('spreadsheetid');
    var url = '/spreadsheets/' +  spreadsheetId + '/sync';
    makeRequest('POST', url, function(err) {
      if (err) return showError(err);
      showMessage('Relatório Atualizado');
    });
  });
  $('button[rel="delete"]').click(function() {
    var spreadsheetId = $(this).data('spreadsheetid');
    var url = '/spreadsheets/' +  spreadsheetId + '/delete';
    makeRequest('POST', url, function(err) {
      if (err) return showError(err);
      showMessage('Relatório Deletado');
      window.location.reload();
    });
  });
});

function makeRequest(method, url, callback) {
  var auth = gapi.auth2.getAuthInstance();
  if (!auth.isSignedIn.get()) {
    return callback(new Error('Signin required.'));
  }
  var accessToken = auth.currentUser.get().getAuthResponse().access_token;
  setSpinnerActive(true);
  $.ajax(url, {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    success: function(response) {
      setSpinnerActive(false);
      return callback(null, response);
    },
    error: function(response) {
      setSpinnerActive(false);
      return callback(new Error(response.responseJSON.message));
    }
  });
}

//
