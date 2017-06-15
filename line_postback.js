var _parseFunction = require('./parseFunction.js');
var request = require('request');



const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

module.exports = {
  process: function(userId, postbackData, replyData) {
    processPostback(userId, postbackData, function(data) {
      replyData(data);
    });
  }
};

function processPostback(userId, postbackData, replyData) {
  try {
    var data = JSON.parse(postbackData);
    var type = data.type;
    switch (type) {
      case "PLAY_QUIZ_PAYLOAD":

        showTopics(userId, function(data) {
          replyData(data);
        });

        break;
      case "SHUFFLE_TOPICS":
        showTopics(userId, function(data) {
          replyData(data);
        });
        break;

      case "PLAY_QUIZ_FROM_SAMPLE_QUIZ":
        var tags = data.tags;
        var count = data.count;
        var name = data.name;
        var tagArray = JSON.stringify(tags);

        console.log("tags:" + tags + "  tagArray:" + tagArray);
        var msg_1 = {
          type: 'text',
          text: "กำลังค้นหา Quiz: " + name
        };
        var msg_2 = {
          type: 'text',
          text: "โอเค เรามาเริ่มกันเลย"
        };
        var requestdata = '{"tags":' + tags + ',"limit":' + count + '}'
        _parseFunction.callCloudCode("getQuizsByTags", requestdata, function(response) {
          if (response) {
            var quizData = [];
            console.log("getQuizsByTags response:" + JSON.stringify(response));
            for (var i = 0; i < response.length; i++) {
              var obj = response[i]
              var objectId = obj.objectId;
              quizData.push(objectId);
            }

            var nextQuizs = [];
            var currentQuiz = '';
            for (var i = 0; i < quizData.length; i++) {
              var objectId = quizData[i];
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
                  "quiz_count": quizData.length,
                  "score": 0,
                  "correct_index": correct_index
                };
                var choiceData = {
                  type: "template",
                  altText: "this is a buttons template",
                  template: {
                    type: "buttons",
                    text: "เลือกคำตอบที่ถูกต้อง",
                    actions: []
                  }
                };
                var actions = [];
                for (var i = 0; i < choice_count; i++) {
                  payloadData['payload_index'] = i + 1;
                  actions.push({
                    type: "postback",
                    label: i + 1,
                    data: JSON.stringify(payloadData)
                  });
                }
                choiceData.template['actions'] = actions;

                var messageQuiz = {
                  type: 'text',
                  text: quiz
                };
                replyData({
                  "results": [msg_1, msg_2, messageQuiz, choiceData]
                });
              }
            });
          } else {
            return;
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


function showTopics(userId, replyData) {

  var m = {
    type: "template",
    altText: "this is a carousel template",
    template: {
      type: "carousel",
      columns: []
    }
  };

  var requestdata = '{"limit":5}';
  _parseFunction.callCloudCode("getSampleQuiz", requestdata, function(response) {
    if (response.length != 0) {
      //console.log("getSampleQuiz: "+JSON.stringify(response));
      for (var i = 0; i < response.length; i++) {
        var obj = response[i];
        var tags = obj.tags;
        var count = obj.count;
        var name = obj.name;

        var e = {
          "thumbnailImageUrl": SERVER_URL + "/assets/dan.ai_cover_bg.jpg",
          "title": name,
          "text": "ทำปัญหาชุดนี้กด Start หรือค้นหาเอง\nกด ค้นหา Quiz",
          "actions": [{
              "type": "postback",
              "label": "Start",
              "data": JSON.stringify({
                type: "PLAY_QUIZ_FROM_SAMPLE_QUIZ",
                tags: tags,
                count: count,
                name: name
              })
            },
            {
              "type": "postback",
              "label": "Shuffle!!",
              "data": JSON.stringify({
                "type": "SHUFFLE_TOPICS"
              })
            },
            {
              "type": "uri",
              "label": "ค้นหา Quiz",
              "uri": "https://dang-ai.herokuapp.com/searchquizLine?userId=" + userId
            }
          ]
        };

        //messageData.template.columns.push(element);
        m.template.columns.push(e);
      }
      replyData({
        "results": [m]
      });
    }
  });
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
