import { Buffer } from 'node:buffer';
import { assert, describe, it } from 'poku';
import clientConstants from '../../../../lib/constants/client.js';
import Packet from '../../../../lib/packets/packet.js';
import ResultSetHeader from '../../../../lib/packets/resultset_header.js';

const mockConnection = {
  config: {},
  serverEncoding: 'utf8',
  _handshakePacket: {
    capabilityFlags:
      clientConstants.PROTOCOL_41 + clientConstants.SESSION_TRACK,
  },
};

const mkpacket = (str: string) => {
  const buf = Buffer.from(str.split(/[ \n]+/).join(''), 'hex');
  return new Packet(0, buf, 0, buf.length);
};

// regression examples from https://github.com/sidorares/node-mysql2/issues/989

describe('OK packet with session track', () => {
  it('should parse session track packet (regression #989, case 1)', () => {
    assert.doesNotThrow(() => {
      const packet = mkpacket(
        `1b 00 00 01
           00
           01 fe 65 96 fc 02 00 00 00 00 03 40 00 00 00 0a 14 08 fe 60 63 9b 05 00 00 00
          `
      );
      new ResultSetHeader(packet, mockConnection);
    });
  });

  it('should parse session track packet (regression #989, case 2)', () => {
    assert.doesNotThrow(() => {
      const packet = mkpacket(
        `13 00 00 01 00 01 00 02 40 00 00 00 0a 14 08 fe 18 25 e7 06 00 00 00`
      );
      new ResultSetHeader(packet, mockConnection);
    });
  });
});
