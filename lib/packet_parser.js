var Packet   = require('./packets/packet');

// as this is very low level parser, EventEmitter is not used
// onPayload(sequenceId, payload) is called for each mysql packet
function PacketParser(onPacket)
{
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
  this.onPacket = onPacket;
}

PacketParser.prototype.execute = function(chunk, start, end) {
  //var length = end - start;
  //if (length == 0)
  //  return;
  var chunkOffset = start;
  while (chunkOffset < chunk.length) {
    if (this.state == 'head0' && (end - chunkOffset) > 3) {
      this.length = chunk[chunkOffset] + (chunk[chunkOffset+1] << 8) + (chunk[chunkOffset+2] << 16);
      this.sequenceId = chunk[chunkOffset+3];
      var packetLength = this.length + 4;
      if (end - chunkOffset > packetLength) { // more than one packet in chunk
        this.onPacket(new Packet(this.sequenceId, chunk, chunkOffset + 4, chunkOffset + packetLength));
        chunkOffset += packetLength;
      } else if (end - chunkOffset == packetLength) {
        return this.onPacket(new Packet(this.sequenceId, chunk, chunkOffset + 4, chunkOffset + packetLength));
      } else { // payload is incomplete
        this.buffer = [chunk.slice(chunkOffset + 4, end)];
        this.bufferLength = end - chunkOffset - 4;
        this.state = 'payload';
        return;
      }
    } else if (this.state == 'payload') {
      var remainingPayload = this.length - this.bufferLength;
      if (end - chunkOffset >= remainingPayload) { // last chunk for payload
        var payload = new Buffer(this.length);
        var offset = 0;
        for (var i=0; i < this.buffer.length; ++i) {
          this.buffer[i].copy(payload, offset);
          offset += this.buffer[i].length;
        }
        chunk.copy(payload, offset, chunkOffset, chunkOffset + remainingPayload);
        this.onPacket(new Packet(this.sequenceId, payload, 0, this.length));
        this.buffer = [];
        this.bufferLength = 0;
        chunkOffset += remainingPayload;
        this.state = 'head0';
      } else {
        this.buffer.push(chunk.slice(chunkOffset, end));
        this.bufferLength += end - chunkOffset;
        return;
      }
    } else { // length < 4 or state != header0
        if (end - chunkOffset + this.headerLen < 4) {
          chunk.copy(this.headerBuff, this.headerLen, chunkOffset, end);
          this.headerLen += end - chunkOffset;
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
