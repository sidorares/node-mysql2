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
