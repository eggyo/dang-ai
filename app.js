/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
//'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request'),
  path = require('path'),
  _postback = require('./postback.js'),
  _line_postback = require('./line_postback.js'),
  _quickreply = require('./quickreply.js'),
  _fbMessageProcess = require('./fbMessageProcess.js'),
  line = require('@line/bot-sdk'),
  _parseFunction = require('./parseFunction.js'),
  _reply = require('./reply.js'),
  _metadata = require('./metadata.js');

var app = express();
const lineconfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const line_client = new line.Client(lineconfig);
app.use(line.middleware(lineconfig)); /// This line must be place before app.use->bodyParser

app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({
  verify: verifyRequestSignature
}));
app.use(express.static('public'));



/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}


app.get('/createquiz', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/createQuiz.html'));
});
app.get('/searchquiz', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/searchQuiz.html'));
});
app.get('/searchquizLine', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/searchQuizLine.html'));
});
app.get('/policy', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/policy.html'));
});
app.get('/bot-train', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/bottrain.html'));
});
app.get('/json-upload-to-parse', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/json-upload-to-parse.html'));
});
app.get('/push/userId=:userId&tags=:tags&limit=:limit', function(req, res) {
  var userId = req.params.userId;
  var tags = req.params.tags;
  var limit = req.params.limit;
  var data = '{"tags":' + tags + ',"limit":' + limit + ',"getTemp":' + true + '}'
  console.log("push userId: " + userId + " limit :" + limit + " tags :" + tags + "\ndata:" + data);

  line_client.pushMessage(userId, {
      type: 'text',
      text: "กำลังค้นหา Quiz จากการร้องขอ.."
    })
    .then(() => {
      res.json("done");
    })
    .catch((err) => {
      console.error("push error :" + err);
    });

  _line_postback.getQuizsByTags(data, function(replyData) {
    line_client.pushMessage(userId, replyData.results)
      .then(() => {
        res.json("done");
      })
      .catch((err) => {
        console.error("push error :" + err);
      });
  });




});
/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function(req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
      .update(buf)
      .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s senderID :%s recipientID : %s",
      messageId, appId, metadata, senderID, recipientID);
    _metadata.metadataProcess(metadata, function(results) {
      if (results.results != null) {
        for (var i = 0; i < results.results.length; i++) {
          console.log("callSendAPI :" + JSON.stringify(results.results[i]));
          callSendAPI(results.results[i]);
          //return;
        }
      }
    });
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    //sendTextMessage(senderID, "Quick reply tapped");
    _quickreply.payloadProcess(senderID, quickReplyPayload, function(results) {
      if (results.results != null) {
        callSendAPI(results.results.messageText);
        setTimeout(function() {
          if (results.results.quizData != null) {
            callSendAPI(results.results.quizData);
          }
        }, 1000);

      }
      return;
    });

  }

  if (messageText) {
    _fbMessageProcess.process(senderID, messageText);
  } else if (messageAttachments) {
    sendTextMessage(senderID, "นี่คือ 😁\nไอ้แดง - Dang.ai \n\nต้องการเล่น Quiz พิมพ์ เล่น,เริ่ม,play,start หรือกดปุ่ม เล่น Quiz ด้านล่าง\n\nต้องการดูการทำงานอื่นๆ พิมพ์ #help");
  }
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;
  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  _postback.payloadProcess(senderID, payload, function(results) {
    if (results.results != null) {
      for (var i = 0; i < results.results.length; i++) {
        callSendAPI(results.results[i]);
      }
    }
  });



  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  //sendTextMessage(senderID, "Postback called");
}




/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: messageData

  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
        console.log("Successfully called Send API for recipient %s",
          recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

// line api here!
app.post('/linewebhook', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

function handleEvent(event) {
  var userId = event.source.userId;


  if (event.type == 'postback') {
    var data = event.postback.data;
    _line_postback.process(userId, data, function(replyData) {
      var replyMessage = replyData.results;
      console.log("userId: %s ---- replyMessage: %s", userId, JSON.stringify(replyMessage));
      line_client.replyMessage(event.replyToken, replyMessage);
    });
  } else if (event.message.type == 'text') {
    console.log("------------> event.message.text: %s", event.message.text);
    switch (event.message.text) {
      case 'เล่น':
      case 'เริ่ม':
      case 'play':
      case 'start':
        line_client.replyMessage(event.replyToken, [{
          type: "template",
          altText: "this is a buttons template",
          template: {
            type: "buttons",
            thumbnailImageUrl: SERVER_URL + "/assets/dan.ai_cover_bg.jpg",
            title: "คุณต้องการทำอะไร?",
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
        }]);
        break;
      case 'help':
      case 'Help':
      case '#Help':
      case '#help':
        line_client.replyMessage(event.replyToken, [{
          type: "text",
          text: "ต้องการเล่น Quiz ให้พิมพ์ เล่น,เริ่ม,play,start หรือ กดปุ่ม เล่น Quiz ที่เมนู \n\nต้องการดูคำสั่งต่างๆ ให้พิมพ์  #help \n\nต้องการสร้างชุดคำถามกดปุ่ม สร้าง Quiz ที่เมนู\n\nคุณสามารถค้นหา Quiz ที่ต้องการเล่นเพียงกดปุ่ม ค้นหา Quiz เมื่อเริ่มเล่น Quiz \n\nสอนไอ้แดงให้ตอบโต้ พิมพ์\n  #ask (ข้อความที่1),(ข้อความที่..) #ans (คำตอบที่1),(คำตอบที่..)\n\n😁😁😁😁",
        }]);
        break;

      default:
        var messageText = event.message.text;
        _reply.processMessage(messageText, function(responseMsg) {
          if (responseMsg == messageText) {
            _reply.callCloudCode("getReplyMsg", '{"msg":"' + messageText + '"}', function(response) {
              if (response == "") {
                line_client.replyMessage(event.replyToken, [{
                  type: "text",
                  text: "#!?!%$\n\nข้ายังโง่อยู ช่วยสอนข้าแค่พิมพ์\n#ask ข้อความที่สอน #ans ข้อความที่ตอบ"
                },{
                  type: "template",
                  altText: "วิธีสอนไอ้แดง",
                  template: {
                    type: "buttons",
                    title: "วิธีสอนไอ้แดง",
                    text: "หรือใช้วิธีง่ายๆแค่กดปุ่มด้านล่าง",
                    actions: [
                      {
                        "type": "uri",
                        "label": "สอนไอ้แดง",
                        "uri": "https://dang-ai.herokuapp.com/bot-train"
                      }
                    ]
                  }
                }]);
              } else {
                line_client.replyMessage(event.replyToken, [{
                  type: "text",
                  text: response
                }]);
              }
            });
          } else {
            line_client.replyMessage(event.replyToken, [{
              type: "text",
              text: responseMsg
            }]);
          }
        });
        break;

    }




  } else {
    return Promise.resolve(null);
  }
  /*
    return line_client.replyMessage(event.replyToken, {
      type: 'text',
      text: event.message.text
    });*/
}




// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
