var Buffer = require('safe-buffer').Buffer;

// connection mixins
// implementation of http://dev.mysql.com/doc/internals/en/compression.html

var zlib = require('zlib');
var compressedPacketNum = 0;
var PacketParser = require('./packet_parser.js');

function enableCompression (connection) {
  connection._lastWrittenPacketId = 0;
  connection._lastReceivedPacketId = 0;

  connection._handleCompressedPacket = handleCompressedPacket;
  connection._inflatedPacketsParser = new PacketParser(function (p) {
    connection.handlePacket(p);
  }, 4);
  connection._inflatedPacketsParser._lastPacket = 0;
  connection.packetParser = new PacketParser(function (packet) {
    connection._handleCompressedPacket(packet);
  }, 7);
  connection.writePacket = writeCompressedPacket;

  var seqqueue = require('seq-queue');
  connection.inflateQueue = seqqueue.createQueue();
  connection.deflateQueue = seqqueue.createQueue();
}


function handleCompressedPacket (packet) {
  var connection = this;
  var compressedSequenceId = packet.sequenceId;
  var deflatedLength = packet.readInt24();

  var body = packet.readBuffer();
  if (deflatedLength !== 0) {
    connection.inflateQueue.push(function (task) {
      zlib.inflate(body, function (err, data) {
        if (err) {
          connection.emit('error', err);
          return;
        }
        connection._inflatedPacketsParser.execute(data);
        task.done();
      });
    });
  } else {
    connection.inflateQueue.push(function (task) {
      connection._inflatedPacketsParser.execute(body);
      task.done();
    });
  }
}

function writeCompressedPacket (packet) {
  var connection = this;
  var packetSequenceId = this.sequenceId;

  packet.writeHeader(this.sequenceId);
  if (this.config.debug) {
    console.log(this._internalId + ' ' + this.connectionId + ' <== ' + this._command._commandName + '#' + this._command.stateName() + '(' + [this.sequenceId, packet._name, packet.length()].join(',') + ')');
  }
  this.sequenceId++;
  if (this.sequenceId == 256) {
    this.sequenceId = 0;
  }

  var packetLen = packet.length();
  var compressHeader = Buffer.allocUnsafe(7);

  connection.deflateQueue.push(function (task) {
    zlib.deflate(packet.buffer, function (err, compressed) {
      var compressedLength = compressed.length;
      if (compressedLength > packetLen) {
        compressHeader.writeUInt8(compressedLength & 0xff, 0);
        compressHeader.writeUInt16LE(compressedLength >> 8, 1);
        compressHeader.writeUInt8(packetSequenceId, 3);
        compressHeader.writeUInt8(packetLen & 0xff, 4);
        compressHeader.writeUInt16LE(packetLen >> 8, 5);
        connection.write(compressHeader);
        connection.write(compressed);
      } else {
        compressedLength = packetLen;
        packetLen = 0;
        compressHeader.writeUInt8(compressedLength & 0xff, 0);
        compressHeader.writeUInt16LE(compressedLength >> 8, 1);
        compressHeader.writeUInt8(packetSequenceId, 3);
        compressHeader.writeUInt8(packetLen & 0xff, 4);
        compressHeader.writeUInt16LE(packetLen >> 8, 5);
        connection.write(compressHeader);
        connection.write(packet.buffer);
      }
      task.done();
    });
  });
}

module.exports = {
  enableCompression: enableCompression
};
