'use strict';

const { assert } = require('poku');
const Packet = require('../../../lib/packets/packet.js');
const ResultSetHeader = require('../../../lib/packets/resultset_header.js');
const clientConstants = require('../../../lib/constants/client.js');
const { Buffer } = require('node:buffer');

const mockConnection = {
  config: {},
  serverEncoding: 'utf8',
  _handshakePacket: {
    capabilityFlags:
      clientConstants.PROTOCOL_41 + clientConstants.SESSION_TRACK,
  },
};

const mkpacket = (str) => {
  const buf = Buffer.from(str.split(/[ \n]+/).join(''), 'hex');
  return new Packet(0, buf, 0, buf.length);
};

// regression examples from https://github.com/sidorares/node-mysql2/issues/989

assert.doesNotThrow(() => {
  const packet = mkpacket(
    `1b 00 00 01
           00
           01 fe 65 96 fc 02 00 00 00 00 03 40 00 00 00 0a 14 08 fe 60 63 9b 05 00 00 00
          `,
  );
  new ResultSetHeader(packet, mockConnection);
});

assert.doesNotThrow(() => {
  const packet = mkpacket(
    `13 00 00 01 00 01 00 02 40 00 00 00 0a 14 08 fe 18 25 e7 06 00 00 00`,
  );
  new ResultSetHeader(packet, mockConnection);
});
