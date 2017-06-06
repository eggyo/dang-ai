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
module.exports = {
  metadataProcess: function (metadata) {
    var data = JSON.parse(metadata);
    if (data) {
      var type = data.type;
      var userId = data.userId;

      switch (type) {
        case "GET_QUIZ_BY_TAGS":
          var query = data.query;
          var data = '{"tags":' + query + ',"limit":10}'
          console.log("data:" + JSON.stringify(data));

          callParseServerCloudCode("getQuizsByTags", data, function(response) {
            if (response) {
              console.log("getQuizsByTags response:" + JSON.stringify(response));

              var messageText = "โอเค เรามาเริ่มกันเลย";
              var messageData = {
                recipient: {
                  id: userId
                },
                message: {
                  text: messageText,
                  metadata: JSON.stringify({
                    "type": "PLAY_QUIZ_STATE_FIRST",
                    "data": response
                  })
                }
              };
              return {
                "results": [messageData]
              };
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
            var object = data[i];
            var objectId = object.objectId;
            if (i != 0) {
              nextQuizs.push(objectId);
            } else {
              currentQuiz = objectId;
            }
          }
          getParseQuizObject(currentQuiz, function(response) {
            if (response != null) {
              var quiz = response.quiz;
              var correct_index = response.correct_index;
              var quiz_count = response.quiz_count;
              var payloadData = JSON.stringify({
                "type": "PLAY_QUIZ_STATE_NEXT",
                "nextQuizs": nextQuizs,
                "currentQuiz":currentQuiz,
                "quiz_count":quiz_count,
                "score":0,
                "correct_index":correct_index
              });
              var messageData = {
                recipient: {
                  id: userId
                },
                message: {
                  text: quiz,
                  metadata: "",
                  quick_replies: []
                }
              };
              for (var i = 0; i < quiz_count.length; i++) {
                messageData.message.quick_replies.push({
                  "content_type":"text",
                  "title":""+(i+1),
                  "payload":payloadData
                });

              }
            }
            return {
              "results": [messageData]
            };
          });


          break;

        default:
          return;
      }
    }
  }
};



function callParseServerCloudCode(methodName, requestMsg, responseMsg) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://eggyo-quiz-db.herokuapp.com/parse/functions/' + methodName, true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.setRequestHeader('X-Parse-Application-Id', 'myAppId');
  xhr.setRequestHeader('X-Parse-REST-API-Key', 'myRestKey');

  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var myArr = JSON.parse(this.responseText);
      responseMsg(myArr.result);
    }
  };

  xhr.send(requestMsg);
}


function getParseQuizObject(objectId, responseMsg) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://eggyo-quiz-db.herokuapp.com/parse/classes/Quiz/' + objectId, true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.setRequestHeader('X-Parse-Application-Id', 'myAppId');
  xhr.setRequestHeader('X-Parse-REST-API-Key', 'myRestKey');

  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var res = JSON.parse(this.responseText);
      responseMsg(res);
    }
  };

  xhr.send();
}

function parseQuizObjectToMessage(objectId, quizMsg) {
  getParseQuizObject(objectId, function(response) {
    if (response != null) {
      var quiz = response.get('quiz');
      var correct_ans = response.get('correct_ans');
      var incorrect_ans = response.get('incorrect_ans');
      var correct_index = Math.floor(Math.random() * 4) + 1;
      var messageQuiz = quiz;
      var incorrect_index = 1;
      for (var i = 0; i < incorrect_ans.length; i++) {
        var inc = incorrect_ans[i];
        if ((i + 1) == correct_index) {
          messageQuiz += "\n" + (i + 1) + ". " + correct_ans;
          incorrect_index += 1;
          messageQuiz += "\n" + (incorrect_index) + ". " + inc;
          incorrect_index += 1;

        } else {
          messageQuiz += "\n" + (incorrect_index) + ". " + inc;
          incorrect_index += 1;
        }
      }
      quizMsg({
        quiz: messageQuiz,
        correct_index: correct_index,
        quiz_count: incorrect_ans.length + 1
      });
    } else {
      quizMsg({});
    }
  });
}
