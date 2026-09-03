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

// utf8Write skips the per-call encoding normalization and dispatch inside
// buffer.write(); same stability story as the slice methods above
exports.hasFastUtf8Write = typeof Buffer.prototype.utf8Write === 'function';

// A native slice costs a fixed ~50ns per call, mostly the JS to C++
// transition, while String.fromCharCode with a handful of arguments stays
// inside V8 at a fraction of that. Every ASCII byte decodes to the same
// code unit under utf8, ascii and latin1, so short all-ASCII values skip
// the transition; anything else returns null and takes the native path.
function shortAscii(b, s, length) {
  if (b[s] >= 128) {
    return null;
  }
  switch (length) {
    case 1: {
      const c0 = b[s];
      return c0 < 128 ? String.fromCharCode(c0) : null;
    }
    case 2: {
      const c0 = b[s];
      const c1 = b[s + 1];
      return (c0 | c1) < 128 ? String.fromCharCode(c0, c1) : null;
    }
    case 3: {
      const c0 = b[s];
      const c1 = b[s + 1];
      const c2 = b[s + 2];
      return (c0 | c1 | c2) < 128 ? String.fromCharCode(c0, c1, c2) : null;
    }
    case 4: {
      const c0 = b[s];
      const c1 = b[s + 1];
      const c2 = b[s + 2];
      const c3 = b[s + 3];
      return (c0 | c1 | c2 | c3) < 128
        ? String.fromCharCode(c0, c1, c2, c3)
        : null;
    }
    case 5: {
      const c0 = b[s];
      const c1 = b[s + 1];
      const c2 = b[s + 2];
      const c3 = b[s + 3];
      const c4 = b[s + 4];
      return (c0 | c1 | c2 | c3 | c4) < 128
        ? String.fromCharCode(c0, c1, c2, c3, c4)
        : null;
    }
    case 6: {
      const c0 = b[s];
      const c1 = b[s + 1];
      const c2 = b[s + 2];
      const c3 = b[s + 3];
      const c4 = b[s + 4];
      const c5 = b[s + 5];
      return (c0 | c1 | c2 | c3 | c4 | c5) < 128
        ? String.fromCharCode(c0, c1, c2, c3, c4, c5)
        : null;
    }
    case 7: {
      const c0 = b[s];
      const c1 = b[s + 1];
      const c2 = b[s + 2];
      const c3 = b[s + 3];
      const c4 = b[s + 4];
      const c5 = b[s + 5];
      const c6 = b[s + 6];
      return (c0 | c1 | c2 | c3 | c4 | c5 | c6) < 128
        ? String.fromCharCode(c0, c1, c2, c3, c4, c5, c6)
        : null;
    }
    case 8: {
      const c0 = b[s];
      const c1 = b[s + 1];
      const c2 = b[s + 2];
      const c3 = b[s + 3];
      const c4 = b[s + 4];
      const c5 = b[s + 5];
      const c6 = b[s + 6];
      const c7 = b[s + 7];
      return (c0 | c1 | c2 | c3 | c4 | c5 | c6 | c7) < 128
        ? String.fromCharCode(c0, c1, c2, c3, c4, c5, c6, c7)
        : null;
    }
    default:
      return null;
  }
}

exports.SHORT_STRING_MAX_LENGTH = 8;

// decode() for values of at most SHORT_STRING_MAX_LENGTH bytes, with the
// ASCII shortcut in front of the native slice; kept apart from decode() so
// the long-value path stays as small and inlinable as before
exports.decodeShort = function (buffer, encoding, start, end) {
  if (hasFastSlices && start >= 0 && start <= end && end <= buffer.length) {
    switch (encoding) {
      case 'utf8':
      case 'utf-8': {
        const short = shortAscii(buffer, start, end - start);
        return short !== null ? short : buffer.utf8Slice(start, end);
      }
      case 'latin1':
      case 'binary': {
        const short = shortAscii(buffer, start, end - start);
        return short !== null ? short : buffer.latin1Slice(start, end);
      }
      case 'ascii': {
        const short = shortAscii(buffer, start, end - start);
        return short !== null ? short : buffer.asciiSlice(start, end);
      }
      default:
        break;
    }
  }
  return exports.decode(buffer, encoding, start, end);
};

exports.decode = function (buffer, encoding, start, end, options) {
  if (hasFastSlices) {
    // replicate buffer.toString() bounds coercion exactly (the *Slice
    // methods throw on anything out of range): negative, NaN, fractional
    // and oversized offsets all clamp instead of throwing
    const len = buffer.length;
    if (start <= 0) {
      start = 0;
    } else if (start >= len) {
      return '';
    } else {
      start |= 0;
    }
    if (end === undefined || end > len) {
      end = len;
    } else {
      end |= 0;
    }
    if (end <= start) {
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
