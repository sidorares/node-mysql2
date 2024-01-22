'use strict';

const Iconv = require('iconv-lite');
const decoderCache = new Map();

exports.decode = function (buffer, encoding, start, end, options) {
  if (Buffer.isEncoding(encoding)) {
    return buffer.toString(encoding, start, end);
  }

  const decoderArgs = { encoding, options: options || {} };
  const decoder =
    decoderCache.get(decoderArgs) ||
    decoderCache
      .set(
        decoderArgs,
        Iconv.getDecoder(decoderArgs.encoding, decoderArgs.options),
      )
      .get(decoderArgs);

  const res = decoder.write(buffer.slice(start, end));
  const trail = decoder.end();

  return trail ? res + trail : res;
};

exports.encode = function (string, encoding, options) {
  if (Buffer.isEncoding(encoding)) {
    return Buffer.from(string, encoding);
  }

  const encoder = Iconv.getEncoder(encoding, options || {});

  const res = encoder.write(string);
  const trail = encoder.end();

  return trail && trail.length > 0 ? Buffer.concat([res, trail]) : res;
};
