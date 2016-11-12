var Iconv = require('iconv-lite');

var NODE_ENCODING = [
  'ascii',
  'utf8',
  'utf16le',
  'ucs2',
  'base64',
  'latin1',
  'binary',
  'hex'
];

exports.decode = function (buffer, encoding, options) {
  if (NODE_ENCODING[encoding]) {
    return buffer.toString(encoding);
  }

  var decoder = Iconv.getDecoder(encoding, options || {});

  var res = decoder.write(buffer);
  var trail = decoder.end();

  return trail ? (res + trail) : res;
};

exports.encode = function (string, encoding, options) {
  if (NODE_ENCODING[encoding]) {
    return Buffer.from(string, encoding);
  }

  var encoder = Iconv.getEncoder(encoding, options || {});

  var res = encoder.write(string);
  var trail = encoder.end();

  return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
};
