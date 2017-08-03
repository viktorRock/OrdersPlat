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

//signOut
// var signoutButton = document.getElementById('signout-button');
// signoutButton.onclick = handleSignoutClick;
/**
 *  Sign out the user upon button click.
 */
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

  signoutButton = document.getElementById('signOut');
  signoutButton.style.visibility = 'visible';
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

