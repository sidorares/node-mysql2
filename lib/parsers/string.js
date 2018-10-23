'use strict';

const Iconv = require('iconv-lite');

exports.decode = function(buffer, encoding, options) {
  if (Buffer.isEncoding(encoding)) {
    return buffer.toString(encoding);
  }

  const decoder = Iconv.getDecoder(encoding, options || {});

  const res = decoder.write(buffer);
  const trail = decoder.end();

  return trail ? res + trail : res;
};

exports.encode = function(string, encoding, options) {
  if (Buffer.isEncoding(encoding)) {
    return Buffer.from(string, encoding);
  }

  const encoder = Iconv.getEncoder(encoding, options || {});

  const res = encoder.write(string);
  const trail = encoder.end();

  return trail && trail.length > 0 ? Buffer.concat([res, trail]) : res;
};
