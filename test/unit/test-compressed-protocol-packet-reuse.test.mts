import { Buffer } from 'node:buffer';
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

// The packet parser reuses its packet instance between onPacket calls, and
// the inflate step runs asynchronously. handleCompressedPacket must read
// everything it needs from the packet before queueing; these tests mutate
// the reused instance right after the synchronous hand-off to prove it.
await describe('compressed protocol: reused packet is read before inflate', async () => {
  const innerPacket = Buffer.from([1, 0, 0, 0, 0]);

  const bumpAfterMutation = (frame: Buffer): Promise<number> =>
    new Promise<number>((resolve, reject) => {
      const conn: MockConnection = {
        write() {},
        handlePacket() {},
        _handleNetworkError(e) {
          reject(e);
        },
        _bumpCompressedSequenceId(numPackets) {
          resolve(numPackets);
        },
      };
      enableCompression(conn);
      const { packetParser } = conn;
      if (!packetParser) throw new Error('packetParser was not installed');
      packetParser.execute(frame);
      // simulate the next frame arriving before the async inflate ran:
      // the parser's reused packet instance gets overwritten
      // @ts-expect-error: internal access
      packetParser._reusablePacket.numPackets = 99;
    });

  await it('deflated frame: numPackets is captured at queueing time', async () => {
    const frame = buildCompressedFrame(
      zlib.deflateSync(innerPacket),
      innerPacket.length
    );
    strict.equal(await bumpAfterMutation(frame), 1);
  });

  await it('uncompressed frame: numPackets is captured at queueing time', async () => {
    const frame = buildCompressedFrame(innerPacket, 0);
    strict.equal(await bumpAfterMutation(frame), 1);
  });
});
