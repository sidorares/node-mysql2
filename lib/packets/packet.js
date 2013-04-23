//var BigNumber = require("bignumber.js");

function Packet(id, buffer, start, end)
{
  this.sequenceId = id;
  this.buffer = buffer;
  this.offset = start;
  this.start = start;
  this.end = end;
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
  return this.buffer.readUInt16LE(this.offset - 2);
};

Packet.prototype.readInt32 = function()
{
  this.offset += 4;
  return this.buffer.readUInt32LE(this.offset - 4);
};

Packet.prototype.isEOF = function() {
  return this.buffer[this.offset] == 0xfe && this.length() < 9;
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
   throw "Should not reach here: " + byte1;
};

Packet.prototype.readBuffer = function(len) {
  this.offset += len;
  return this.buffer.slice(this.offset - len, this.offset);
};

Packet.prototype.readLengthCodedString = function() {
  var len = this.readLengthCodedNumber();
  // TODO: check manually first byte here to avoid polymorphic return type?
  //if (len === null)
  //  return null;
  this.offset += len;
  return this.buffer.utf8Slice(this.offset - len, this.offset);
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
  this.offset += len;
  return this.buffer.utf8Slice(this.offset - len, this.offset);
};

// TODO: base? sign? parseFloat?
Packet.prototype.parseInt = function(len) {
  var result = 0;
  var end = this.offset + len;
  while(this.offset < end) {
    result *= 10;
    result += this.buffer[this.offset] - 48;
    this.offset++;
  }
  return result;
};

Packet.prototype.parseLengthCodedInt = function() {
  return this.parseInt(this.readLengthCodedNumber());
};

Packet.prototype.isError = function() {
  return this.buffer[this.offset] == 0xff;
};

Packet.prototype.asError = function() {
  this.offset = 1;
  var code = this.readInt8();
  var sqlState = this.readBuffer(7);
  var message = this.buffer.slice(this.offset);
  console.log('SqlState', sqlState.toString(), 'message', message.toString());
  var err = new Error(message.toString());
  err.code = this.code;
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

Packet.prototype.writeLengthCodedNumber = function(n) {
  // TODO: null
  if (n < 0xfb)
    return this.writeInt8(n);
  if (n < 0xffff) {
    this.writeInt8(0xfc);
    return this.writeInt16(n);
  }
  if (this < 0xffffff) {
    this.writeInt8(0xfd);
    return this.writeInt24(n);
  }
  throw "No bignumbers yet";
};

Packet.prototype.writeHeader = function()
{
  var offset = this.offset;
  this.offset = 0;
  this.writeInt24(this.buffer.length - 4);
  this.writeInt8(this.sequenceId);
  this.offset = offset;
};

// TODO: base toPacket() ?

module.exports = Packet;
