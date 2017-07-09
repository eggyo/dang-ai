var request = require('request');
module.exports = {
  processMessage: function(requestMsg, responseMsg) {
    requestSimsimi(requestMsg, function(res) {
      responseMsg(res);
    });
  }
};

// ------ simsimi process ------//

function requestSimsimi(requestMsg, responseMsg) {
  console.log("requestSimsimi requestMsg:" + requestMsg);
  var options = {
    url: 'http://sandbox.api.simsimi.com/request.p?key=1299f691-0dc1-4bdb-a2fa-df257b2340d6&lc=th&ft=0.0&text=' + requestMsg,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },body:''
  };

  function callback(error, response, body) {
    console.log("requestSimsimi response:" + JSON.stringify(response));
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      responseMsg(info.response);
      console.log("requestSimsimi result.msg: " + info.response );
    } else {
      console.error("requestSimsimi Unable to send message. Error :" + error);
      responseMsg("");
    }
  }
  request(options, callback);
}




// ------ bot process ------//
