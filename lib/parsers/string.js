'use strict';

const Iconv = require('iconv-lite');
const { createLRU } = require('lru.min');

const decoderCache = createLRU({
  max: 500,
});

// Direct slice methods skip the per-call encoding normalization and dispatch
// inside buffer.toString(); they have been stable Node internals for years
// but fall back gracefully where missing (other runtimes)
const hasFastSlices =
  typeof Buffer.prototype.utf8Slice === 'function' &&
  typeof Buffer.prototype.latin1Slice === 'function' &&
  typeof Buffer.prototype.asciiSlice === 'function';

exports.decode = function (buffer, encoding, start, end, options) {
  if (hasFastSlices) {
    // match buffer.toString() clamping semantics; the *Slice methods throw
    // on out-of-range offsets instead
    if (end > buffer.length) {
      end = buffer.length;
    }
    if (start < 0) {
      start = 0;
    }
    if (start >= end) {
      return '';
    }
    switch (encoding) {
      case 'utf8':
      case 'utf-8':
        return buffer.utf8Slice(start, end);
      case 'latin1':
      case 'binary':
        return buffer.latin1Slice(start, end);
      case 'ascii':
        return buffer.asciiSlice(start, end);
      default:
        break;
    }
  }
  if (Buffer.isEncoding(encoding)) {
    return buffer.toString(encoding, start, end);
  }

  // Optimize for common case: encoding="short_string", options=undefined.
  let decoder;
  if (!options) {
    decoder = decoderCache.get(encoding);
    if (!decoder) {
      decoder = Iconv.getDecoder(encoding);
      decoderCache.set(encoding, decoder);
    }
  } else {
    const decoderArgs = { encoding, options };
    const decoderKey = JSON.stringify(decoderArgs);
    decoder = decoderCache.get(decoderKey);
    if (!decoder) {
      decoder = Iconv.getDecoder(decoderArgs.encoding, decoderArgs.options);
      decoderCache.set(decoderKey, decoder);
    }
  }

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
