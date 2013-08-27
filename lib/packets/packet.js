//var BigNumber = require("bignumber.js");
var ErrorCodeToName = require('../constants/errors').codeToName;

function Packet(id, buffer, start, end)
{
  this.sequenceId = id;
  this.buffer = buffer;
  this.offset = start || 0;
  this.start = start || 0;
  this.end = end || this.buffer.length;
}

// ==============================
// readers
// ==============================

Packet.prototype.reset = function() {
  this.offset = this.start;
};

Packet.prototype.length = function() {
  return this.end - this.start;
};

Packet.prototype.slice = function() {
  return this.buffer.slice(this.start, this.end);
};

Packet.prototype.dump = function() {
  console.log([this.buffer.asciiSlice(this.start, this.end)], this.buffer.slice(this.start, this.end), this.length(), this.sequenceId);
};

Packet.prototype.haveMoreData = function() {
  return this.end > this.offset;
};

Packet.prototype.skip = function(num) {
   if (!num)
     throw "Bad param in skip!"; // for some reason I keep doing skip(0) to indicate "skip one byte which should be 0"
   this.offset += num;
};

Packet.prototype.readInt8 = function()
{
  return this.buffer[this.offset++];
};

Packet.prototype.readInt16 = function()
{
  this.offset += 2;
  return this.buffer.readUInt16LE(this.offset - 2, true);
};

Packet.prototype.readInt24 = function() {
  return this.readInt16() + (this.readInt8() << 16);
};

Packet.prototype.readInt32 = function()
{
  this.offset += 4;
  return this.buffer.readUInt32LE(this.offset - 4, true);
};

Packet.prototype.readSInt8 = function()
{
  return this.buffer.readInt8(this.offset++, true);
};

Packet.prototype.readSInt16 = function()
{
  this.offset += 2;
  return this.buffer.readInt16LE(this.offset - 2, true);
};

Packet.prototype.readSInt32 = function()
{
  this.offset += 4;
  return this.buffer.readInt32LE(this.offset - 4, true);
};

Packet.prototype.readInt64 = function() {
  return this.readInt32() + 0x100000000*this.readInt32();
};

Packet.prototype.readSInt64 = function() {
  var word0 = this.readInt32();
  var word1 = this.readInt32();
  if (!(word1 & 0x80000000))
    return word0 + 0x100000000*word1;
  return -((((~word1)>>>0) * 0x100000000) + ((~word0)>>>0) + 1);
};

Packet.prototype.isEOF = function() {
  return this.buffer[this.offset] == 0xfe && this.length() < 9;
};

Packet.prototype.eofStatusFlags = function() {
  return this.buffer.readInt16LE(this.offset + 3);
};

Packet.prototype.eofWarningCount = function() {
  return this.buffer.readInt16LE(this.offset + 1);
};

Packet.prototype.readLengthCodedNumber = function() {
   var byte1 = this.readInt8();
   if (byte1 < 0xfb)
     return byte1;
   if (byte1 == 0xfc) {
     return this.readInt8() + (this.readInt8() << 8);
   }
   if (byte1 == 0xfd) {
     return this.readInt8() + (this.readInt8() << 8) + (this.readInt8() << 16);
   }
   if (byte1 == 0xfe) {
     console.trace();
     //throw "Implement 8bytes BigNumber";
   }
   if (byte1 == 0xfb)
     return null;

   console.trace();
   throw "Should not reach here: " + byte1;
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
  this.offset += len;
  return this.buffer.slice(this.offset - len, this.offset);
};

var INVALID_DATE = new Date(NaN);
// DATE, DATETIME and TIMESTAMP
Packet.prototype.readDateTime = function(convertTtoMs) {
  var length = this.readInt8();
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
  if (length > 11)
    ms = this.readInt32();
  if ((y + m + d + H + M + S + ms) === 0) {
    return INVALID_DATE;
  }
  return new Date(y, m, d, H, M, S, ms);
};

// TIME - value in microseconds. Can be negative
Packet.prototype.readTime = function(convertTtoMs) {
  var length = this.readInt8();
  if (length === 0)
    return 0;

  var result = 0;
  var sign = this.readInt8() ? -1 : 1; // 'isNegative' flag byte
  var d = 0;
  var H = 0;
  var M = 0;
  var S = 0;
  var ms = 0;
  if (length > 7) {
    d = this.readInt32();
    H = this.readInt8();
    M = this.readInt8();
    S = this.readInt8();
  }
  if (length > 11)
    ms = this.readInt32();
  return d*86400000 + H*3600000 + M*60000 + S*1000 + ms;
};

Packet.prototype.readLengthCodedString = function() {
  var len = this.readLengthCodedNumber();
  // TODO: check manually first byte here to avoid polymorphic return type?
  if (len === null)
    return null;
  this.offset += len;
  return this.buffer.utf8Slice(this.offset - len, this.offset);
};

Packet.prototype.readLengthCodedBuffer = function() {
  var len = this.readLengthCodedNumber();
  return this.readBuffer(len);
};

Packet.prototype.readNullTerminatedString = function() {
  var start = this.offset;
  var end = this.offset;
  while (this.buffer[end])
    end = end + 1; // TODO: handle OOB check
  this.offset = end + 1;
  return this.buffer.utf8Slice(start, end);
};

// TODO reuse?
Packet.prototype.readString = function(len) {
  if (typeof len == 'undefined')
    len = this.end - this.offset
  this.offset += len;
  return this.buffer.utf8Slice(this.offset - len, this.offset);
};

var minus = '-'.charCodeAt(0);
var plus = '+'.charCodeAt(0);
// TODO: base? sign? parseFloat?
Packet.prototype.parseInt = function(len) {

  if (len === null)
    return null;

  var result = 0;
  var end = this.offset + len;
  var sign = 1;
  if (len === 0)
    return 0; // TODO: assert? exception?
  if (this.buffer[this.offset] == minus) {
    this.offset++;
    sign = -1;
  }
  if (this.buffer[this.offset] == plus) {
    this.offset++; // just ignore
  }
  while(this.offset < end) {
    result *= 10;
    result += this.buffer[this.offset] - 48;
    this.offset++;
  }
  return result*sign;
};


// TODO: handle E notation
var dot = '.'.charCodeAt(0);
var exponent = 'e'.charCodeAt(0);
var exponentCapital = 'E'.charCodeAt(0);
Packet.prototype.parseFloat = function(len) {
  var result = 0;
  var end = this.offset + len;
  var factor = 1;
  var pastDot = false;
  var charCode = 0;
  if (len === 0)
    return 0; // TODO: assert? exception?

  if (this.buffer[this.offset] == minus) {
    this.offset++;
    factor = -1;
  }
  if (this.buffer[this.offset] == plus) {
    this.offset++; // just ignore
  }
  while(this.offset < end) {
    charCode = this.buffer[this.offset];
    if (charCode == dot)
    {
      pastDot = true;
      this.offset++;
    } else if (charCode == exponent || charCode == exponentCapital) {
      this.offset++;
      var exponentValue = this.parseInt(end - this.offset);
      return (result/factor)*Math.pow(10, exponentValue);
    } else {
      result *= 10;
      result += this.buffer[this.offset] - 48;
      this.offset++;
      if (pastDot)
        factor = factor*10;
    }
  }
  return result/factor;
};

Packet.prototype.parseLengthCodedInt = function() {
  return this.parseInt(this.readLengthCodedNumber());
};

Packet.prototype.parseLengthCodedFloat = function() {
  return this.parseFloat(this.readLengthCodedNumber());
};

Packet.prototype.isError = function() {
  return this.buffer[this.offset] == 0xff;
};

Packet.prototype.asError = function() {
  this.reset();

  var fieldCount = this.readInt8();
  var errorCode = this.readInt16();
  var sqlState  = '';
  if (this.buffer[this.offset] == 0x23)
    sqlState = this.readBuffer(5).toString();
  var message = this.readString();
  var err = new Error(message);
  err.code = ErrorCodeToName[errorCode];
  err.sqlState = sqlState;
  return err;
};


Packet.lengthCodedNumberLength = function(n) {
   if (n < 0xfb)
     return 1;
   if (n < 0xffff)
     return 3;
   if (n < 0xffffff)
     return 5;
   else
     return 9;
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
  this.buffer[this.offset] = n;
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
Packet.prototype.writeNullTerminatedString = function(s) {
  this.buffer.write(s, this.offset);
  this.offset += s.length;
  this.writeInt8(0);
};

Packet.prototype.writeString = function(s) {
  var bytes = Buffer.byteLength(s, 'utf8');
  this.buffer.write(s, this.offset, bytes, 'utf8');
  this.offset += bytes;
};

Packet.prototype.writeLengthCodedString = function(s) {
  this.writeLengthCodedNumber(s.length);
  this.buffer.write(s, this.offset);
  this.offset += s.length;
};

Packet.prototype.writeLengthCodedBuffer = function(b) {
  this.writeLengthCodedNumber(b.length);
  b.copy(this.buffer, this.offset);
  this.offset += b.length;
};

Packet.prototype.writeLengthCodedNumber = function(n) {
  // TODO: null - http://dev.mysql.com/doc/internals/en/overview.html#length-encoded-integer
  if (n < 0xfb)
    return this.writeInt8(n);
  if (n < 0xffff) {
    this.writeInt8(0xfc);
    return this.writeInt16(n);
  }
  if (n < 0xffffff) {
    this.writeInt8(0xfd);
    return this.writeInt24(n);
  }
  console.log(n);
  console.trace();
  throw "No bignumbers yet";
};

Packet.prototype.writeHeader = function(sequenceId)
{
  var offset = this.offset;
  this.offset = 0;
  this.writeInt24(this.buffer.length - 4);
  this.writeInt8(sequenceId);
  this.offset = offset;
};

Packet.prototype.clone = function() {
  var buffer = this.buffer.slice(this.start, this.end);
  var other = new Packet(this.sequenceId, this.buffer);
  return other;
};

module.exports = Packet;
