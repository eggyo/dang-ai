'use strict';
const request = require('superagent');

function Simsimi(options){
  if(!(this instanceof Simsimi))
    return new Simsimi(options);
  var defaults = {
    lc: 'en',
    ft: '0.0',
    api: 'http://sandbox.api.simsimi.com/request.p'
  };
  for(var k in options)
    defaults[k] = options[k];
  this.options = defaults;
  return this;
}

/**
 * [STATUS description]
 * @type {Object}
 */
Simsimi.STATUS = {
  OK           : 100,
  BAD_REQUEST  : 400,
  UNAUTHORIZED : 401,
  NOT_FOUND    : 404,
  SERVER_ERROR : 500
};

/**
 * [listen description]
 * @param  {[type]} text     [description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
Simsimi.prototype.listen = function (text, response){
  request
  .get(this.options.api)
  .query({
    text: text,
    lc  : this.options.lc,
    ft  : this.options.ft,
    key : this.options.key
  })
  .end(function(err, res){
    if(res.ok && res.body){
      res = res.body;
      if(res.result == Simsimi.STATUS.OK)
        return response(err, res.response, res);
    }
    response(err || res);
  });
};


module.exports = Simsimi;
