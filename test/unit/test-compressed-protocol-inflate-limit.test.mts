import zlib from 'node:zlib';
import { describe, it, strict } from 'poku';
import compressedProtocol from '../../lib/compressed_protocol.js';

const { enableCompression } = compressedProtocol;

type MockConnection = {
  write: () => void;
  handlePacket: (packet: unknown) => void;
  _handleNetworkError: (err: NodeJS.ErrnoException) => void;
  _bumpCompressedSequenceId: (numPackets: number) => void;
  packetParser?: { execute: (chunk: Buffer) => void };
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

const feedFrame = (frame: Buffer, conn: MockConnection): void => {
  enableCompression(conn);

  const { packetParser } = conn;
  if (!packetParser) throw new Error('packetParser was not installed');

  packetParser.execute(frame);
};

await describe('compressed protocol: inflate output limit', async () => {
  await it('rejects a frame that inflates beyond its declared length', async () => {
    const body = zlib.deflateSync(Buffer.alloc(4096));
    const frame = buildCompressedFrame(body, 10);
    const err = await new Promise<NodeJS.ErrnoException>((resolve, reject) => {
      feedFrame(frame, {
        write() {},
        handlePacket() {
          reject(
            new Error(
              'inflated packet was delivered; the size cap did not hold'
            )
          );
        },
        _handleNetworkError(e) {
          resolve(e);
        },
        _bumpCompressedSequenceId() {},
      });
    });

    strict.equal(err.code, 'ERR_BUFFER_TOO_LARGE');
  });

  await it('accepts a frame that inflates to exactly its declared length', async () => {
    const inner = Buffer.from([1, 0, 0, 0, 0]);
    const body = zlib.deflateSync(inner);
    const frame = buildCompressedFrame(body, inner.length);

    await new Promise<void>((resolve, reject) => {
      feedFrame(frame, {
        write() {},
        handlePacket() {
          resolve();
        },
        _handleNetworkError(e) {
          reject(e);
        },
        _bumpCompressedSequenceId() {},
      });
    });
  });
});
