/*
metadata template
------------------
GET_QUIZ_BY_TAGS =
{
    "type": "GET_QUIZ_BY_TAGS",
    "query": <[tagArray]>
}
---------------

*/
request = require('request');


module.exports = {
  metadataProcess: function(metadata, responseData) {
    try {
      var data = JSON.parse(metadata);
      var type = data.type;
      var userId = data.userId;

      switch (type) {
        case "GET_QUIZ_BY_TAGS":
          var query = data.query;
          var data = '{"tags":[' + query + '],"limit":10}'
          console.log("data:" + JSON.stringify(data));

          callParseServerCloudCode("getQuizsByTags", data, function(response) {
            if (response) {
              var dataResponse = [];
              console.log("getQuizsByTags response:" + JSON.stringify(response));
              for (var i = 0; i < response.length; i++) {
                var obj = response[i]
                var objectId = obj.objectId;
                dataResponse.push(objectId);
              }
              var messageText = "โอเค เรามาเริ่มกันเลย";
              var messageData = {
                recipient: {
                  id: userId
                },
                message: {
                  text: messageText,
                  metadata: JSON.stringify({
                    "type": "PLAY_QUIZ_STATE_FIRST",
                    "userId": userId,
                    "data": dataResponse
                  })
                }
              };
              responseData({
                "results": [messageData]
              });
            } else {
              return;
            }
          });
          break;
        case "PLAY_QUIZ_STATE_FIRST":
          var nextQuizs = [];
          var currentQuiz = '';
          var data = data.data;
          for (var i = 0; i < data.length; i++) {
            var objectId = data[i];
            if (i != 0) {
              nextQuizs.push(objectId);
            } else {
              currentQuiz = objectId;
            }
          }
          parseQuizObjectToMessage(currentQuiz, function(response) {

            if (response != null) {
              var quiz = response.quiz;
              var correct_index = response.correct_index;
              var choice_count = response.choice_count;
              var payloadData = {
                "type": "PLAY_QUIZ_STATE_NEXT",
                "nextQuizs": nextQuizs,
                "currentQuiz": currentQuiz,
                "choice_count": choice_count,
                "score": 0,
                "correct_index": correct_index
              };
              
              var messageData = {
                recipient: {
                  id: userId
                },
                message: {
                  text: quiz,
                  metadata: ""
                }
              };
              var quick_replies = []
              for (var i = 0; i < choice_count; i++) {
                payloadData['payload_index'] = i + 1;
                quick_replies.push({
                  "content_type": "text",
                  "title": i + 1,
                  "payload": JSON.stringify(payloadData)
                });
              }
              messageData.message['quick_replies'] = quick_replies;
              console.log("messageData " + JSON.stringify(messageData) + " quick_replies:" + JSON.stringify(quick_replies));

              responseData({
                "results": [messageData]
              });
            }
          });


          break;

        default:
          return;
      }

    } catch (e) {
      return false;
    }
    return true;



  }
};


function callParseServerCloudCode(methodName, requestMsg, responseMsg) {
  console.log("callParseServerCloudCode:" + methodName + "\nrequestMsg:" + requestMsg);
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

function getParseQuizObject(objectId, responseMsg) {
  var options = {
    url: 'https://eggyo-quiz-db.herokuapp.com/parse/classes/Quiz/' + objectId,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'myAppId',
      'X-Parse-REST-API-Key': 'myRestKey'
    }
  };

  function callback(error, response, body) {
    console.log("response:" + JSON.stringify(response));
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      responseMsg(info);
    } else {
      console.error("Unable to send message. Error :" + error);
    }
  }
  request(options, callback);
}




function parseQuizObjectToMessage(objectId, quizMsg) {
  getParseQuizObject(objectId, function(response) {
    if (response != null) {
      var quiz = response.quiz;
      var correct_ans = response.correct_ans;
      var incorrect_ans = response.incorrect_ans;
      var correct_index = Math.floor(Math.random() * 4) + 1;
      var messageQuiz = quiz;
      var incorrect_index = 1;
      for (var i = 0; i < incorrect_ans.length; i++) {
        var inc = incorrect_ans[i];
        if ((i + 1) == correct_index) {
          messageQuiz += "\n" + (correct_index) + ". " + correct_ans;
          incorrect_index += 1;
          messageQuiz += "\n" + (incorrect_index) + ". " + inc;
          incorrect_index += 1;

        } else {
          messageQuiz += "\n" + (incorrect_index) + ". " + inc;
          incorrect_index += 1;
        }
      }
      if ((incorrect_ans.length + 1) == correct_index) {
        messageQuiz += "\n" + (correct_index) + ". " + correct_ans;

      }
      quizMsg({
        quiz: messageQuiz,
        correct_index: correct_index,
        choice_count: incorrect_ans.length + 1
      });
    } else {
      quizMsg({});
    }
  });
}
