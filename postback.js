module.exports = {
  payloadProcess: function (recipientId,payload) {
    switch(payload) {
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
                    buttons:[{
                      type: "postback",
                      payload: "PLAY_QUIZ_PAYLOAD",
                      title: "เล่น Quiz"
                    }, {
                      type: "web_url",
                      url: "https://dang-ai.herokuapp.com/createquiz",
                      title: "สร้าง Quiz"
                    }]}}}};
                    return {"results":[messageData,templateData]};
          break;
          case "PLAY_QUIZ_PAYLOAD":
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
                  buttons:[{
                    type: "postback",
                    payload: "PLAY_QUIZ_PAYLOAD",
                    title: "เล่น Quiz"
                  }, {
                    type: "web_url",
                    url: "https://www.oculus.com/en-us/rift/",
                    title: "สร้าง Quiz"
                  }]}}}};
                  return {"results":[templateData]};
              break;
        default:
            return;
    }

  }
};
