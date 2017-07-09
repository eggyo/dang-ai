var request = require('request');

module.exports = {
  callCloudCode: function(methodName, requestMsg, responseMsg) {
    callParseServerCloudCode(methodName, requestMsg, function(res) {
      responseMsg(res);
    });
  },
  processMessage: function(requestMsg, responseMsg) {
    processMessage(requestMsg, function(res) {
      responseMsg(res);
    });
  }
};
// ------ bot process ------//

function callParseServerCloudCode(methodName, requestMsg, responseMsg) {
  console.log("callParseServerCloudCode:" + methodName + "\nrequestMsg:" + requestMsg);
  var options = {
    url: 'https://reply-msg-parse-server.herokuapp.com/parse/functions/' + methodName,
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
      responseMsg(info.result.replyMsg);
      console.log("result.msg: " + info.result.msg + " result.replyMsg: " + info.result.replyMsg);
    } else {
      console.error("Unable to send message. Error :" + error);
    }
  }
  request(options, callback);
}


function processMessage(reqMsg, resMsg) {
  if (reqMsg.length > 6) {
    var checkMsg = reqMsg.substring(0, 4);
    switch (checkMsg) {
      case '#ask':
        // trainingCommand
        trainingCommand(reqMsg, function(res) {
          if (!res) {
            resMsg("ข้าว่ามีบางอย่างผิดพลาด คุณอาจจะลืมเว้นวรรค หรือเผลอกด เว้นบันทัด");
            //failed
          } else {
            resMsg("ข้าจำได้แล้ว ลองทักข้าใหม่ซิ อิอิ");
            //success
          }
        });
        break;
      case '#bot':
        // botCommand
        resMsg("bot command");

        break;

      default:
        resMsg(reqMsg);
    }
  } else {
    // return original msg
    resMsg(reqMsg);
  }
}

function trainingCommand(msg, res) {
  try {
    msg = msg.replace(/ /g, "");
    msg = msg.replace("#ask", "");
    msg = msg.replace("#ans", ":");
    var msgs = msg.split(":");
    var msgDatas = msgs[0].split(",");
    var replyDatas = msgs[1].split(",");
    msgDatas = JSON.stringify(msgDatas);
    replyDatas = JSON.stringify(replyDatas);
    var data = '{"msg":' + msgDatas + ',"replyMsg":' + replyDatas + '}';
    callParseServerCloudCode("botTraining", data, function(response) {
      console.log(response);
      res(response);
    });
  } catch (err) {
    res(null);
    console.log(err);
  }
}

function isBotCommand(msg, res) {
  if (msg.length > 6) {
    if (msg.substring(0, 4) == "#bot") {
      res(true);
    } else {
      res(false);
    }
  } else {
    res(false);
  }
}

function containsAny(str, substrings) {
  for (var i = 0; i != substrings.length; i++) {
    var substring = substrings[i];
    if (str.indexOf(substring) != -1) {
      return substring;
    }
  }
  return null;
}


// ------ bot process ------//
