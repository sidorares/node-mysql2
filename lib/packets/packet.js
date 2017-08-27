var ErrorCodeToName = require('../constants/errors.js');

var NativeBuffer = require('buffer').Buffer;
var Buffer = require('safe-buffer').Buffer;
var Long = require('long');
var StringParser = require('../parsers/string.js');

function Packet(id, buffer, start, end) {
  // hot path, enable checks when testing only
  // if (!Buffer.isBuffer(buffer) || typeof start == 'undefined' || typeof end == 'undefined')
  //  throw new Error('invalid packet');
  this.sequenceId = id;
  this.numPackets = 1;
  this.buffer = buffer;
  this.start = start;
  this.offset = start + 4;
  this.end = end;
}

// ==============================
// readers
// ==============================

Packet.prototype.reset = function() {
  this.offset = this.start + 4;
};

Packet.prototype.length = function() {
  return this.end - this.start;
};

Packet.prototype.slice = function() {
  return this.buffer.slice(this.start, this.end);
};

Packet.prototype.dump = function() {
  console.log(
    [this.buffer.asciiSlice(this.start, this.end)],
    this.buffer.slice(this.start, this.end),
    this.length(),
    this.sequenceId
  );
};

Packet.prototype.haveMoreData = function() {
  return this.end > this.offset;
};

Packet.prototype.skip = function(num) {
  this.offset += num;
};

Packet.prototype.readInt8 = function() {
  return this.buffer[this.offset++];
};

Packet.prototype.readInt16 = function() {
  this.offset += 2;
  return this.buffer.readUInt16LE(this.offset - 2, true);
};

Packet.prototype.readInt24 = function() {
  return this.readInt16() + (this.readInt8() << 16);
};

Packet.prototype.readInt32 = function() {
  this.offset += 4;
  return this.buffer.readUInt32LE(this.offset - 4, true);
};

Packet.prototype.readSInt8 = function() {
  return this.buffer.readInt8(this.offset++, true);
};

Packet.prototype.readSInt16 = function() {
  this.offset += 2;
  return this.buffer.readInt16LE(this.offset - 2, true);
};

Packet.prototype.readSInt32 = function() {
  this.offset += 4;
  return this.buffer.readInt32LE(this.offset - 4, true);
};

Packet.prototype.readInt64JSNumber = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  var l = new Long(word0, word1, true);
  return l.toNumber();
};

Packet.prototype.readSInt64JSNumber = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  if (!(word1 & 0x80000000)) {
    return word0 + 0x100000000 * word1;
  }
  var l = new Long(word0, word1, false);
  return l.toNumber();
};

Packet.prototype.readInt64String = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  var res = new Long(word0, word1, true);
  return res.toString();
};

Packet.prototype.readSInt64String = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  var res = new Long(word0, word1, false);
  return res.toString();
};

Packet.prototype.readInt64 = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  var res = new Long(word0, word1, true);
  var resNumber = res.toNumber(),
    resString = res.toString();

  res = resNumber.toString() === resString ? resNumber : resString;

  return res;
};

Packet.prototype.readSInt64 = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  var res = new Long(word0, word1, false);
  var resNumber = res.toNumber(),
    resString = res.toString();

  res = resNumber.toString() === resString ? resNumber : resString;

  return res;
};

Packet.prototype.isEOF = function() {
  return this.buffer[this.offset] == 0xfe && this.length() < 13;
};

Packet.prototype.eofStatusFlags = function() {
  return this.buffer.readInt16LE(this.offset + 3);
};

Packet.prototype.eofWarningCount = function() {
  return this.buffer.readInt16LE(this.offset + 1);
};

Packet.prototype.readLengthCodedNumber = function(bigNumberStrings, signed) {
  var byte1 = this.buffer[this.offset++];
  if (byte1 < 251) {
    return byte1;
  }
  return this.readLengthCodedNumberExt(byte1, bigNumberStrings, signed);
};

Packet.prototype.readLengthCodedNumberSigned = function(bigNumberStrings) {
  return this.readLengthCodedNumber(bigNumberStrings, true);
};

Packet.prototype.readLengthCodedNumberExt = function(
  tag,
  bigNumberStrings,
  signed
) {
  var word0, word1;
  var res;
  if (tag == 0xfb) {
    return null;
  }

  if (tag == 0xfc) {
    return this.readInt8() + (this.readInt8() << 8);
  }

  if (tag == 0xfd) {
    return this.readInt8() + (this.readInt8() << 8) + (this.readInt8() << 16);
  }

  if (tag == 0xfe) {
    // TODO: check version
    // Up to MySQL 3.22, 0xfe was followed by a 4-byte integer.
    word0 = this.readInt32();
    word1 = this.readInt32();
    if (word1 === 0) {
      return word0; // don't convert to float if possible
    }

    if (word1 < 2097152) {
      // max exact float point int, 2^52 / 2^32
      return word1 * 0x100000000 + word0;
    }

    res = new Long(word0, word1, !signed); // Long need unsigned

    var resNumber = res.toNumber(),
      resString = res.toString();

    res = resNumber.toString() === resString ? resNumber : resString;

    return bigNumberStrings ? resString : res;
  }

  console.trace();
  throw new Error('Should not reach here: ' + tag);
};

Packet.prototype.readFloat = function() {
  var res = this.buffer.readFloatLE(this.offset);
  this.offset += 4;
  return res;
};

Packet.prototype.readDouble = function() {
  var res = this.buffer.readDoubleLE(this.offset);
  this.offset += 8;
  return res;
};

Packet.prototype.readBuffer = function(len) {
  if (typeof len == 'undefined') {
    len = this.end - this.offset;
  }
  this.offset += len;
  return this.buffer.slice(this.offset - len, this.offset);
};

var INVALID_DATE = new Date(NaN);
// DATE, DATETIME and TIMESTAMP
Packet.prototype.readDateTime = function() {
  var length = this.readInt8();
  if (length == 0xfb) {
    return null;
  }
  var y = 0;
  var m = 0;
  var d = 0;
  var H = 0;
  var M = 0;
  var S = 0;
  var ms = 0;
  if (length > 3) {
    y = this.readInt16();
    m = this.readInt8();
    d = this.readInt8();
  }
  if (length > 6) {
    H = this.readInt8();
    M = this.readInt8();
    S = this.readInt8();
  }
  if (length > 10) {
    ms = this.readInt32() / 1000;
  }
  if (y + m + d + H + M + S + ms === 0) {
    return INVALID_DATE;
  }
  return new Date(y, m - 1, d, H, M, S, ms);
};

// this is nearly duplicate of previous function so generated code is not slower
// due to "if (dateStrings)" branching
var pad = '000000000000';
function leftPad(num, value) {
  var s = value.toString();
  // if we don't need to pad
  if (s.length >= num) {
    return s;
  }
  return (pad + s).slice(-num);
}

Packet.prototype.readDateTimeString = function() {
  var length = this.readInt8();
  var y = 0;
  var m = 0;
  var d = 0;
  var H = 0;
  var M = 0;
  var S = 0;
  var ms = 0;
  var str;
  if (length > 3) {
    y = this.readInt16();
    m = this.readInt8();
    d = this.readInt8();
    str = [leftPad(4, y), leftPad(2, m), leftPad(2, d)].join('-');
  }
  if (length > 6) {
    H = this.readInt8();
    M = this.readInt8();
    S = this.readInt8();
    str += ' ' + [leftPad(2, H), leftPad(2, M), leftPad(2, S)].join(':');
  }
  if (length > 10) {
    ms = this.readInt32();
    str += '.';
    str += ms;
  }
  return str;
};

// TIME - value as a string, Can be negative
Packet.prototype.readTimeString = function(convertTtoMs) {
  var length = this.readInt8();
  if (length === 0) {
    return 0;
  }

  var result = 0;
  var sign = this.readInt8() ? -1 : 1; // 'isNegative' flag byte
  var d = 0;
  var H = 0;
  var M = 0;
  var S = 0;
  var ms = 0;
  if (length > 6) {
    d = this.readInt32();
    H = this.readInt8();
    M = this.readInt8();
    S = this.readInt8();
  }
  if (length > 10) {
    ms = this.readInt32();
  }

  if (convertTtoMs) {
    H += d * 24;
    M += H * 60;
    S += M * 60;
    ms += S * 1000;
    ms *= sign;
    return ms;
  }
  return (
    (sign === -1 ? '-' : '') +
    [d ? d * 24 + H : H, leftPad(2, M), leftPad(2, S)].join(':') +
    (ms ? '.' + ms : '')
  );
};

Packet.prototype.readLengthCodedString = function(encoding) {
  var len = this.readLengthCodedNumber();
  // TODO: check manually first byte here to avoid polymorphic return type?
  if (len === null) {
    return null;
  }
  this.offset += len;

  // TODO: Use characterSetCode to get proper encoding
  // https://github.com/sidorares/node-mysql2/pull/374
  return StringParser.decode(
    this.buffer.slice(this.offset - len, this.offset),
    encoding
  );
};

Packet.prototype.readLengthCodedBuffer = function() {
  var len = this.readLengthCodedNumber();
  return this.readBuffer(len);
};

Packet.prototype.readNullTerminatedString = function(encoding) {
  var start = this.offset;
  var end = this.offset;
  while (this.buffer[end]) {
    end = end + 1; // TODO: handle OOB check
  }
  this.offset = end + 1;
  return StringParser.decode(this.buffer.slice(start, end), encoding);
};

// TODO reuse?
Packet.prototype.readString = function(len, encoding) {
  if (typeof len == 'undefined') {
    len = this.end - this.offset;
  }
  this.offset += len;
  return StringParser.decode(
    this.buffer.slice(this.offset - len, this.offset),
    encoding
  );
};

// The whole reason parse* function below exist
// is because String creation is relatively expensive (at least with V8), and if we have
// a buffer with "12345" content ideally we would like to bypass intermediate
// "12345" string creation and directly build 12345 number out of
// <Buffer 31 32 33 34 35> data.
// In my benchmarks the difference is ~25M 8-digit numbers per second vs
// 4.5 M using Number(packet.readLengthCodedString())
// not used when size is close to max precision as series of *10 accumulate error
// and approximate result mihgt be diffreent from (approximate as well) Number(bigNumStringValue))
// In the futire node version if speed difference is smaller parse* functions might be removed
// don't consider them as Packet public API

var minus = '-'.charCodeAt(0);
var plus = '+'.charCodeAt(0);

Packet.prototype.parseInt = function(len, supportBigNumbers) {
  if (len === null) {
    return null;
  }

  if (len >= 14 && !supportBigNumbers) {
    var s = this.buffer.toString('ascii', this.offset, this.offset + len);
    this.offset += len;
    return Number(s);
  }

  var result = 0;
  var start = this.offset;
  var end = this.offset + len;
  var sign = 1;
  if (len === 0) {
    return 0; // TODO: assert? exception?
  }

  if (this.buffer[this.offset] == minus) {
    this.offset++;
    sign = -1;
  }

  // max precise int is 9007199254740992
  var str;
  var numDigits = end - this.offset;
  if (supportBigNumbers) {
    if (numDigits >= 15) {
      str = this.readString(end - this.offset, 'binary');
      result = parseInt(str, 10);
      if (result.toString() == str) {
        return sign * result;
      } else {
        return sign == -1 ? '-' + str : str;
      }
    } else if (numDigits > 16) {
      str = this.readString(end - this.offset);
      return sign == -1 ? '-' + str : str;
    }
  }

  if (this.buffer[this.offset] == plus) {
    this.offset++; // just ignore
  }
  while (this.offset < end) {
    result *= 10;
    result += this.buffer[this.offset] - 48;
    this.offset++;
  }
  var num = result * sign;
  if (!supportBigNumbers) {
    return num;
  }
  str = this.buffer.toString('ascii', start, end);
  if (num.toString() == str) {
    return num;
  } else {
    return str;
  }
};

// note that if value of inputNumberAsString is bigger than MAX_SAFE_INTEGER
// ( or smaller than MIN_SAFE_INTEGER ) the parseIntNoBigCheck result might be
// different from what you would get from Number(inputNumberAsString)
// String(parseIntNoBigCheck) <> String(Number(inputNumberAsString)) <> inputNumberAsString
Packet.prototype.parseIntNoBigCheck = function(len) {
  if (len === null) {
    return null;
  }
  var result = 0;
  var end = this.offset + len;
  var sign = 1;
  if (len === 0) {
    return 0; // TODO: assert? exception?
  }

  if (this.buffer[this.offset] == minus) {
    this.offset++;
    sign = -1;
  }
  if (this.buffer[this.offset] == plus) {
    this.offset++; // just ignore
  }
  while (this.offset < end) {
    result *= 10;
    result += this.buffer[this.offset] - 48;
    this.offset++;
  }
  return result * sign;
};

// copy-paste from https://github.com/mysqljs/mysql/blob/master/lib/protocol/Parser.js
Packet.prototype.parseGeometryValue = function() {
  var buffer = this.readLengthCodedBuffer();
  var offset = 4;

  if (buffer === null || !buffer.length) {
    return null;
  }

  function parseGeometry() {
    var x, y, i, j, numPoints, line;
    var result = null;
    var byteOrder = buffer.readUInt8(offset);
    offset += 1;
    var wkbType = byteOrder
      ? buffer.readUInt32LE(offset)
      : buffer.readUInt32BE(offset);
    offset += 4;
    switch (wkbType) {
      case 1: // WKBPoint
        x = byteOrder
          ? buffer.readDoubleLE(offset)
          : buffer.readDoubleBE(offset);
        offset += 8;
        y = byteOrder
          ? buffer.readDoubleLE(offset)
          : buffer.readDoubleBE(offset);
        offset += 8;
        result = { x: x, y: y };
        break;
      case 2: // WKBLineString
        numPoints = byteOrder
          ? buffer.readUInt32LE(offset)
          : buffer.readUInt32BE(offset);
        offset += 4;
        result = [];
        for (i = numPoints; i > 0; i--) {
          x = byteOrder
            ? buffer.readDoubleLE(offset)
            : buffer.readDoubleBE(offset);
          offset += 8;
          y = byteOrder
            ? buffer.readDoubleLE(offset)
            : buffer.readDoubleBE(offset);
          offset += 8;
          result.push({ x: x, y: y });
        }
        break;
      case 3: // WKBPolygon
        var numRings = byteOrder
          ? buffer.readUInt32LE(offset)
          : buffer.readUInt32BE(offset);
        offset += 4;
        result = [];
        for (i = numRings; i > 0; i--) {
          numPoints = byteOrder
            ? buffer.readUInt32LE(offset)
            : buffer.readUInt32BE(offset);
          offset += 4;
          line = [];
          for (j = numPoints; j > 0; j--) {
            x = byteOrder
              ? buffer.readDoubleLE(offset)
              : buffer.readDoubleBE(offset);
            offset += 8;
            y = byteOrder
              ? buffer.readDoubleLE(offset)
              : buffer.readDoubleBE(offset);
            offset += 8;
            line.push({ x: x, y: y });
          }
          result.push(line);
        }
        break;
      case 4: // WKBMultiPoint
      case 5: // WKBMultiLineString
      case 6: // WKBMultiPolygon
      case 7: // WKBGeometryCollection
        var num = byteOrder
          ? buffer.readUInt32LE(offset)
          : buffer.readUInt32BE(offset);
        offset += 4;
        result = [];
        for (i = num; i > 0; i--) {
          result.push(parseGeometry());
        }
        break;
    }
    return result;
  }
  return parseGeometry();
};

Packet.prototype.parseDate = function() {
  var strLen = this.readLengthCodedNumber();
  if (strLen === null) {
    return null;
  }

  if (strLen != 10) {
    // we expect only YYYY-MM-DD here.
    // if for some reason it's not the case return invalid date
    return new Date(NaN);
  }
  var y = this.parseInt(4);
  this.offset++; // -
  var m = this.parseInt(2);
  this.offset++; // -
  var d = this.parseInt(2);
  return new Date(y, m - 1, d);
};

Packet.prototype.parseDateTime = function() {
  var str = this.readLengthCodedString('binary');
  if (str === null) {
    return null;
  }
  return new Date(str);
};

// TODO: handle E notation
var dot = '.'.charCodeAt(0);
var exponent = 'e'.charCodeAt(0);
var exponentCapital = 'E'.charCodeAt(0);
Packet.prototype.parseFloat = function(len) {
  if (len === null) {
    return null;
  }

  var result = 0;
  var end = this.offset + len;
  var factor = 1;
  var pastDot = false;
  var charCode = 0;
  if (len === 0) {
    return 0; // TODO: assert? exception?
  }

  if (this.buffer[this.offset] == minus) {
    this.offset++;
    factor = -1;
  }

  if (this.buffer[this.offset] == plus) {
    this.offset++; // just ignore
  }

  while (this.offset < end) {
    charCode = this.buffer[this.offset];
    if (charCode == dot) {
      pastDot = true;
      this.offset++;
    } else if (charCode == exponent || charCode == exponentCapital) {
      this.offset++;
      var exponentValue = this.parseInt(end - this.offset);
      return result / factor * Math.pow(10, exponentValue);
    } else {
      result *= 10;
      result += this.buffer[this.offset] - 48;
      this.offset++;
      if (pastDot) {
        factor = factor * 10;
      }
    }
  }
  return result / factor;
};

Packet.prototype.parseLengthCodedIntNoBigCheck = function() {
  return this.parseIntNoBigCheck(this.readLengthCodedNumber());
};

Packet.prototype.parseLengthCodedInt = function(supportBigNumbers) {
  return this.parseInt(this.readLengthCodedNumber(), supportBigNumbers);
};

Packet.prototype.parseLengthCodedIntString = function() {
  return this.readLengthCodedString('binary');
};

Packet.prototype.parseLengthCodedFloat = function() {
  return this.parseFloat(this.readLengthCodedNumber());
};

Packet.prototype.peekByte = function() {
  return this.buffer[this.offset];
};

// OxFE is often used as "Alt" flag - not ok, not error.
// For example, it's first byte of AuthSwitchRequest
Packet.prototype.isAlt = function() {
  return this.peekByte() == 0xfe;
};

Packet.prototype.isError = function() {
  return this.peekByte() == 0xff;
};

Packet.prototype.asError = function(encoding) {
  this.reset();

  var fieldCount = this.readInt8();
  var errorCode = this.readInt16();
  var sqlState = '';
  if (this.buffer[this.offset] == 0x23) {
    sqlState = this.readBuffer(6).toString();
  }
  var message = this.readString(undefined, encoding);
  var err = new Error(message);
  err.code = ErrorCodeToName[errorCode];
  err.errno = errorCode;
  err.sqlState = sqlState;
  return err;
};

Packet.lengthCodedNumberLength = function(n) {
  if (n < 0xfb) {
    return 1;
  }

  if (n < 0xffff) {
    return 3;
  }

  if (n < 0xffffff) {
    return 5;
  } else {
    return 9;
  }
};

Packet.lengthCodedStringLength = function(str, encoding) {
  var buf = StringParser.encode(str, encoding);
  var slen = buf.length;
  return Packet.lengthCodedNumberLength(slen) + slen;
};

Packet.prototype.writeInt32 = function(n) {
  this.buffer.writeUInt32LE(n, this.offset);
  this.offset += 4;
};

Packet.prototype.writeInt24 = function(n) {
  this.writeInt8(n & 0xff);
  this.writeInt16(n >> 8);
};

Packet.prototype.writeInt16 = function(n) {
  this.buffer.writeUInt16LE(n, this.offset);
  this.offset += 2;
};

Packet.prototype.writeInt8 = function(n) {
  this.buffer.writeUInt8(n, this.offset);
  this.offset++;
};

Packet.prototype.writeBuffer = function(b) {
  b.copy(this.buffer, this.offset);
  this.offset += b.length;
};

Packet.prototype.writeNull = function() {
  this.buffer[this.offset] = 0xfb;
  this.offset++;
};

// TODO: refactor following three?
Packet.prototype.writeNullTerminatedString = function(s, encoding) {
  var buf = StringParser.encode(s, encoding);
  this.buffer.length && buf.copy(this.buffer, this.offset);
  this.offset += buf.length;
  this.writeInt8(0);
};

Packet.prototype.writeString = function(s, encoding) {
  if (s === null) {
    this.writeInt8(0xfb);

    return;
  }

  if (s.length === 0) {
    return;
  }

  // var bytes = Buffer.byteLength(s, 'utf8');
  // this.buffer.write(s, this.offset, bytes, 'utf8');
  // this.offset += bytes;

  var buf = StringParser.encode(s, encoding);
  this.buffer.length && buf.copy(this.buffer, this.offset);
  this.offset += buf.length;
};

Packet.prototype.writeLengthCodedString = function(s, encoding) {
  var buf = StringParser.encode(s, encoding);
  this.writeLengthCodedNumber(buf.length);
  this.buffer.length && buf.copy(this.buffer, this.offset);
  this.offset += buf.length;
};

Packet.prototype.writeLengthCodedBuffer = function(b) {
  this.writeLengthCodedNumber(b.length);
  b.copy(this.buffer, this.offset);
  this.offset += b.length;
};

Packet.prototype.writeLengthCodedNumber = function(n) {
  if (n < 0xfb) {
    return this.writeInt8(n);
  }

  if (n < 0xffff) {
    this.writeInt8(0xfc);
    return this.writeInt16(n);
  }

  if (n < 0xffffff) {
    this.writeInt8(0xfd);
    return this.writeInt24(n);
  }

  if (n === null) {
    return this.writeInt8(0xfb);
  }

  // TODO: check that n is out of int precision
  this.writeInt8(0xfe);
  this.buffer.writeUInt32LE(n, this.offset);
  this.offset += 4;
  this.buffer.writeUInt32LE(n >> 32, this.offset);
  this.offset += 4;
  return this.offset;
};

Packet.prototype.writeHeader = function(sequenceId) {
  var offset = this.offset;
  this.offset = 0;
  this.writeInt24(this.buffer.length - 4);
  this.writeInt8(sequenceId);
  this.offset = offset;
};

Packet.prototype.clone = function() {
  return new Packet(this.sequenceId, this.buffer, this.start, this.end);
};

Packet.prototype.type = function() {
  if (this.isEOF()) {
    return 'EOF';
  }

  if (this.isError()) {
    return 'Error';
  }

  if (this.buffer[this.offset] == 0) {
    return 'maybeOK'; // could be other packet types as well
  }

  return '';
};

Packet.MockBuffer = function() {
  var noop = function() {};
  var res = Buffer.alloc(0);
  for (var op in NativeBuffer.prototype) {
    if (typeof res[op] == 'function') {
      res[op] = noop;
    }
  }
  return res;
};

module.exports = Packet;
