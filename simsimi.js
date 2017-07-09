const Simsimi = require('simsimi');
var simsimi = new Simsimi({
  key: '1299f691-0dc1-4bdb-a2fa-df257b2340d6',
  lc: 'th'
});
module.exports = {
  processMessage: function(requestMsg, responseMsg) {
    simsimi.listen(requestMsg, function(err, msg) {
      if (err) return responseMsg('');
      responseMsg(msg);
    });
  }
};
