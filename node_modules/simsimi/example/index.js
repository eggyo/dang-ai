const simsimi = require('..')({
  key: 'f05ba03a-c5c5-4e52-ac73-e3be6e2557f3'
});

simsimi.listen('Hello', function(err, msg){
  if(err) return console.error(err);
  console.log('simsimi say:', msg);
});