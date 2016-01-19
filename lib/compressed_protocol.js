// connection mixins
// implementation of http://dev.mysql.com/doc/internals/en/compression.html

var zlib = require('zlib');
var compressedPacketNum = 0;
var PacketParser = require('./packet_parser.js');

function checkOOOPackets() {
  var newOOO = [];
  var connection = this;
  this._outOfOrderPackets.forEach(function(p) {
    if (connection._inflatedPacketsParser._lastPacket + 1 === p[0]) {
      connection._inflatedPacketsParser.execute(p[1]);
      connection._inflatedPacketsParser._lastPacket = p[0];
    } else {
      newOOO.push(p);
    }
  });
  connection._outOfOrderPackets = newOOO;
};

function handleCompressedPacket(packet) {
  compressedPacketNum++;
  var connection = this;
  var compressedSequenceId = packet.sequenceId;
  var deflatedLength = packet.readInt24();

  var body = packet.readBuffer();
  if (deflatedLength !== 0) {
    var deflatedBody = zlib.inflateSync(body);
    connection._inflatedPacketsParser.execute(deflatedBody);

    // because zlib.inflate callback might be fired out of order we'll need to use some
    // sort of priority queue to keep correct order of executing packets
    // might not worth efforts ( but potentially beneficial on multi core )
    /*
    zlib.inflate(compressedBody, function(err, data) {
      //console.log('done inflate for ', compressedSequenceId)
      if (err)
        return connection.emit('error', err);

      //console.log(connection._inflatedPacketsParser._lastPacket, compressedPacketNum, data.length);

      if (connection._inflatedPacketsParser._lastPacket + 1 == compressedPacketNum) {
        connection._inflatedPacketsParser._lastPacket = compressedPacketNum;
        connection._inflatedPacketsParser.execute(data);
        if (connection._outOfOrderPackets.length > 0)
          connection._checkOOOPackets();
      } else {
        connection._outOfOrderPackets.push([compressedPacketNum, data]);
      }
    });
    */
  } else {
    connection._inflatedPacketsParser.execute(body);
  }
};

function enableCompression(connection) {
  connection._handleCompressedPacket = handleCompressedPacket;
  connection._inflatedPacketsParser = new PacketParser(function(p) {
    connection.handlePacket(p);
  }, 4);
  connection._inflatedPacketsParser._lastPacket = 0;
  connection.packetParser = new PacketParser(function(packet) {
    connection._handleCompressedPacket(packet);
  }, 7);
  connection.writePacket = writeCompressedPacket;
};

function writeCompressedPacket(packet) {
  var connection = this;
  var packetSequenceId = this.sequenceId;

  packet.writeHeader(this.sequenceId);
  if (this.config.debug) {
    console.log(this._internalId + ' ' + this.connectionId + ' <== ' + this._command._commandName + '#' + this._command.stateName() + '(' + [this.sequenceId, packet._name, packet.length()].join(',') + ')');
  }
  this.sequenceId++;
  if (this.sequenceId == 256)
    this.sequenceId = 0

  var packetLen = packet.length();
  var compressHeader = new Buffer(7);
  var compressed = zlib.deflateSync(packet.buffer);
  var compressedLength = compressed.length;
  // NB: to use async zlib.deflate there needs to be code added to prevent race conditions
  // e.i two writePacket calls can result in second connection.write(compressed) called before first
  //zlib.deflate(packet.buffer, function(err, compressed) {})...

  if (compressedLength > packetLen + 3) {
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
};

module.exports = {
  enableCompression: enableCompression
};
