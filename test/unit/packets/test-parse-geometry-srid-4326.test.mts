import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';

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

const buildWKBPoint = (srid: number, x: number, y: number): Buffer => {
  const sridBuf = Buffer.alloc(4);
  sridBuf.writeUInt32LE(srid);
  const byteOrder = Buffer.from([0x01]);
  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(1);
  const coords = Buffer.alloc(16);
  coords.writeDoubleLE(x, 0);
  coords.writeDoubleLE(y, 8);
  return Buffer.concat([sridBuf, byteOrder, wkbType, coords]);
};

const buildWKBLineString = (
  srid: number,
  points: Array<{ x: number; y: number }>
): Buffer => {
  const sridBuf = Buffer.alloc(4);
  sridBuf.writeUInt32LE(srid);
  const byteOrder = Buffer.from([0x01]);
  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(2);
  const numPointsBuf = Buffer.alloc(4);
  numPointsBuf.writeUInt32LE(points.length);
  const coords = Buffer.alloc(16 * points.length);
  points.forEach((p, i) => {
    coords.writeDoubleLE(p.x, i * 16);
    coords.writeDoubleLE(p.y, i * 16 + 8);
  });
  return Buffer.concat([sridBuf, byteOrder, wkbType, numPointsBuf, coords]);
};

const buildWKBPolygon = (
  srid: number,
  rings: Array<Array<{ x: number; y: number }>>
): Buffer => {
  const sridBuf = Buffer.alloc(4);
  sridBuf.writeUInt32LE(srid);
  const byteOrder = Buffer.from([0x01]);
  const wkbType = Buffer.alloc(4);
  wkbType.writeUInt32LE(3);
  const numRingsBuf = Buffer.alloc(4);
  numRingsBuf.writeUInt32LE(rings.length);
  const parts: Buffer[] = [sridBuf, byteOrder, wkbType, numRingsBuf];
  rings.forEach((ring) => {
    const numPointsBuf = Buffer.alloc(4);
    numPointsBuf.writeUInt32LE(ring.length);
    const coords = Buffer.alloc(16 * ring.length);
    ring.forEach((p, i) => {
      coords.writeDoubleLE(p.x, i * 16);
      coords.writeDoubleLE(p.y, i * 16 + 8);
    });
    parts.push(numPointsBuf, coords);
  });
  return Buffer.concat(parts);
};

const parsePoint = (
  srid: number,
  xWire: number,
  yWire: number,
  swap: boolean | number[] | undefined
): { x: number; y: number } => {
  const payload = buildWKBPoint(srid, xWire, yWire);
  const { buffer, start, end } = buildGeometryPacket(payload);
  const packet = new Packet(0, buffer, start, end);
  return packet.parseGeometryValue(swap);
};

describe('parseGeometryValue: opt-in geographic axis swap (fixes #2959)', () => {
  it('keeps wire order by default for SRID 4326 (safe for 5.7/MariaDB)', () => {
    const result = parsePoint(4326, 117.3461733, -33.3109317, undefined);

    strict.strictEqual(result.x, 117.3461733);
    strict.strictEqual(result.y, -33.3109317);
  });

  it('swaps SRID 4326 point with swap=true to match ST_X/ST_Y', () => {
    const result = parsePoint(4326, 117.3461733, -33.3109317, true);

    strict.strictEqual(result.x, -33.3109317);
    strict.strictEqual(result.y, 117.3461733);
  });

  it('swaps SRID 4269 point with swap=true', () => {
    const result = parsePoint(4269, 101.3461733, -35.3109317, true);

    strict.strictEqual(result.x, -35.3109317);
    strict.strictEqual(result.y, 101.3461733);
  });

  it('does not swap SRID 0, 3006 or 7084 with swap=true', () => {
    const zero = parsePoint(0, -35.3109317, 101.3461733, true);
    strict.strictEqual(zero.x, -35.3109317);
    strict.strictEqual(zero.y, 101.3461733);

    const projected = parsePoint(3006, 1.0, 2.0, true);
    strict.strictEqual(projected.x, 1.0);
    strict.strictEqual(projected.y, 2.0);

    const longLat = parsePoint(7084, 1.0, 2.0, true);
    strict.strictEqual(longLat.x, 1.0);
    strict.strictEqual(longLat.y, 2.0);
  });

  it('swaps only listed SRIDs with swap=[4326]', () => {
    const swapped = parsePoint(4326, 117.3461733, -33.3109317, [4326]);
    strict.strictEqual(swapped.x, -33.3109317);
    strict.strictEqual(swapped.y, 117.3461733);

    const untouched = parsePoint(4269, 101.3461733, -35.3109317, [4326]);
    strict.strictEqual(untouched.x, 101.3461733);
    strict.strictEqual(untouched.y, -35.3109317);
  });

  it('swaps a custom long-lat SRS with swap=[custom]', () => {
    const result = parsePoint(9999, 10.0, 20.0, [9999]);

    strict.strictEqual(result.x, 20.0);
    strict.strictEqual(result.y, 10.0);
  });

  it('swaps each point in SRID 4326 linestring with swap=true', () => {
    const payload = buildWKBLineString(4326, [
      { x: 117.3461733, y: -33.3109317 },
      { x: 101.3461733, y: -35.3109317 },
    ]);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue(true) as Array<{
      x: number;
      y: number;
    }>;

    strict.ok(Array.isArray(result));
    strict.strictEqual(result.length, 2);
    strict.strictEqual(result[0].x, -33.3109317);
    strict.strictEqual(result[0].y, 117.3461733);
    strict.strictEqual(result[1].x, -35.3109317);
    strict.strictEqual(result[1].y, 101.3461733);
  });

  it('keeps linestring wire order by default', () => {
    const payload = buildWKBLineString(4326, [{ x: 1.0, y: 2.0 }]);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue() as Array<{
      x: number;
      y: number;
    }>;

    strict.strictEqual(result[0].x, 1.0);
    strict.strictEqual(result[0].y, 2.0);
  });

  it('swaps SRID 4326 polygon ring with swap=true', () => {
    const payload = buildWKBPolygon(4326, [
      [
        { x: 117.3461733, y: -33.3109317 },
        { x: 101.3461733, y: -35.3109317 },
      ],
    ]);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue(true) as Array<
      Array<{ x: number; y: number }>
    >;

    strict.strictEqual(result[0][0].x, -33.3109317);
    strict.strictEqual(result[0][0].y, 117.3461733);
    strict.strictEqual(result[0][1].x, -35.3109317);
    strict.strictEqual(result[0][1].y, 101.3461733);
  });
});
