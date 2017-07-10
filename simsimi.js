const Simsimi = require('simsimi');
var simsimi = new Simsimi({
  key: '9a97521e-05ab-4c48-8cf7-fc9cfa9f821d',
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
