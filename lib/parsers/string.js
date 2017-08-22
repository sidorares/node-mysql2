var Buffer = require('safe-buffer').Buffer;
var Iconv = require('iconv-lite');

exports.decode = function(buffer, encoding, options) {
  if (Buffer.isEncoding(encoding)) {
    return buffer.toString(encoding);
  }

  var decoder = Iconv.getDecoder(encoding, options || {});

  var res = decoder.write(buffer);
  var trail = decoder.end();

  return trail ? res + trail : res;
};

exports.encode = function(string, encoding, options) {
  if (Buffer.isEncoding(encoding)) {
    return Buffer.from(string, encoding);
  }

  var encoder = Iconv.getEncoder(encoding, options || {});

  var res = encoder.write(string);
  var trail = encoder.end();

  return trail && trail.length > 0 ? Buffer.concat([res, trail]) : res;
};
