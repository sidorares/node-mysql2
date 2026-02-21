import { assert, describe, it } from 'poku';
import Packet from '../../../lib/packets/packet.js';

describe('writeLengthCodedNumber / readLengthCodedNumber roundtrip', () => {
  const roundtrip = (n: number): number | null => {
    const size = 4 + Packet.lengthCodedNumberLength(n);
    const buffer = Buffer.alloc(size);
    const packet = new Packet(0, buffer, 0, size);

    packet.writeLengthCodedNumber(n);
    packet.offset = 4;

    return packet.readLengthCodedNumber();
  };

  it('should roundtrip values in the 1-byte range', () => {
    assert.strictEqual(roundtrip(0), 0);
    assert.strictEqual(roundtrip(250), 250);
  });

  it('should roundtrip values in the 2-byte range (0xFC tag)', () => {
    assert.strictEqual(roundtrip(251), 251);
    assert.strictEqual(roundtrip(0xfffe), 0xfffe);
  });

  it('should roundtrip values in the 3-byte range (0xFD tag)', () => {
    assert.strictEqual(roundtrip(0xffff), 0xffff);
    assert.strictEqual(roundtrip(0xfffffe), 0xfffffe);
  });

  it('should roundtrip values >= 0xFFFFFF in the 8-byte range (0xFE tag)', () => {
    assert.strictEqual(roundtrip(0xffffff), 0xffffff);
    assert.strictEqual(roundtrip(0x2000000), 0x2000000); // 32MB: PR #3177
    assert.strictEqual(roundtrip(0xffffffff), 0xffffffff);
  });

  it('should roundtrip values above 32-bit range', () => {
    assert.strictEqual(roundtrip(0x100000001), 0x100000001);
    assert.strictEqual(roundtrip(0x1ffffffffff), 2199023255551);
  });
});
