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
  },
  getQuizsByTags: function(data, replyData) {
    getQuizsByTags(data, function(res) {
      replyData(res);
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

      case "PLAY_QUIZ_FROM_TOPIC":
        showFirstQuiz(data, function(res) {
          replyData(res);
        });
        break;

      case "PLAY_QUIZ_STATE_NEXT":
        showNextQuiz(data, function(res) {
          replyData(res);
        });
        break;

      case "PLAY_QUIZ_STATE_LAST":
        showLastQuiz(data, function(res) {
          replyData(res);
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

function showLastQuiz(data, replyData) {
  var currentQuiz = data.currentQuiz;
  var choice_count = data.choice_count;
  var quiz_count = data.quiz_count;
  var score = data.score;
  var correct_index = data.correct_index;
  var payload_index = data.payload_index;
  var messageText;
  if (payload_index == correct_index) {
    // correct
    score += 1;
    messageText = {
      type: 'text',
      text: "คุณตอบ : " + payload_index + "\n✅✅✅✅\nคุณได้คะแนน " + score + "/" + quiz_count + "\nเฉลย : " + correct_index
    };
  } else {
    // incorrect
    messageText = {
      type: 'text',
      text: "คุณตอบ : " + payload_index + "\n❌❌❌❌\nคุณได้คะแนน " + score + "/" + quiz_count + "\nเฉลย : " + correct_index
    };
  }
  console.log("score normalise:" + (score/quiz_count));

  if ((score/quiz_count) > 0.5) {
    messageText.text += "\n\nผลการทดสอบ : ผ่าน!!\n😁😁😁😁"
  } else {
    messageText.text += "\n\nผลการทดสอบ : ไม่ผ่าน!!\n😭😭😭😭"
  }
  var template = {
    type: "template",
    altText: "this is a buttons template",
    template: {
      type: "buttons",
      thumbnailImageUrl: SERVER_URL + "/assets/dan.ai_cover_bg.jpg",
      title: "คุณต้องการทำอะไรต่อ?",
      text: "เลือกเมนูด้านล่าง",
      actions: [{
          type: "postback",
          label: "เล่น Quiz",
          data: JSON.stringify({
            "type": "PLAY_QUIZ_PAYLOAD"
          })
        },
        {
          "type": "uri",
          "label": "สร้าง Quiz",
          "uri": "https://dang-ai.herokuapp.com/createquiz"
        }
      ]
    }
  };
  replyData({
    "results": [messageText, template]
  });
}

function showNextQuiz(data, replyData) {
  var quizTempId = data.quizTempId;
  var currentQuiz = data.currentQuiz;
  var choice_count = data.choice_count;
  var quiz_count = data.quiz_count;
  var score = data.score;
  var correct_index = data.correct_index;
  var payload_index = data.payload_index;
  var messageText;
  if (payload_index == correct_index) {
    // correct
    score += 1;
    messageText = {
      type: 'text',
      text: "คุณตอบ : " + payload_index + "\n✅✅✅✅\nคุณได้คะแนน " + score + "/" + quiz_count + "\nเฉลย : " + correct_index + "\nเริ่มข้อต่อไปเลยนะ"
    };
  } else {
    // incorrect
    messageText = {
      type: 'text',
      text: "คุณตอบ : " + payload_index + "\n❌❌❌❌\nคุณได้คะแนน " + score + "/" + quiz_count + "\nเฉลย : " + correct_index + "\nเริ่มข้อต่อไปเลยนะ"
    };
  }
  getParseObject('QuizTemp', quizTempId, function(response) {
    var quizs = response.quizs;
    var newNextQuizs = [];
    for (var i = 0; i < quizs.length; i++) {
      var objectId = quizs[i].objectId;
      if (i != 0) {
        newNextQuizs.push(quizs[i]);
      } else {
        currentQuiz = objectId;
      }
    }
    var requestdata = '{"objectId":"' + quizTempId + '","quizs":' + JSON.stringify(newNextQuizs) + '}';
    _parseFunction.callCloudCode("updateQuizTemp", requestdata, function(response) {
      if (response == "done") {
        if (newNextQuizs.length != 0) {
          parseQuizObjectToMessage(currentQuiz, function(response) {

            if (response != null) {
              var quiz = response.quiz;
              var correct_index = response.correct_index;
              var choice_count = response.choice_count;
              var payloadData = {
                "type": "PLAY_QUIZ_STATE_NEXT",
                "quizTempId": quizTempId,
                "currentQuiz": currentQuiz,
                "choice_count": choice_count,
                "quiz_count": quiz_count,
                "score": score,
                "correct_index": correct_index
              };
              var choiceData = {
                type: "template",
                altText: "เลือกคำตอบที่ถูกต้อง",
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
                "results": [messageText, messageQuiz, choiceData]
              });
            }
          });
        } else {
          parseQuizObjectToMessage(currentQuiz, function(response) {

            if (response != null) {
              var quiz = response.quiz;
              var correct_index = response.correct_index;
              var choice_count = response.choice_count;
              var payloadData = {
                "type": "PLAY_QUIZ_STATE_LAST",
                "currentQuiz": currentQuiz,
                "choice_count": choice_count,
                "quiz_count": quiz_count,
                "score": score,
                "correct_index": correct_index
              };
              var choiceData = {
                type: "template",
                altText: "เลือกคำตอบที่ถูกต้อง",
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
                "results": [messageText, messageQuiz, choiceData]
              });
            }
          });
        }
      } else {

      }
    });

  });

}

function showFirstQuiz(data, replyData) {
  var count = data.count;
  var name = data.name;

  var msg_1 = {
    type: 'text',
    text: "กำลังค้นหา Quiz: " + name
  };
  var msg_2 = {
    type: 'text',
    text: "โอเค เรามาเริ่มกันเลย"
  };
  var requestdata = '{"name":' + name + ',"limit":' + count + ',"getTemp":' + true + '}'
  _parseFunction.callCloudCode("getQuizsByCategory", requestdata, function(response) {
    if (response) {
      console.log("getQuizsByCategory response:" + JSON.stringify(response));

      var quizs = response.quizs;
      var quizTempId = response.objectId;
      /*
      var quizData = [];
      for (var i = 0; i < quizs.length; i++) {
        var obj = quizs[i]
        var objectId = obj.objectId;
        quizData.push(objectId);
      }*/

      var nextQuizs = [];
      var currentQuiz = '';
      for (var i = 0; i < quizs.length; i++) {
        var objectId = quizs[i].objectId;
        if (i != 0) {
          nextQuizs.push(quizs[i]);
        } else {
          currentQuiz = objectId;
        }
      }
      var requestdata = '{"objectId":"' + quizTempId + '","quizs":' + JSON.stringify(nextQuizs) + '}';
      _parseFunction.callCloudCode("updateQuizTemp", requestdata, function(response) {
        if (response == "done") {
          parseQuizObjectToMessage(currentQuiz, function(response) {

            if (response != null) {
              var quiz = response.quiz;
              var correct_index = response.correct_index;
              var choice_count = response.choice_count;
              var payloadData = {
                "type": "PLAY_QUIZ_STATE_NEXT",
                "quizTempId": quizTempId,
                "currentQuiz": currentQuiz,
                "choice_count": choice_count,
                "quiz_count": quizs.length,
                "score": 0,
                "correct_index": correct_index
              };
              var choiceData = {
                type: "template",
                altText: "เลือกคำตอบที่ถูกต้อง",
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
          console.log("updateQuizTemp error:" + response);
          return;
        }
      });
    } else {
      return;
    }
  });
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
  _parseFunction.callCloudCode("getTopics", requestdata, function(response) {
    if (response.length != 0) {
      //console.log("getSampleQuiz: "+JSON.stringify(response));
      for (var i = 0; i < response.length; i++) {
        var obj = response[i];
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
                type: "PLAY_QUIZ_FROM_TOPIC",
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


function getParseObject(className, objectId, responseMsg) {
  var options = {
    url: 'https://eggyo-quiz-db.herokuapp.com/parse/classes/' + className + '/' + objectId,
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
  getParseObject('Quiz', objectId, function(response) {
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

function getQuizsByTags(requestdata, replyData) {
  _parseFunction.callCloudCode("getQuizsByTags", requestdata, function(response) {
    if (response) {
      console.log("getQuizsByTags response:" + JSON.stringify(response));

      var quizs = response.quizs;
      var quizTempId = response.objectId;

      var nextQuizs = [];
      var currentQuiz = '';
      for (var i = 0; i < quizs.length; i++) {
        var objectId = quizs[i].objectId;
        if (i != 0) {
          nextQuizs.push(quizs[i]);
        } else {
          currentQuiz = objectId;
        }
      }
      var requestdata = '{"objectId":"' + quizTempId + '","quizs":' + JSON.stringify(nextQuizs) + '}';
      _parseFunction.callCloudCode("updateQuizTemp", requestdata, function(response) {
        if (response == "done") {
          parseQuizObjectToMessage(currentQuiz, function(response) {

            if (response != null) {
              var quiz = response.quiz;
              var correct_index = response.correct_index;
              var choice_count = response.choice_count;
              var payloadData = {
                "type": "PLAY_QUIZ_STATE_NEXT",
                "quizTempId": quizTempId,
                "currentQuiz": currentQuiz,
                "choice_count": choice_count,
                "quiz_count": quizs.length,
                "score": 0,
                "correct_index": correct_index
              };
              var choiceData = {
                type: "template",
                altText: "เลือกคำตอบที่ถูกต้อง",
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
                "results": [messageQuiz, choiceData]
              });
            }
          });
        } else {
          console.log("updateQuizTemp error:" + response);
          return;
        }
      });
    } else {
      return;
    }
  });
}
