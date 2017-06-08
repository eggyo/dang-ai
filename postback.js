var _parseFunction = require('./parseFunction.js');

module.exports = {
  payloadProcess: function(recipientId, payload, result) {
    try {
      var data = JSON.parse(payload);
      var type = data.type;
      switch (type) {
        case "GET_START_PAYLOAD":
          var messageText = "ยินดีต้อนรับสู่ Bot ไอ้แดง - Dang.ai \nคุณสามารถเลือกตอบปัญหาได้ หลากหลายหัวข้อ หรือสร้างชุดปัญหาของคุณเองก็ได้";
          var messageData = {
            recipient: {
              id: recipientId
            },
            message: {
              text: messageText,
              metadata: "GET_START_MSG_METADATA"
            }
          };
          var templateData = {
            recipient: {
              id: recipientId
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "button",
                  text: "คุณต้องการทำอะไร?",
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
          result({
            "results": [messageData, templateData]
          });
          break;

        case "PLAY_QUIZ_PAYLOAD":
          var messageData = {
            recipient: {
              id: recipientId
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: []
                }
              }
            }
          };
          var data = '{"limit":5}';
          _parseFunction.callCloudCode("getSampleQuiz", data, function(response) {
            if (response.length != 0) {
              //console.log("getSampleQuiz: "+JSON.stringify(response));
              for (var i = 0; i < response.length; i++) {
                var obj = response[i];
                var tags = obj.tags;
                var count = obj.count;
                var name = obj.name;
                var tagArray = tags.split(',');

                var element = {
                  title: name,
                  subtitle: "ทำปัญหาชุดนี้กด Start หรือค้นหาเอง\nกด ค้นหา Quiz",
                  buttons: [{
                    type: "postback",
                    payload: JSON.stringify({
                      type: "PLAY_QUIZ_FROM_SAMPLE_QUIZ",
                      tags: tagArray,
                      count: count,
                      name: name
                    }),
                    title: "Start"
                  }, {
                    type: "web_url",
                    url: "https://dang-ai.herokuapp.com/searchquiz",
                    title: "ค้นหา Quiz",
                    messenger_extensions: true,
                    webview_height_ratio: "tall"
                  }],
                };
                messageData.message.attachment.payload.elements.push(element);
              }
              result({
                "results": [messageData]
              });
            }
          });

          break;
        case "PLAY_QUIZ_FROM_SAMPLE_QUIZ":
          var tags = data.tags;
          var count = data.count;
          var name = data.name;
          var messageData = {
            recipient: {
              id: recipientId
            },
            message: {
              text: "กำลังค้นหา Quiz: " + name,
              metadata: JSON.stringify({
                type: "GET_QUIZ_BY_TAGS",
                query: tags,
                userId: recipientId,
                limit: count
              })
            }
          };
          result({
            "results": [messageData]
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
