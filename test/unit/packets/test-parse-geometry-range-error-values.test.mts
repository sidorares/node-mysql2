import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';

/** [4-byte header] [1-byte length-coded-number] [geometry payload] */
const buildGeometryPacket = (
  geometryPayload: Buffer
): { buffer: Buffer; start: number; end: number } => {
  const payloadLen = geometryPayload.length;
  if (payloadLen >= 251)
    throw new Error('Use multi-byte length encoding for large payloads');

  const header = Buffer.alloc(4, 0);
  const lenByte = Buffer.from([payloadLen]);
  const buffer = Buffer.concat([header, lenByte, geometryPayload]);

  return { buffer, start: 0, end: buffer.length };
};

/** [4-byte SRID] [1-byte byteOrder] [4-byte wkbType] [type-specific data] */
const buildWKBLineString = (
  numPoints: number,
  actualPointData: Buffer
): Buffer => {
  const srid = Buffer.alloc(4, 0);
  const byteOrder = Buffer.from([0x01]);

  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(2);

  const numPointsBuf = Buffer.alloc(4);
  numPointsBuf.writeUInt32LE(numPoints);

  return Buffer.concat([
    srid,
    byteOrder,
    wkbType,
    numPointsBuf,
    actualPointData,
  ]);
};

/** [4-byte SRID] [1-byte byteOrder] [4-byte wkbType] [4-byte numRings] [rings data] */
const buildWKBPolygon = (numRings: number, ringsData: Buffer): Buffer => {
  const srid = Buffer.alloc(4, 0);
  const byteOrder = Buffer.from([0x01]);

  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(3);

  const numRingsBuf = Buffer.alloc(4);
  numRingsBuf.writeUInt32LE(numRings);

  return Buffer.concat([srid, byteOrder, wkbType, numRingsBuf, ringsData]);
};

/** [4-byte SRID] [1-byte byteOrder] [4-byte wkbType] [point data] */
const buildWKBPoint = (pointData: Buffer): Buffer => {
  const srid = Buffer.alloc(4, 0);
  const byteOrder = Buffer.from([0x01]);

  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(1);

  return Buffer.concat([srid, byteOrder, wkbType, pointData]);
};

/** [4-byte SRID] [1-byte byteOrder] [4-byte wkbType] [4-byte num] [geometries data] */
const buildWKBMultiPoint = (
  numGeometries: number,
  geometriesData: Buffer
): Buffer => {
  const srid = Buffer.alloc(4, 0);
  const byteOrder = Buffer.from([0x01]);

  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(4);

  const numBuf = Buffer.alloc(4);
  numBuf.writeUInt32LE(numGeometries);

  return Buffer.concat([srid, byteOrder, wkbType, numBuf, geometriesData]);
};

/* [4-byte SRID] [1-byte byteOrder] [4-byte wkbType] (no type-specific data) */
const buildWKBHeaderOnly = (wkbTypeId: number): Buffer => {
  const srid = Buffer.alloc(4, 0);
  const byteOrder = Buffer.from([0x01]);

  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(wkbTypeId);

  return Buffer.concat([srid, byteOrder, wkbType]);
};

describe('parseGeometryValue: Malformed Payload Handling', () => {
  it('should return null for truncated WKB header', () => {
    const payload = Buffer.alloc(4, 0);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.strictEqual(packet.parseGeometryValue(), null);
  });

  it('should not throw RangeError for WKBPoint with truncated coordinates', () => {
    const payload = buildWKBPoint(Buffer.alloc(4, 0));
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.doesNotThrow(() => {
      packet.parseGeometryValue();
    });
  });

  it('should not throw RangeError for WKBLineString with inflated numPoints', () => {
    const payload = buildWKBLineString(1000, Buffer.alloc(0));
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.doesNotThrow(() => {
      packet.parseGeometryValue();
    });
  });

  it('should not throw RangeError for WKBLineString with partial point data', () => {
    const payload = buildWKBLineString(2, Buffer.alloc(10, 0));
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.doesNotThrow(() => {
      packet.parseGeometryValue();
    });
  });

  it('should not throw RangeError for WKBPolygon with inflated numRings', () => {
    const payload = buildWKBPolygon(1000, Buffer.alloc(0));
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.doesNotThrow(() => {
      packet.parseGeometryValue();
    });
  });

  it('should not throw RangeError for WKBPolygon with partial ring data', () => {
    const numPointsBuf = Buffer.alloc(4);
    numPointsBuf.writeUInt32LE(100);

    const payload = buildWKBPolygon(1, numPointsBuf);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.doesNotThrow(() => {
      packet.parseGeometryValue();
    });
  });

  it('should not throw RangeError for WKBMultiPoint with inflated count', () => {
    const payload = buildWKBMultiPoint(1000, Buffer.alloc(0));
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.doesNotThrow(() => {
      packet.parseGeometryValue();
    });
  });

  it('should return null for WKBLineString with no count bytes', () => {
    const payload = buildWKBHeaderOnly(2);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.strictEqual(packet.parseGeometryValue(), null);
  });

  it('should return null for WKBPolygon with no count bytes', () => {
    const payload = buildWKBHeaderOnly(3);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.strictEqual(packet.parseGeometryValue(), null);
  });

  it('should return null for WKBMultiPoint with no count bytes', () => {
    const payload = buildWKBHeaderOnly(4);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);

    strict.strictEqual(packet.parseGeometryValue(), null);
  });

  it('should return valid result for well-formed WKBLineString', () => {
    const pointData = Buffer.alloc(16);
    pointData.writeDoubleLE(1.0, 0);
    pointData.writeDoubleLE(2.0, 8);

    const payload = buildWKBLineString(1, pointData);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue();

    strict.ok(Array.isArray(result));
    strict.strictEqual(result.length, 1);
    strict.strictEqual(result[0].x, 1.0);
    strict.strictEqual(result[0].y, 2.0);
  });
});
