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

describe('parseGeometryValue: SRID 4326 axis order (fixes #2959)', () => {
  it('should match ST_X/ST_Y for SRID 4326 point (swap lon/lat storage)', () => {
    const lat = -33.3109317;
    const lon = 117.3461733;
    const payload = buildWKBPoint(4326, lon, lat);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue() as { x: number; y: number };

    strict.strictEqual(result.x, lat);
    strict.strictEqual(result.y, lon);
  });

  it('should not swap for SRID 0 point', () => {
    const payload = buildWKBPoint(0, -35.3109317, 101.3461733);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue() as { x: number; y: number };

    strict.strictEqual(result.x, -35.3109317);
    strict.strictEqual(result.y, 101.3461733);
  });

  it('should swap each point in SRID 4326 linestring', () => {
    const payload = buildWKBLineString(4326, [
      { x: 117.3461733, y: -33.3109317 },
      { x: 101.3461733, y: -35.3109317 },
    ]);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue() as Array<{
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

  it('should not swap linestring for SRID 0', () => {
    const payload = buildWKBLineString(0, [{ x: 1.0, y: 2.0 }]);
    const { buffer, start, end } = buildGeometryPacket(payload);
    const packet = new Packet(0, buffer, start, end);
    const result = packet.parseGeometryValue() as Array<{
      x: number;
      y: number;
    }>;

    strict.strictEqual(result[0].x, 1.0);
    strict.strictEqual(result[0].y, 2.0);
  });
});
