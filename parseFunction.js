var request = require('request');

module.exports = {
  callCloudCode: function(methodName, requestMsg, responseMsg) {
    callParseServerCloudCode(methodName, requestMsg, function(res) {
      responseMsg(res);
    });
  }
};

function callParseServerCloudCode(methodName, requestMsg, responseMsg) {
  console.log("callCloudCode:" + methodName + "\nrequestMsg:" + requestMsg);
  var options = {
    url: 'https://eggyo-quiz-db.herokuapp.com/parse/functions/' + methodName,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'myAppId',
      'X-Parse-REST-API-Key': 'myRestKey'
    },
    body: requestMsg
  };

  function callback(error, response, body) {
    console.log("response:" + JSON.stringify(response));
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      responseMsg(info.result);
    } else {
      console.error("Unable to send message. Error :" + error);
    }
  }
  request(options, callback);
}
