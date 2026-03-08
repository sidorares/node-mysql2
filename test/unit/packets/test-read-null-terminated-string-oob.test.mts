import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';

describe('readNullTerminatedString: Logical Boundary Check', () => {
  it('should stop at null terminator within bounds', () => {
    const buffer = Buffer.from([
      0x00,
      0x00,
      0x00,
      0x00, // header
      0x68,
      0x65,
      0x6c,
      0x6c,
      0x6f, // "hello"
      0x00, // null terminator
    ]);
    const packet = new Packet(0, buffer, 0, buffer.length);
    const result = packet.readNullTerminatedString('utf8');

    strict.strictEqual(result, 'hello');
  });

  it('should not read beyond logical packet boundary (this.end)', () => {
    const buffer = Buffer.from([
      0x00,
      0x00,
      0x00,
      0x00, // header
      0x41,
      0x42, // "AB" — this packet
      0x58,
      0x59, // "XY" — adjacent packet data
      0x00, // null terminator outside boundary
    ]);
    const packetEnd = 6;
    const packet = new Packet(0, buffer, 0, packetEnd);
    const result = packet.readNullTerminatedString('utf8');

    strict.strictEqual(result, 'AB', 'should not leak adjacent packet data');
  });

  it('should return empty string when packet boundary is at offset', () => {
    const buffer = Buffer.from([
      0x00,
      0x00,
      0x00,
      0x00, // header
      0x41,
      0x42, // data outside boundary
    ]);
    const packetEnd = 4;
    const packet = new Packet(0, buffer, 0, packetEnd);
    const result = packet.readNullTerminatedString('utf8');

    strict.strictEqual(result, '', 'no data within packet boundary');
  });
});
