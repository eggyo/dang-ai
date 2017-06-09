var request = require('request');
var _postback = require('./postback.js');

module.exports = {
  payloadProcess: function(recipientId, payload, responseData) {
    try {
      var data = JSON.parse(payload);
      var type = data.type;

      switch (type) {
        case "PLAY_QUIZ_STATE_NEXT":
          var nextQuizs = data.nextQuizs;
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
              recipient: {
                id: recipientId
              },
              message: {
                text: "ถูกต้อง! คุณได้คะแนน" + score + "/" + quiz_count + " \n เฉลย : " + correct_index + "\nเริ่มข้อต่อไปเลยนะ",
                metadata: ""
              }
            };
          } else {
            // incorrect
            messageText = {
              recipient: {
                id: recipientId
              },
              message: {
                text: "คุณตอบผิด! คุณได้คะแนน" + score + "/" + quiz_count + "\n เฉลย : " + correct_index + "\nเริ่มข้อต่อไปเลยนะ",
                metadata: ""
              }
            };
          }
          var newNextQuizs = [];
          for (var i = 0; i < nextQuizs.length; i++) {
            var objectId = nextQuizs[i];
            if (i != 0) {
              newNextQuizs.push(objectId);
            } else {
              currentQuiz = objectId;
            }
          }
          if (newNextQuizs.length != 0) {
            parseQuizObjectToMessage(currentQuiz, function(response) {

              if (response != null) {
                var quiz = response.quiz;
                var correct_index = response.correct_index;
                var choice_count = response.choice_count;
                var payloadData = {
                  "type": "PLAY_QUIZ_STATE_NEXT",
                  "nextQuizs": newNextQuizs,
                  "currentQuiz": currentQuiz,
                  "choice_count": choice_count,
                  "quiz_count": quiz_count,
                  "score": score,
                  "correct_index": correct_index
                };
                var messageData = {
                  recipient: {
                    id: recipientId
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
                  "results": {
                    "messageText": messageText,
                    "quizData": messageData
                  }
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
                var messageData = {
                  recipient: {
                    id: recipientId
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
                  "results": {
                    "messageText": messageText,
                    "quizData": messageData
                  }
                });
              }
            });
          }
          break;
        case "PLAY_QUIZ_STATE_LAST":
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
              recipient: {
                id: recipientId
              },
              message: {
                text: "ถูกต้อง! คุณได้คะแนน" + score + "/" + quiz_count + "\n เฉลย : " + correct_index,
                metadata: ""
              }
            };
          } else {
            // incorrect
            messageText = {
              recipient: {
                id: recipientId
              },
              message: {
                text: "คุณตอบผิด! คุณได้คะแนน" + score + "/" + quiz_count + "\n เฉลย : " + correct_index,
                metadata: ""
              }
            };
          }
          if (score > 5) {
            messageText.message.text += "\nผลการทดสอบ : ผ่าน!!"
          } else {
            messageText.message.text += "\nผลการทดสอบ : ไม่ผ่าน!!"
          }
          var templateData = {
            recipient: {
              id: recipientId
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "button",
                  text: "คุณต้องการทำอะไรต่อ?",
                  buttons: [{
                    type: "postback",
                    payload: JSON.stringify({
                      "type": "PLAY_QUIZ_PAYLOAD"
                    }),
                    title: "เล่น Quiz"
                  }, {
                    type: "web_url",
                    url: "https://dang-ai.herokuapp.com/createquiz",
                    title: "สร้าง Quiz",
                    messenger_extensions: true,
                    webview_height_ratio: "tall"
                  }]
                }
              }
            }
          };

          responseData({
            "results": {
              "messageText": messageText,
              "quizData": templateData
            }
          });


          break;
        case "SHUFFLE_TOPICS":
          _postback.shuffle_quiz_return_msg(recipientId, function(result) {
            responseData({
              "results": {
                "messageText": result.results[0]
              }
            });
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
