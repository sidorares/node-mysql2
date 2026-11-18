import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packets from '../../../lib/packets/index.js';

describe('Time packet parsing', () => {
  const testCases = [
    ['01:23:45', '0b000004000008000000000001172d'], // CONVERT('01:23:45', TIME)
    ['01:23:45.123456', '0f00000400000c000000000001172d40e20100'], // DATE_ADD(CONVERT('01:23:45', TIME), INTERVAL 0.123456 SECOND)
    ['-01:23:44.876544', '0f00000400000c010000000001172c00600d00'], // DATE_ADD(CONVERT('-01:23:45', TIME), INTERVAL 0.123456 SECOND)
    ['-81:23:44.876544', '0f00000400000c010300000009172c00600d00'], // DATE_ADD(CONVERT('-81:23:45', TIME), INTERVAL 0.123456 SECOND)
    ['81:23:45', '0b000004000008000300000009172d'], // CONVERT('81:23:45', TIME)
    ['123:23:45.123456', '0f00000400000c000500000003172d40e20100'], // DATE_ADD(CONVERT('123:23:45', TIME), INTERVAL 0.123456 SECOND)
    ['-121:23:45', '0b000004000008010500000001172d'], // CONVERT('-121:23:45', TIME)
    ['-01:23:44.88', '0f00000400000c010000000001172c806d0d00'], //DATE_ADD(CONVERT('-01:23:45', TIME), INTERVAL 0.12 SECOND)
    ['01:23:45.05', '0f00000400000c000000000001172d50c30000'], // DATE_ADD(CONVERT('01:23:45', TIME), INTERVAL 0.05 SECOND)
    ['01:23:45.001', '0f00000400000c000000000001172de8030000'], // DATE_ADD(CONVERT('01:23:45', TIME), INTERVAL 0.001 SECOND)
    ['-01:23:45.000123', '0f00000400000c010000000001172d7b000000'], // CONVERT('-01:23:45.000123', TIME(6))
    ['123:23:45.000001', '0f00000400000c000500000003172d01000000'], // CONVERT('123:23:45.000001', TIME(6))
    ['01:23:45.4294967295', '0f00000400000c000000000001172dffffffff'], // microseconds only a hostile server sends, up to the largest 32-bit value
    ['01:23:45.1', '0f00000400000c000000000001172d00ca9a3b'],
    ['01:23:45.1000000001', '0f00000400000c000000000001172d01ca9a3b'],
  ] as const;

  for (const [expected, buffer] of testCases) {
    it(`should parse time string ${expected}`, () => {
      const buf = Buffer.from(buffer, 'hex');
      const packet = new Packets.Packet(4, buf, 0, buf.length);
      packet.readInt16(); // unused
      const d = packet.readTimeString(false);
      strict.equal(d, expected);
    });
  }
});

describe('Time packet parsing to the column fraction digits', () => {
  const testCases = [
    ['01:23:45.000', 3, '0b000004000008000000000001172d'], // CONVERT('01:23:45', TIME(3))
    ['01:23:45.050', 3, '0f00000400000c000000000001172d50c30000'], // CONVERT('01:23:45.05', TIME(3))
    ['-01:23:44.880', 3, '0f00000400000c010000000001172c806d0d00'], // CONVERT('-01:23:44.88', TIME(3))
    ['01:23:45.001000', 6, '0f00000400000c000000000001172de8030000'], // CONVERT('01:23:45.001', TIME(6))
    ['-121:23:45.0', 1, '0b000004000008010500000001172d'], // CONVERT('-121:23:45', TIME(1))
    ['01:23:45', 0, '0b000004000008000000000001172d'], // CONVERT('01:23:45', TIME)
    ['00:00:00.00', 2, '03000004000000'], // CONVERT('00:00:00', TIME(2))
    ['01:23:45.05', 31, '0f00000400000c000000000001172d50c30000'], // an expression with no fixed fraction digits
  ] as const;

  for (const [expected, decimals, buffer] of testCases) {
    it(`should parse time string ${expected} with ${decimals} fraction digits`, () => {
      const buf = Buffer.from(buffer, 'hex');
      const packet = new Packets.Packet(4, buf, 0, buf.length);
      packet.readInt16(); // unused
      const d = packet.readTimeString(false, decimals);
      strict.equal(d, expected);
    });
  }
});
