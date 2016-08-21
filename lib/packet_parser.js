var Buffer = require('safe-buffer').Buffer;
var Packet = require('./packets/packet.js');

function PacketParser (onPacket, packetHeaderLength)
{
  // 4 for normal packets, 7 for comprssed protocol packets
  if (typeof packetHeaderLength == 'undefined') {
    packetHeaderLength = 4;
  }
  // array of last payload chunks
  // only used when current payload is not complete
  this.buffer = [];
  // total length of chunks on buffer
  this.bufferLength = 0;
  this.packetHeaderLength = packetHeaderLength;

  // incomplete header state: number of header bytes received
  this.headerLen = 0;

  // expected payload length
  this.length = 0;

  this.onPacket = onPacket;
  this.execute = PacketParser.prototype.executeStart;
}

function readPacketLength (b, off) {
  var b0 = b[off];
  var b1 = b[off + 1];
  var b2 = b[off + 2];
  if (b1 + b2 === 0) {
    return b0;
  }
  return b0 + (b1 << 8) + (b2 << 16);
}

//
PacketParser.prototype.executeStart = function executeStart (chunk) {
  var start = 0;
  var end = chunk.length;

  while (end - start >= 3) {
    this.length = readPacketLength(chunk, start);
    if (end - start >= this.length + this.packetHeaderLength) { // at least one full packet
      this.onPacket(new Packet(chunk[start + 3], chunk, start, start + this.packetHeaderLength + this.length));
      start += this.packetHeaderLength + this.length;
    } else { // payload is incomplete
      this.buffer = [chunk.slice(start + 3, end)];
      this.bufferLength = end - start - 3;
      this.execute = PacketParser.prototype.executePayload;
      return;
    }
  }
  if (end - start > 0) { // there is start of length header, but it's not full 3 bytes
    this.headerLen = end - start; // 1 or 2 bytes
    this.length = chunk[start];
    if (this.headerLen == 2) {
      this.length = chunk[start] + (chunk[start + 1] << 8);
      this.execute = PacketParser.prototype.executeHeader3;
    } else {
      this.execute = PacketParser.prototype.executeHeader2;
    }
  }
};

PacketParser.prototype.executePayload = function executePayload (chunk) {

  var start = 0;
  var end = chunk.length;
  var remainingPayload = this.length - this.bufferLength + this.packetHeaderLength - 3;

  if (end - start >= remainingPayload) { // last chunk for payload
    var payload = Buffer.allocUnsafe(this.length + this.packetHeaderLength);
    var offset = 3;
    for (var i = 0; i < this.buffer.length; ++i) {
      this.buffer[i].copy(payload, offset);
      offset += this.buffer[i].length;
    }
    chunk.copy(payload, offset, start, start + remainingPayload);
    this.onPacket(new Packet(payload[3], payload, 0, this.length + this.packetHeaderLength));
    this.buffer = [];
    this.bufferLength = 0;
    this.execute = PacketParser.prototype.executeStart;
    start += remainingPayload;
    if (end - start > 0) {
      return this.execute(chunk.slice(start, end));
    }
  } else {
    this.buffer.push(chunk);
    this.bufferLength += chunk.length;
  }
};

PacketParser.prototype.executeHeader2 = function executeHeader2 (chunk) {
  this.length += chunk[0] << 8;
  if (chunk.length > 1) {
    this.length += chunk[1] << 16;
    this.execute = PacketParser.prototype.executePayload;
    return this.executePayload(chunk.slice(2));
  } else {
    this.execute = PacketParser.prototype.executeHeader3;
  }
};

PacketParser.prototype.executeHeader3 = function executeHeader3 (chunk) {
  this.length += chunk[0] << 16;
  this.execute = PacketParser.prototype.executePayload;
  return this.executePayload(chunk.slice(1));
};

module.exports = PacketParser;
