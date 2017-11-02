// var request = require('request');
var promisedRequest= require('request-promise');
const jxon = require('jxon');
const config = require('../config');
const pagSeguroCheckout = config.get('PAGSEG_URL');;
const token = config.get('PAGSEG_CLIENT_TOKEN');
const email = config.get('PAGSEG_CLIENT_EMAIL');


function pagar(requestBody, callback){ 
  console.log("PAY START ########");
  return makePromisedRequest('POST', pagSeguroCheckout, jxon.jsToString(requestBody));  
}

function makePromisedRequest(method, url, body) {
  var output;
  var headers = {'Content-Type': 'application/xml; charset=UTF-8'};
  var options = {
    uri: pagSeguroCheckout,
    method: 'POST',
    headers: headers,
    qs: {'email': email, 'token': token},
    body : body
  }
  promisedRequest(options)
  .then((body) => {
    console.log("PAY END ########");
    return jxon.stringToJs(body);;
  }).catch((error)=>{
    showError(error);
    return null;
  });
}
function showError(error) {
  console.log("Request Error Start: ");
  console.log(error);
  // console.log(msg);
  console.log("Request Error End: ");
}

module.exports = {
  pay : pagar
};