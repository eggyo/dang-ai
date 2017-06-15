var _parseFunction = require('./parseFunction.js');
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
        /*
      case "PLAY_QUIZ_FROM_SAMPLE_QUIZ":
        var tags = data.tags;
        var count = data.count;
        var name = data.name;
        var tagArray = JSON.stringify(tags);

        console.log("tags:" + tags + "  tagArray:" + tagArray);

        var messageData = {
          recipient: {
            id: recipientId
          },
          message: {
            text: "กำลังค้นหา Quiz: " + name,
            metadata: JSON.stringify({
              type: "GET_QUIZ_BY_TAGS",
              query: tagArray,
              userId: recipientId,
              limit: count
            })
          }
        };
        result({
          "results": [messageData]
        });
        break;*/

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
      columns: [

      ]
  }
};

  var messageData = {
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

        var element = {
          thumbnailImageUrl: SERVER_URL + "/assets/dan.ai_cover_bg.jpg",
          title: name,
          text: "ทำปัญหาชุดนี้กด Start หรือค้นหาเอง\nกด ค้นหา Quiz",
          actions: [{
              type: "postback",
              label: "Start",
              data: JSON.stringify({
                type: "PLAY_QUIZ_FROM_SAMPLE_QUIZ",
                tags: tags,
                count: count,
                name: name
              })
            }, {
              type: "uri",
              label: "ค้นหา Quiz",
              uri: "https://dang-ai.herokuapp.com/searchquizLine?userId=" + userId
            },
            {
              type: "postback",
              labe: "Shuffle!!",
              data: JSON.stringify({
                "type": "SHUFFLE_TOPICS"
              })
            }
          ]
        };

        var e = {
          "thumbnailImageUrl": SERVER_URL + "/assets/dan.ai_cover_bg.jpg",
          "title": name,
          "text": "ทำปัญหาชุดนี้กด Start หรือค้นหาเอง\nกด ค้นหา Quiz",
          "actions": [
              {
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
