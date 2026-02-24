import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import PacketParser from '../../lib/packet_parser.js';
import Packet from '../../lib/packets/packet.js';

type PacketInstance = InstanceType<typeof Packet>;

let pp: InstanceType<typeof PacketParser>;
let packets: PacketInstance[] = [];
const handler = function (p: PacketInstance) {
  packets.push(p);
};
function reset() {
  pp = new PacketParser(handler);
  packets = [];
}

function execute(str: string, verify: () => void) {
  reset();
  const buffers = str.split('|').map((sb) => sb.split(',').map(Number));
  for (let i = 0; i < buffers.length; ++i) {
    pp.execute(Buffer.from(buffers[i]));
  }
  verify();
}

function p123() {
  strict(packets.length === 1);
  strict(packets[0].length() === 14);
  strict(packets[0].sequenceId === 123);
}

function p120_121() {
  packets.forEach((p) => {
    p.dump;
  });
  strict(packets.length === 2);
  strict(packets[0].length() === 4);
  strict(packets[0].sequenceId === 120);
  strict(packets[1].length() === 4);
  strict(packets[1].sequenceId === 121);
}

function p42() {
  strict(packets.length === 1);
  strict(packets[0].length() === 4);
  strict(packets[0].sequenceId === 42);
}

function testBigPackets(
  chunks: Buffer[],
  cb: (packets: PacketInstance[]) => void
) {
  const packets: PacketInstance[] = [];
  const pp = new PacketParser((p: PacketInstance) => {
    packets.push(p);
  });
  chunks.forEach((ch) => {
    pp.execute(ch);
  });
  cb(packets);
}

describe('PacketParser', () => {
  it('should parse single packet with various chunk splits', () => {
    execute('10,0,0,123,1,2,3,4,5,6,7,8,9,0', p123);
    execute('10,0,0,123|1,2,3,4,5,6,7,8,9,0', p123);
    execute('10,0,0|123,1,2,3,4,5,6,7,8,9,0', p123);
    execute('10|0,0|123,1,2,3,4,5,6,7,8,9,0', p123);
    execute('10,0,0,123,1|2,3,4,5,6|7,8,9,0', p123);
    execute('10,0,0,123,1,2|,3,4,5,6|7,8,9,0', p123);
  });

  it('should parse zero-length packet with various chunk splits', () => {
    execute('0,0,0,42', p42);
    execute('0|0,0,42', p42);
    execute('0,0|0,42', p42);
    execute('0,0|0|42', p42);
    execute('0,0,0|42', p42);
    execute('0|0|0|42', p42);
    execute('0|0,0|42', p42);
  });

  it('should parse two zero length packets', () => {
    execute('0,0,0,120,0,0,0,121', p120_121);
    execute('0,0,0|120|0|0|0|121', p120_121);
  });

  it('should parse two non-zero length packets with various chunk splits', () => {
    const p122_123 = function () {
      strict(packets.length === 2);
      strict(packets[0].length() === 9);
      strict(packets[0].sequenceId === 122);
      strict(packets[1].length() === 10);
      strict(packets[1].sequenceId === 123);
    };
    execute('5,0,0,122,1,2,3,4,5,6,0,0,123,1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5|6,0,0,123,1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4|5|6|0,0,123,1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5,6|0,0,123,1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5,6,0|0,123,1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5,6,0,0|123,1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5,6,0,0,123|1,2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3,4,5,6', p122_123);
    execute('5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3|4,5,6', p122_123);
  });

  it('should parse packets larger than 65536 bytes', () => {
    // test packet > 65536 lengt
    // TODO combine with "execute" function

    const length = 123000;
    const pbuff = Buffer.alloc(length + 4);
    pbuff[4] = 123;
    pbuff[5] = 124;
    pbuff[6] = 125;
    const p = new Packet(144, pbuff, 4, pbuff.length - 4);
    p.writeHeader(42);

    function assert2FullPackets(packets: PacketInstance[]) {
      function assertPacket(p: PacketInstance) {
        strict.equal(p.length(), length + 4);
        strict.equal(p.sequenceId, 42);
        strict.equal(p.readInt8(), 123);
        strict.equal(p.readInt8(), 124);
        strict.equal(p.readInt8(), 125);
      }
      // strict.equal(packets[0].buffer.slice(0, 8).toString('hex'), expectation);
      // strict.equal(packets[1].buffer.slice(0, 8).toString('hex'), expectation);
      strict.equal(packets.length, 2);
      assertPacket(packets[0]);
      assertPacket(packets[1]);
    }

    // 2 full packets in 2 chunks
    testBigPackets([pbuff, pbuff], assert2FullPackets);

    testBigPackets(
      [pbuff.slice(0, 120000), pbuff.slice(120000, 123004), pbuff],
      assert2FullPackets
    );
    const frameEnd = 120000;
    testBigPackets(
      [
        pbuff.slice(0, frameEnd),
        Buffer.concat([pbuff.slice(frameEnd, 123004), pbuff]),
      ],
      assert2FullPackets
    );
    for (let frameStart = 1; frameStart < 100; frameStart++) {
      testBigPackets(
        [
          Buffer.concat([pbuff, pbuff.slice(0, frameStart)]),
          pbuff.slice(frameStart, 123004),
        ],
        assert2FullPackets
      );
    }
  });
});
