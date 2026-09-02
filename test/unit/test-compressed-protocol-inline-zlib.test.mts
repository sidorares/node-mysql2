import zlib from 'node:zlib';
import { describe, it, strict } from 'poku';
import compressedProtocol from '../../lib/compressed_protocol.js';

const { enableCompression } = compressedProtocol;

type Packet = { buffer: Buffer; offset: number };

type MockConnection = {
  compressedSequenceId: number;
  write: (buffer: Buffer) => void;
  writeUncompressed?: (buffer: Buffer) => void;
  handlePacket: (packet: Packet) => void;
  _handleNetworkError: (err: NodeJS.ErrnoException) => void;
  _handleFatalError?: (err: NodeJS.ErrnoException) => void;
  _bumpCompressedSequenceId: (numPackets: number) => void;
  packetParser?: { execute: (chunk: Buffer) => void };
  deflateQueue?: { _running: boolean };
};

const buildCompressedFrame = (
  body: Buffer,
  declaredUncompressedLength: number,
  sequenceId = 0
): Buffer => {
  const header = Buffer.alloc(7);

  header.writeUIntLE(body.length, 0, 3);
  header.writeUInt8(sequenceId, 3);
  header.writeUIntLE(declaredUncompressedLength, 4, 3);

  return Buffer.concat([header, body]);
};

// one MySQL packet whose single payload byte identifies it
const innerPacket = (marker: number): Buffer =>
  Buffer.from([1, 0, 0, 0, marker]);

// a MySQL packet larger than the inline inflate limit
const largeInnerPacket = (marker: number): Buffer => {
  const packet = Buffer.alloc(20000, marker);
  packet.writeUIntLE(packet.length - 4, 0, 3);
  packet[3] = 0;
  return packet;
};

const connect = (
  delivered: number[],
  written: Buffer[],
  onError: (err: NodeJS.ErrnoException) => void
): MockConnection => {
  const conn: MockConnection = {
    compressedSequenceId: 0,
    write(buffer) {
      written.push(buffer);
    },
    handlePacket(packet) {
      delivered.push(packet.buffer[packet.offset]);
    },
    _handleNetworkError: onError,
    _handleFatalError: onError,
    _bumpCompressedSequenceId(numPackets) {
      conn.compressedSequenceId =
        (conn.compressedSequenceId + numPackets) % 256;
    },
  };
  enableCompression(conn);
  return conn;
};

const waitFor = (condition: () => boolean): Promise<void> =>
  new Promise((resolve) => {
    const check = (): void => {
      if (condition()) {
        resolve();
      } else {
        setImmediate(check);
      }
    };
    check();
  });

await describe('compressed protocol: inline zlib', async () => {
  await it('delivers small deflated and uncompressed frames synchronously', () => {
    const delivered: number[] = [];
    const conn = connect(delivered, [], (err) => {
      throw err;
    });
    conn.packetParser?.execute(
      Buffer.concat([
        buildCompressedFrame(zlib.deflateSync(innerPacket(1)), 5, 0),
        buildCompressedFrame(innerPacket(2), 0, 1),
      ])
    );

    strict.deepEqual(delivered, [1, 2]);
  });

  await it('keeps frames queued behind an asynchronous inflate in order', async () => {
    const delivered: number[] = [];
    let failure: NodeJS.ErrnoException | null = null;
    const conn = connect(delivered, [], (err) => {
      failure = err;
    });
    const large = largeInnerPacket(0x41);
    conn.packetParser?.execute(
      Buffer.concat([
        buildCompressedFrame(zlib.deflateSync(large), large.length, 0),
        buildCompressedFrame(zlib.deflateSync(innerPacket(2)), 5, 1),
        buildCompressedFrame(innerPacket(3), 0, 2),
      ])
    );

    strict.deepEqual(delivered, [], 'nothing is delivered before the inflate');
    await waitFor(() => delivered.length === 3 || failure !== null);

    strict.equal(failure, null);
    strict.deepEqual(delivered, [0x41, 2, 3]);
    strict.equal(conn.compressedSequenceId, 3);
  });

  await it('writes tiny packets uncompressed and small packets deflated, synchronously', () => {
    const written: Buffer[] = [];
    const conn = connect([], written, (err) => {
      throw err;
    });
    const tiny = Buffer.from('SELECT 1');
    conn.write(tiny);
    const small = Buffer.alloc(4000, 0x61);
    conn.write(small);

    strict.equal(written.length, 4);
    const [tinyHeader, tinyBody, smallHeader, smallBody] = written;
    strict.equal(tinyHeader.readUIntLE(0, 3), tiny.length);
    strict.equal(tinyHeader[3], 0);
    strict.equal(tinyHeader.readUIntLE(4, 3), 0, 'uncompressed payload marker');
    strict.equal(tinyBody, tiny);
    strict.equal(smallHeader.readUIntLE(0, 3), smallBody.length);
    strict.equal(smallHeader[3], 1);
    strict.equal(smallHeader.readUIntLE(4, 3), small.length);
    strict.ok(smallBody.length < small.length);
    strict.deepEqual(zlib.inflateSync(smallBody), small);
    strict.equal(conn.compressedSequenceId, 2);
  });

  await it('sends an incompressible small packet as an uncompressed payload', () => {
    const written: Buffer[] = [];
    const conn = connect([], written, (err) => {
      throw err;
    });
    const random = Buffer.alloc(200);
    for (let i = 0; i < random.length; i++) {
      random[i] = (i * 7919 + 13) % 256;
    }
    conn.write(random);

    strict.equal(written.length, 2);
    strict.equal(written[0].readUIntLE(4, 3), 0);
    strict.equal(written[1], random);
  });

  await it('keeps writes queued behind an asynchronous deflate in order', async () => {
    const written: Buffer[] = [];
    let failure: NodeJS.ErrnoException | null = null;
    const conn = connect([], written, (err) => {
      failure = err;
    });
    const large = Buffer.alloc(5000, 0x62);
    conn.write(large);
    const tiny = Buffer.from('ping');
    conn.write(tiny);

    strict.equal(written.length, 0, 'nothing is written before the deflate');
    await waitFor(() => written.length === 4 || failure !== null);

    strict.equal(failure, null);
    strict.equal(written[0][3], 0, 'large packet first');
    strict.equal(written[0].readUIntLE(4, 3), large.length);
    strict.deepEqual(zlib.inflateSync(written[1]), large);
    strict.equal(written[2][3], 1, 'tiny packet second');
    strict.equal(written[2].readUIntLE(4, 3), 0);
    strict.equal(written[3], tiny);
  });

  await it('reports a corrupt large frame through the network error path', async () => {
    const delivered: number[] = [];
    const err = await new Promise<NodeJS.ErrnoException>((resolve) => {
      const conn = connect(delivered, [], resolve);
      conn.packetParser?.execute(
        buildCompressedFrame(Buffer.from('not deflate data'), 20000, 0)
      );
      strict.deepEqual(delivered, [], 'a large frame is never inflated inline');
    });

    strict.ok(err instanceof Error);
    strict.deepEqual(delivered, []);
  });

  await it('reports a corrupt small frame through the network error path', async () => {
    const delivered: number[] = [];
    const err = await new Promise<NodeJS.ErrnoException>((resolve) => {
      const conn = connect(delivered, [], resolve);
      conn.packetParser?.execute(
        buildCompressedFrame(Buffer.from('not deflate data'), 5, 0)
      );
    });

    strict.ok(err instanceof Error);
    strict.deepEqual(delivered, []);
  });
});
