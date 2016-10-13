// TODO: rename to OK packet
// https://dev.mysql.com/doc/internals/en/packet-OK_Packet.html

var Buffer = require('safe-buffer').Buffer;

var Packet = require('./packet.js');
var ClientConstants = require('../constants/client.js');
var ServerSatusFlags = require('../constants/server_status.js');

var EncodingToCharset = require('../constants/encoding_charset.js');

var SessionChangeTypeToName = ['systemVariables', 'schema', 'status', 'gtids'];

function ResultSetHeader (packet, connection)
{
  var bigNumberStrings = connection.config.bigNumberStrings;
  var encoding = connection.serverEncoding;

  var flags = connection._handshakePacket.capabilityFlags;

  var isSet = function (flag) {
    return flags & ClientConstants[flag];
  };

  if (packet.buffer[packet.offset] !== 0) {
    this.fieldCount = packet.readLengthCodedNumber();
    if (this.fieldCount === null) {
      this.infileName = packet.readString(undefined, encoding);
    }
    return;
  }

  this.fieldCount = packet.readInt8(); // skip OK byte
  this.affectedRows = packet.readLengthCodedNumber(bigNumberStrings);
  this.insertId = packet.readLengthCodedNumberSigned(bigNumberStrings);
  this.info = '';


  if (isSet('PROTOCOL_41')) {
    this.serverStatus = packet.readInt16();
    this.warningStatus = packet.readInt16();
  } else if (isSet('TRANSACTIONS')) {
    this.serverStatus = packet.readInt16();
  }

  var stateChanges = null;
  if (isSet('SESSION_TRACK') && packet.offset < packet.end) {
    this.info = packet.readLengthCodedString(encoding);
    if (this.serverStatus && ServerSatusFlags.SERVER_SESSION_STATE_CHANGED) {

      // session change info record - see
      // https://dev.mysql.com/doc/internals/en/packet-OK_Packet.html#cs-sect-packet-ok-sessioninfo

      var len = packet.offset < packet.end ? packet.readLengthCodedNumber() : 0;
      var end = packet.offset + len;
      var type, len, key, stateEnd;

      if (len > 0) {
        stateChanges = {
          systemVariables: {},
          schema: null,
          // gtids: {},
          trackStateChange: null
        };
      }

      while (packet.offset < end) {
        type = packet.readInt8();
        len = packet.readLengthCodedNumber();
        stateEnd = packet.offset + len;
        key = packet.readLengthCodedString(encoding);
        if (type === 0) {
          var val = packet.readLengthCodedString(encoding);
          stateChanges.systemVariables[key] = val;
          if (key == 'character_set_client') {
            var charsetNumber = EncodingToCharset[val];
            connection.config.charsetNumber = charsetNumber;
          }
        } else if (type === 1) {
          // TODO double check it's supposed to be the only value, not a list.
          stateChanges.schema = key;
        } else if (type === 2) {
          stateChanges.trackStateChange = packet.readLengthCodedString(encoding);
        } else {
          // GTIDs (type == 3) or unknown type - just skip for now
        }
        packet.offset = stateEnd;
      }
    }
  } else {
    this.info = packet.readString(undefined, encoding);
  }

  if (stateChanges) {
    this.stateChanges = stateChanges;
  }

  var m = this.info.match(/\schanged:\s*(\d+)/i);
  if (m !== null) {
    this.changedRows = parseInt(m[1], 10);
  }
}

// TODO: should be consistent instance member, but it's just easier here to have just function
ResultSetHeader.toPacket = function (fieldCount, insertId, sequenceId) {
  var length = 4 + Packet.lengthCodedNumberLength(fieldCount);
  if (typeof (insertId) != 'undefined') {
    length += Packet.lengthCodedNumberLength(insertId);
  }
  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeLengthCodedNumber(fieldCount);
  if (typeof (insertId) != 'undefined') {
    packet.writeLengthCodedNumber(insertId);
  }
  return packet;
};

module.exports = ResultSetHeader;
