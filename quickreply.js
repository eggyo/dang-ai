_metadata = require('./metadata.js');

module.exports = {
  payloadProcess: function(recipientId, payload) {
    try {
      var data = JSON.parse(payload);
      var type = data.type;

      switch (type) {
        case "PLAY_QUIZ_STATE_NEXT":
          var nextQuizs = data.nextQuizs;
          var currentQuiz = data.currentQuiz;
          var choice_count = data.choice_count;
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
                text: "ถูกต้อง! คุณได้คะแนน" + score + "/10 เริ่มข้อต่อไปเลยนะ",
                metadata: "GET_START_MSG_METADATA"
              }
            };
          } else {
            // incorrect
            messageText = {
              recipient: {
                id: recipientId
              },
              message: {
                text: "คุณตอบผิด! คุณได้คะแนน" + score + "/10 เริ่มข้อต่อไปเลยนะ",
                metadata: "GET_START_MSG_METADATA"
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
            _metadata.parseQuizObjectToMessage(currentQuiz, function(response) {

              if (response != null) {
                var quiz = response.quiz;
                var correct_index = response.correct_index;
                var choice_count = response.choice_count;
                var payloadData = {
                  "type": "PLAY_QUIZ_STATE_NEXT",
                  "nextQuizs": nextQuizs,
                  "currentQuiz": currentQuiz,
                  "choice_count": choice_count,
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
                  "results": [messageText,messageData]
                });
              }
            });
          } else {
            _metadata.parseQuizObjectToMessage(currentQuiz, function(response) {

              if (response != null) {
                var quiz = response.quiz;
                var correct_index = response.correct_index;
                var choice_count = response.choice_count;
                var payloadData = {
                  "type": "PLAY_QUIZ_STATE_LAST",
                  "currentQuiz": currentQuiz,
                  "choice_count": choice_count,
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
                  "results": [messageText,messageData]
                });
              }
            });
          }




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
