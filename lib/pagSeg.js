var request = require('request');
const jxon = require('jxon');
const config = require('../config');
var pagSeguroCheckout = config.get('PAGSEG_URL');;
var token = config.get('PAGSEG_CLIENT_TOKEN');
var email = config.get('PAGSEG_CLIENT_EMAIL');

// pagSeguroCheckout = pagSeguroCheckout + token;

function pagar(requestBody, callback){
  var nome = "banana";
  var valor = 1.99;
  
  var requestXML = jxon.jsToString(requestBody);

  var output = makeRequest('POST', pagSeguroCheckout, requestXML, function(resp, err ) {
    callback(resp);
  });  
}

function makeRequest(method, url, body, callback) {
  var output;
  // Set the headers
  var headers = {
    // 'Cookie': "cookie",
    'Content-Type': 'application/xml; charset=UTF-8'
    // ,'Content-Length': Buffer.byteLength(body)
  }
  var options = {
    url: pagSeguroCheckout,
    method: 'POST',
    headers: headers,
    qs: {'email': email, 'token': token},
    body : body
  }
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      output =  jxon.stringToJs(body);
      callback(output, null);
    }
    else{
      showError(error, body);
      callback(output, true);
    }
    
  })
}
function showError(error, msg) {
  console.log("pagSeg Error: ");
  console.log(error);
  console.log(msg);
  console.log("pagSeg Error END: ");
}

module.exports = {
  pay : pagar
};