import { describe, it, strict } from 'poku';
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
    strict.strictEqual(roundtrip(0), 0);
    strict.strictEqual(roundtrip(250), 250);
  });

  it('should roundtrip values in the 2-byte range (0xFC tag)', () => {
    strict.strictEqual(roundtrip(251), 251);
    strict.strictEqual(roundtrip(0xfffe), 0xfffe);
  });

  it('should roundtrip values in the 3-byte range (0xFD tag)', () => {
    strict.strictEqual(roundtrip(0xffff), 0xffff);
    strict.strictEqual(roundtrip(0xfffffe), 0xfffffe);
  });

  it('should roundtrip values >= 0xFFFFFF in the 8-byte range (0xFE tag)', () => {
    strict.strictEqual(roundtrip(0xffffff), 0xffffff);
    strict.strictEqual(roundtrip(0x2000000), 0x2000000); // 32MB: PR #3177
    strict.strictEqual(roundtrip(0xffffffff), 0xffffffff);
  });

  it('should roundtrip values above 32-bit range', () => {
    strict.strictEqual(roundtrip(0x100000001), 0x100000001);
    strict.strictEqual(roundtrip(0x1ffffffffff), 2199023255551);
  });
});

describe('lengthCodedNumberLength matches the bytes writeLengthCodedNumber emits', () => {
  const writtenBytes = (n: number): number => {
    const buffer = Buffer.alloc(16);
    const packet = new Packet(0, buffer, 0, buffer.length);
    packet.offset = 0;
    packet.writeLengthCodedNumber(n);
    return packet.offset;
  };

  it('1-byte range', () => {
    strict.strictEqual(Packet.lengthCodedNumberLength(250), writtenBytes(250));
  });

  it('3-byte range (0xFC tag)', () => {
    strict.strictEqual(
      Packet.lengthCodedNumberLength(0xfffe),
      writtenBytes(0xfffe)
    );
  });

  it('4-byte range (0xFD tag)', () => {
    strict.strictEqual(
      Packet.lengthCodedNumberLength(0xffff),
      writtenBytes(0xffff)
    );
    strict.strictEqual(
      Packet.lengthCodedNumberLength(0xfffffe),
      writtenBytes(0xfffffe)
    );
  });

  it('9-byte range (0xFE tag)', () => {
    strict.strictEqual(
      Packet.lengthCodedNumberLength(0xffffff),
      writtenBytes(0xffffff)
    );
  });
});
