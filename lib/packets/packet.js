//var BigNumber = require("bignumber.js");

function Packet(id, payload)
{
  this.sequenceId = id;
  this.payload = payload;
  this.offset = 0;
}

// ==============================
// readers
// ==============================

Packet.prototype.haveMoreData = function() {
  return this.payload.length > this.offset;
};

Packet.prototype.skip = function(num) {
   if (!num)
     throw "Bad param in skip!"; // for some reason I keep doing skip(0) to indicate "skip one byte which should be 0"
   this.offset += num;
};

Packet.prototype.readInt8 = function()
{
  return this.payload[this.offset++];
};

Packet.prototype.readInt16 = function()
{
  this.offset += 2;
  return this.payload.readUInt16LE(this.offset - 2);
};

Packet.prototype.readInt32 = function()
{
  this.offset += 4;
  return this.payload.readUInt32LE(this.offset - 4);
};

Packet.prototype.isEOF = function() {
  // TODO: fix when payload replaced with buffer
  return this.payload[0] == 0xfe && this.payload.length < 9;
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
     throw "Implement 8bytes BigNumber";
   }
   if (byte1 == 0xfb)
     return null;
   throw "Should not reach here: " + byte1;
};

Packet.prototype.readBuffer = function(len) {
  this.offset += len;
  return this.payload.slice(this.offset - len, this.offset);
};

Packet.prototype.readLengthCodedString = function() {
  var len = this.readLengthCodedNumber();
  // TODO: check manually first byte here to avoid polymorphic return type?
  //if (len === null)
  //  return null;
  this.offset += len;
  var sb = this.payload.parent;
  var offset = this.payload.offset + this.offset;
  return sb.utf8Slice(offset - len, offset);
  // safe, but slow. TODO: benchmark numbers here
  //    return this.payload.slice(this.offset - len, this.offset).toString('utf-8');
};

Packet.prototype.readNullTerminatedString = function() {
  var start = this.offset;
  var end = this.offset;
  while (this.payload[end])
    end = end + 1; // TODO: handle OOB check
  this.offset = end + 1;
  return this.payload.toString('utf8', start, end); // TODO: encoding?
};

Packet.prototype.isError = function() {
  // TODO: will be changed to buffer[4]
  return this.payload[0] == 0xff;
};

Packet.prototype.asError = function() {
  this.offset = 1;
  var code = this.readInt8();
  var sqlState = this.readBuffer(7);
  var message = this.payload.slice(this.offset);
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
  this.payload.writeUInt32LE(n, this.offset);
  this.offset += 4;
};

Packet.prototype.writeInt24 = function(n) {
  this.writeInt8(n & 0xff);
  this.writeInt16(n >> 8);
};

Packet.prototype.writeInt16 = function(n) {
  this.payload.writeUInt16LE(n, this.offset);
  this.offset += 2;
};

Packet.prototype.writeInt8 = function(n) {
  this.payload[this.offset] = n;
  this.offset++;
};

Packet.prototype.writeBuffer = function(b) {
  b.copy(this.payload, this.offset);
  this.offset += b.length;
};

// TODO: refactor following three?
Packet.prototype.writeNullTerminatedString = function(s) {
  this.payload.write(s, this.offset);
  this.offset += s.length;
  this.writeInt8(0);
};

Packet.prototype.writeString = function(s) {
  var bytes = Buffer.byteLength(s, 'utf8');
  this.payload.write(s, this.offset, bytes, 'utf8');
  this.offset += bytes;
};

Packet.prototype.writeLengthCodedString = function(s) {
  this.writeLengthCodedNumber(s.length);
  this.payload.write(s, this.offset);
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
  this.writeInt24(this.payload.length - 4);
  this.writeInt8(this.sequenceId);
  this.offset = offset;
};

// TODO: base toPacket() ?

module.exports = Packet;
