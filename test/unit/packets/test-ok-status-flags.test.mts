import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packets from '../../../lib/packets/index.js';

describe('OK packet status flags', () => {
  it('should read the status flags after multi-byte affected rows and insert id', () => {
    const packet = Packets.OK.toPacket({
      affectedRows: 300,
      insertId: 70000,
      serverStatus: 514,
    });

    packet.offset = 4;
    const statusFlags = packet.okStatusFlags();

    strict.equal(statusFlags, 514);
    strict.equal(packet.offset, 4);
  });

  it('should return undefined for a packet that ends before its status flags', () => {
    const header = [0, 0, 0, 0];
    const truncated = new Packets.Packet(
      0,
      Buffer.from([...header, 0x00, 0x00, 0x00, 0x02]),
      0,
      8
    );
    const followedByAnotherPacket = new Packets.Packet(
      0,
      Buffer.from([...header, 0x00, 0x00, 0x00, 0x02, 0x02, 0x00]),
      0,
      8
    );
    const lengthPastTheEnd = new Packets.Packet(
      0,
      Buffer.from([...header, 0x00, 0xfe]),
      0,
      6
    );

    strict.equal(truncated.okStatusFlags(), undefined);
    strict.equal(followedByAnotherPacket.okStatusFlags(), undefined);
    strict.equal(lengthPastTheEnd.okStatusFlags(), undefined);
  });
});
