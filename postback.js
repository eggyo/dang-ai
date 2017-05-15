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
                      type: "postback",
                      title: "สร้าง Quiz",
                      payload: "CREATE_QUIZ_PAYLOAD"
                    }]}}}};
                    return {[messageData,templateData]};
            break;

        default:
            return;
    }

  },
  bar: function () {
    // whatever
  }
};
