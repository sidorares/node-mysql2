import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';

function packetFor(value: bigint) {
  const buf = Buffer.alloc(12);
  buf.writeBigUInt64LE(BigInt.asUintN(64, value), 4);
  return new Packet(0, buf, 0, buf.length);
}

const unsignedValues = [
  0n,
  1n,
  255n,
  2n ** 32n - 1n,
  2n ** 32n,
  2n ** 53n - 1n, // MAX_SAFE_INTEGER
  2n ** 53n + 1n, // first unsafe integer
  2n ** 63n,
  2n ** 64n - 1n,
];

const signedValues = [
  0n,
  1n,
  -1n,
  2n ** 53n - 1n,
  -(2n ** 53n) + 1n, // MIN_SAFE_INTEGER
  2n ** 53n + 1n,
  -(2n ** 53n) - 1n,
  2n ** 63n - 1n,
  -(2n ** 63n),
];

describe('Packet int64 readers', () => {
  it('readInt64 returns numbers for safe integers and strings beyond', () => {
    for (const value of unsignedValues) {
      const result = packetFor(value).readInt64();
      if (Number.isSafeInteger(Number(value))) {
        strict.equal(result, Number(value), `readInt64(${value})`);
      } else {
        strict.equal(result, value.toString(), `readInt64(${value})`);
      }
    }
  });

  it('readSInt64 returns numbers for safe integers and strings beyond', () => {
    for (const value of signedValues) {
      const result = packetFor(value).readSInt64();
      if (Number.isSafeInteger(Number(value))) {
        strict.equal(result, Number(value), `readSInt64(${value})`);
      } else {
        strict.equal(result, value.toString(), `readSInt64(${value})`);
      }
    }
  });

  it('readInt64JSNumber matches Number(bigint) for all magnitudes', () => {
    for (const value of unsignedValues) {
      strict.equal(
        packetFor(value).readInt64JSNumber(),
        Number(value),
        `readInt64JSNumber(${value})`
      );
    }
  });

  it('readSInt64JSNumber matches Number(bigint) for all magnitudes', () => {
    for (const value of signedValues) {
      strict.equal(
        packetFor(value).readSInt64JSNumber(),
        Number(value),
        `readSInt64JSNumber(${value})`
      );
    }
  });

  it('readInt64String and readSInt64String return exact decimal strings', () => {
    for (const value of unsignedValues) {
      strict.equal(packetFor(value).readInt64String(), value.toString());
    }
    for (const value of signedValues) {
      strict.equal(packetFor(value).readSInt64String(), value.toString());
    }
  });
});
