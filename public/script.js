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
var signoutButton = document.getElementById('signOut');
var GoogleAuthTkn;

var MSG_USER_SIGNOUT = "Usuário Saiu !";
var MSG_SHEET_UPDATED = "Relatórios Atualizados";
var MSG_SHEET_CREATED = "Relatório Criado";
var MSG_SHEET_DELETED = "Relatório Deletado";
var msgDict = {
  'spreadSheetDelete' : MSG_SHEET_DELETED,
  'spreadSheetCreate' : MSG_SHEET_CREATED,
  'spreadSheetSync'   : MSG_SHEET_UPDATED
};

// var orgUrl = "https://dev-525342.oktapreview.com";
// var redirectUrl = 'https://ordersplat.herokuapp.com/orders';
// var oktaSignIn = new OktaSignIn({baseUrl: orgUrl});
// var oktaSigninEl = "#okta-login-container";

// $(oktaSigninEl).ready(function() {
//   oktaSignIn.renderEl(
//     { el: oktaSigninEl },
//     function (res) {
//       if (res.status === 'SUCCESS') { 
//        console.log("Success");
//        res.session.setCookieAndRedirect(redirectUrl); 
//      }
//    }
//    );
// });

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
  
  signoutButton.style.visibility = 'visible';
}


function signOut() {

 // console.log(MSG_USER_SIGNOUT);
 // signoutButton.style.visibility = 'hidden';
 // $( profileDiv ).load(window.location.href + " " + profileDiv );

}
// Sending User Session to the server
$(function() {
  $('.user-session').click(function() {
    console.log("user-session !!!");
    var url = $(this).attr('href');
    var relatedElem = $(this).attr('rel');
    var method = 'POST';
    if ($(this).closest('a'))
      makeRequest('POST', url, function(err, spreadsheet) {
        if (err) return showError(err);
        window.location.reload();
        if(!msgDict[relatedElem]){showMessage(msgDict[relatedElem]);}
      });
  });
});

function makeRequest(method, url, callback) {
  // var auth = gapi.auth2.getAuthInstance();
  // if (!auth.isSignedIn.get()) {
  //   return callback(new Error('Signin required.'));
  // }
  // var accessToken = auth.currentUser.get().getAuthResponse().access_token;
  setSpinnerActive(true);
  $.ajax(url, {
    method: method,
    headers: 
    {
      // 'Authorization': 'Bearer ' + accessToken
    }
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

//
