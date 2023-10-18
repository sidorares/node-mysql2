'use strict';

const Iconv = require('iconv-lite');

exports.decode = function(buffer, encoding, start, end, options) {
  if (Buffer.isEncoding(encoding)) {
    if(options?.trimTrailingZero) {
      for(let i = end - 1; i >= start; i--) {
        if(buffer[i] === 48) {
          end--;
        } else if(buffer[i] === 46) {
          end--;
          break;
        } else {
          break;
        }
      }
    }
    return buffer.toString(encoding, start, end);
  }

  const decoder = Iconv.getDecoder(encoding, options || {});

  const res = decoder.write(buffer.slice(start, end));
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
