## simsimi ![npm](https://badge.fury.io/js/simsimi.png) [![Build Status](https://travis-ci.org/song940/simsimi.svg?branch=master)](https://travis-ci.org/song940/simsimi)

simsimi for nodejs .

[![NPM](https://nodei.co/npm/simsimi.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/simsimi/)

### Installation

```shell
$ npm install simsimi --save
```


### Example

```js
const Simsimi = require('simsimi');

var simsimi = new Simsimi({
  key: 'your license key'
});

simsimi.listen('Hello', function(err, msg){
  if(err) return console.error(err);
  console.log('simsimi say:', msg);
});
```


### Contributing
- Fork this repo
- Clone your repo
- Install dependencies
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Open a pull request, and enjoy <3

### MIT license
Copyright (c) 2014 lsong

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---
