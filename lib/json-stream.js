const util = require('util');
const BufferList = require('bl');
const {Transform} = require('stream');

module.exports = function(options) {
  return new JSONStream(options);
};

const JSONStream = module.exports.JSONStream = function(options = {}) {
  Transform.call(this, options);
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;
  this._async = options.async || false;
};
util.inherits(JSONStream, Transform);

JSONStream.prototype._transform = function(data, encoding, callback) {
  if(this._buffer) {
    this._buffer.append(data);
  } else {
    this._buffer = new BufferList();
    this._buffer.append(data);
  }

  let ptr = 0;
  let start = 0;
  while(++ptr <= this._buffer.length) {
    if(this._buffer.get(ptr) === 10 || ptr === this._buffer.length) {
      let line;
      try {
        line = JSON.parse(this._buffer.slice(start, ptr));
      } catch(ex) { }
      if(line) {
        this.push(line);
        line = null;
      }
      if(this._buffer.get(ptr) === 10) {
        start = ++ptr;
      }
    }
  }

  this._buffer = this._buffer.shallowSlice(start);
  return this._async
    ? void setImmediate(callback)
    : void callback();
};
