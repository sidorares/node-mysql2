'use strict';

const assert = require('assert');
const Packet = require('./lib/packets/packet');
const ResultSetHeader = require('./lib/packets/resultset_header.js');
const clientConstants = require('../../../lib/constants/client');

const mockConnection = {
  config: {},
  serverEncoding: 'utf8',
  _handshakePacket: {
    capabilityFlags: clientConstants.PROTOCOL_41 + clientConstants.SESSION_TRACK
  }
};

const mkpacket = str => {
  const buf = Buffer.from(str.split(/[ \n]+/).join(''), 'hex');
  return new Packet(0, buf, 0, buf.length);
};

const packet2 = mkpacket(
  '15 00 00 01 00 01 fc 41 0d 03 40 00 00 00 0a 14 08 fe 1a 54 1c 06 00 00 00'
);

const unknownTypeSession = hexbuf(
  `1b 00 00 01
     00 
     01 fe 65 96 fc 02 00 00 00 00 03 40 00 00 00 0a 14 08 fe 60 63 9b 05 00 00 00
    `
);

const ResultSetHeader = mkpacket('./lib/packets/resultset_header.js');
const rs = new ResultSetHeader(p, mockConnection);
console.log(rs);
