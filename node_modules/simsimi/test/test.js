const assert  = require('assert');
const Simsimi = require('..');

describe('Simsimi SDK Test Case', function(){
  
  var simsimi = new Simsimi({
    key: 'f05ba03a-c5c5-4e52-ac73-e3be6e2557f3'
  });
  
  it('Simsimi#listen', function(done){
    
    simsimi.listen('Hi', function(err, msg, response){
      assert.equal(response.result, Simsimi.STATUS.OK);
      done();
    });
    
  });
  
})
