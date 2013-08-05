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

  // node 0.11 has different ondata signature
  if (!start && !end) {
    start = 0;
    end = chunk.length;
  }

  while (start < chunk.length) {
    if (this.state == 'head0' && (end - start) > 3) {
      this.length = chunk[start] + (chunk[start+1] << 8) + (chunk[start+2] << 16);
      this.sequenceId = chunk[start+3];
      var packetLength = this.length + 4;
      if (end - start > packetLength) { // more than one packet in chunk
        this.onPacket(new Packet(this.sequenceId, chunk, start + 4, start + packetLength));
        start += packetLength;
      } else if (end - start == packetLength) {
        return this.onPacket(new Packet(this.sequenceId, chunk, start + 4, start + packetLength));
      } else { // payload is incomplete
        this.buffer = [chunk.slice(start + 4, end)];
        this.bufferLength = end - start - 4;
        this.state = 'payload';
        return;
      }
    } else if (this.state == 'payload') {
      var remainingPayload = this.length - this.bufferLength;
      if (end - start >= remainingPayload) { // last chunk for payload
        var payload = new Buffer(this.length);
        var offset = 0;
        for (var i=0; i < this.buffer.length; ++i) {
          this.buffer[i].copy(payload, offset);
          offset += this.buffer[i].length;
        }
        chunk.copy(payload, offset, start, start + remainingPayload);
        this.onPacket(new Packet(this.sequenceId, payload, 0, this.length));
        this.buffer = [];
        this.bufferLength = 0;
        start += remainingPayload;
        this.state = 'head0';
      } else {
        this.buffer.push(chunk.slice(start, end));
        this.bufferLength += end - start;
        return;
      }
    } else { // length < 4 or state != header0
        if (end - start + this.headerLen < 4) {
          chunk.copy(this.headerBuff, this.headerLen, start, end);
          this.headerLen += end - start;
          this.state = 'head_';
          return;
        }
        chunk.copy(this.headerBuff, this.headerLen, start, start + 4 - this.headerLen);
        start += 4 - this.headerLen;
        this.length = this.headerBuff[0] + (this.headerBuff[1] << 8) + (this.headerBuff[2] << 16);
        this.headerLen = 0;
        this.state = 'payload';
    }
  }
};

module.exports = PacketParser;
