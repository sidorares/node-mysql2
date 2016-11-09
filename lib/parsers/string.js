var internalCodecs = {
  'utf8': true,
  'latin1': true,
  'binary': true
};

exports.decode = function (buffer, encoding, options) {
  if (internalCodecs[encoding]) {
    return buffer.toString(encoding);
  }
  var Iconv = require('iconv-lite');
  var decoder = Iconv.getDecoder(encoding, options || {});

  var res = decoder.write(buffer);
  var trail = decoder.end();

  return trail ? (res + trail) : res;
};

exports.encode = function (string, encoding, options) {
  if (internalCodecs[encoding]) {
    return Buffer.from(string, encoding);
  }

  var Iconv = require('iconv-lite');
  var encoder = Iconv.getEncoder(encoding, options || {});

  var res = encoder.write(string);
  var trail = encoder.end();

  return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
};
