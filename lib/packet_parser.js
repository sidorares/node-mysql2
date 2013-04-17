var Writable = require('stream').Writable || require('readable-stream').Writable;
var Packet   = require('./packets/packet');

// as this is very low level parser, EventEmitter is not used
// onPayload(sequenceId, payload) is called for each mysql packet
function PacketParser(onPayload)
{
  Writable.call(this);

  // array of last payload chunks
  // only used when corrent payload is not complete
  this.buffer = [];
  // total length of chunks on buffer
  this.bufferLength = 0;
  this.headerLen = 0;
  this.headerBuff = Buffer(4);

  this.state = 'head0';

  // expected payload length
  this.length = 0;
  this.sequenceId = 0;
  this.onPayload = onPayload;
}
PacketParser.prototype = Object.create(
  Writable.prototype, { constructor: { value: PacketParser }});


PacketParser.prototype._write = function(chunk, encoding, callback) {
  //console.log('>>> ', chunk);
  //console.log('>>> ', [chunk.toString()]);
  //var p = new Packet(0, chunk);
  //console.log('==== WRITE ===', chunk.length, this.state);
  //console.log(chunk);
  var chunkOffset = 0;
  while (chunkOffset < chunk.length) {
    //console.log("===================", chunk.length, chunkOffset, this.state);
    //console.log(chunk.slice(chunkOffset));
    if (this.state == 'head0' && (chunk.length - chunkOffset) > 3) {
      this.length = chunk[chunkOffset] + (chunk[chunkOffset+1] << 8) + (chunk[chunkOffset+2] << 16);
      this.sequenceId = chunk[chunkOffset+3];
      var packetLength = this.length + 4;
      // TODO: second case seems to be most important
      // for example, short select with one row result in 6 packets in one chunk
      // worth to swap first nd second
      if (chunk.length - chunkOffset == packetLength) {
        this.onPayload(new Packet(this.sequenceId, chunk.slice(chunkOffset + 4)));
        return;
      } else if (chunk.length - chunkOffset > packetLength) { // more than one packet in chunk
        this.onPayload(new Packet(this.sequenceId, chunk.slice(chunkOffset + 4, chunkOffset + packetLength)));
        chunkOffset += packetLength;
      } else { // payload is incomplete
        this.buffer = [chunk.slice(chunkOffset + 4)];
        this.bufferLength = chunk.length - chunkOffset - 4;
        this.state = 'payload';
        return;
      }
    } else if (this.state == 'payload') {
      var remainingPayload = this.length - this.bufferLength;
      if (chunk.length - chunkOffset >= remainingPayload) { // last chunk for payload
        var payload = new Buffer(this.length);
        var offset = 0;
        for (var i=0; i < this.buffer.length; ++i) {
          this.buffer[i].copy(payload, offset);
          offset += this.buffer[i].length;
        }
        chunk.copy(payload, offset, chunkOffset, chunkOffset + remainingPayload);
        this.onPayload(new Packet(this.sequenceId, payload));
        this.buffer = [];
        this.bufferLength = 0;
        chunkOffset += remainingPayload;
        this.state = 'head0';
      } else {
        this.buffer.push(chunk.slice(chunkOffset));
        this.bufferLength += chunk.length - chunkOffset;
        return;
      }
    } else { // length < 4 or state != header0
        if (chunk.length - chunkOffset + this.headerLen < 4) {
          chunk.copy(this.headerBuff, this.headerLen, chunkOffset);
          this.headerLen += chunk.length - chunkOffset;
          this.state = 'head_';
          return;
        }
        chunk.copy(this.headerBuff, this.headerLen, chunkOffset, chunkOffset + 4 - this.headerLen);
        chunkOffset += 4 - this.headerLen;
        this.length = this.headerBuff[0] + (this.headerBuff[1] << 8) + (this.headerBuff[2] << 16);
        this.headerLen = 0;
        this.state = 'payload';
    }
  }

  if (callback)
    callback();
};

module.exports = PacketParser;
