import { assert, describe, it } from 'poku';
import Packets from '../../../../lib/packets/index.js';

describe('OK packet with auto-increment', () => {
  it('should have correct length for 0 affectedRows and minimal insertId', () => {
    const packet = Packets.OK.toPacket({ affectedRows: 0, insertId: 1 });

    // 5 bytes for an OK packet, plus one byte to store affectedRows plus one byte to store the insertId
    assert.equal(
      packet.length(),
      11,
      `${
        'OK packets with 0 affectedRows and a minimal insertId should be ' +
        '11 bytes long, got '
      }${packet.length()} byte(s)`
    );
  });
});
