import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packets from '../../../lib/packets/index.js';

describe('DateTime packet parsing', () => {
  it('should parse a simple datetime packet', () => {
    const buf = Buffer.from('0a000004000007dd070116010203', 'hex');

    const packet = new Packets.Packet(4, buf, 0, buf.length);
    packet.readInt16(); // unused
    const d = packet.readDateTime('Z');
    if (d === null) throw new Error('expected d to be non-null');
    strict.equal(+d, 1358816523000);
  });

  it('should parse a datetime packet with mixed string fields', () => {
    const buf = Buffer.from(
      '18000006000004666f6f310be00702090f01095d7f06000462617231',
      'hex'
    );
    const packet = new Packets.Packet(6, buf, 0, buf.length);

    packet.readInt16(); // ignore
    const s = packet.readLengthCodedString('cesu8');
    strict.equal(s, 'foo1');
    const d = packet.readDateTime('Z');
    if (d === null) throw new Error('expected d to be non-null');
    strict.equal(+d, 1455030069425);

    const s1 = packet.readLengthCodedString('cesu8');
    strict.equal(s1, 'bar1');
    strict.equal(packet.offset, packet.end);
  });
});

describe('DateTime packet parsing as a string', () => {
  const Types = { DATE: 10, DATETIME: 12 };
  const packetFor = (bytes: number[]) => {
    const buf = Buffer.concat([Buffer.alloc(4), Buffer.from(bytes)]);
    return new Packets.Packet(0, buf, 0, buf.length);
  };
  const microseconds = (value: number) => {
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(value);
    return [...bytes];
  };
  const cases: [string, number[], number, string | null, number][] = [
    ['2026-03-08', [4, 0xea, 0x07, 3, 8], 0, ' ', Types.DATE],
    [
      '2026-03-08T09:31:05',
      [7, 0xea, 0x07, 3, 8, 9, 31, 5],
      0,
      'T',
      Types.DATETIME,
    ],
    [
      '2026-03-08 09:31:05.250',
      [11, 0xea, 0x07, 3, 8, 9, 31, 5, ...microseconds(250000)],
      3,
      ' ',
      Types.DATETIME,
    ],
    ['0007-01-02 03:04:05', [7, 7, 0, 1, 2, 3, 4, 5], 0, null, Types.DATETIME],
    [
      '2026-150-08 09:31:05',
      [7, 0xea, 0x07, 150, 8, 9, 31, 5],
      0,
      ' ',
      Types.DATETIME,
    ],
  ];

  for (const [expected, bytes, decimals, timeSep, columnType] of cases) {
    it(`should read ${expected}`, () => {
      strict.equal(
        packetFor(bytes).readDateTimeString(decimals, timeSep, columnType),
        expected
      );
    });
  }
});
