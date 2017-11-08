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
  snackbar.get(0).MaterialSnackbar.showSnackbar("WebError : " + error);
}

function showMessage(message) {
  var snackbar = $('#snackbar');
  snackbar.removeClass('error');
  snackbar.get(0).MaterialSnackbar.showSnackbar({
    message: "WebMsg : " + message
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
      if(!msgDict[relatedElem]){
        showMessage(msgDict[relatedElem]);
        console.log(msgDict[relatedElem]);
      }
    });
  });

  $('a.mdl-button').click(function() {
    setSpinnerActive(true);
  });
});

function makeRequest(method, url, callback) {
  setSpinnerActive(true);
  $.ajax(url, {
    method: method, 
    headers: {},
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


function pagSeguroLightBox(paymentCode){

  var isOpenLightbox = PagSeguroLightbox({
    code: paymentCode
  }, {
    success : function(transactionCode) {
      alert("success - " + transactionCode);
    },
    abort : function() {
      alert("abort");
    }
  });

  // Redirecionando o cliente caso o navegador não tenha suporte ao Lightbox
  if (!isOpenLightbox){
    location.href="https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code="+code;
  }

}