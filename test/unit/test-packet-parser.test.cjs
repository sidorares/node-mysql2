'use strict';

const PacketParser = require('../../lib/packet_parser.js');
const Packet = require('../../lib/packets/packet.js');
const { Buffer } = require('node:buffer');
const { assert } = require('poku');

let pp;
let packets = [];
const handler = function (p) {
  packets.push(p);
};
function reset() {
  pp = new PacketParser(handler);
  packets = [];
}

function execute(str, verify) {
  reset();
  const buffers = str.split('|').map((sb) => sb.split(',').map(Number));
  for (let i = 0; i < buffers.length; ++i) {
    pp.execute(Buffer.from(buffers[i]));
  }
  verify();
}

function p123() {
  assert(packets.length === 1);
  assert(packets[0].length() === 14);
  assert(packets[0].sequenceId === 123);
}

function p120_121() {
  packets.forEach((p) => {
    p.dump;
  });
  assert(packets.length === 2);
  assert(packets[0].length() === 4);
  assert(packets[0].sequenceId === 120);
  assert(packets[1].length() === 4);
  assert(packets[1].sequenceId === 121);
}

execute('10,0,0,123,1,2,3,4,5,6,7,8,9,0', p123);
execute('10,0,0,123|1,2,3,4,5,6,7,8,9,0', p123);
execute('10,0,0|123,1,2,3,4,5,6,7,8,9,0', p123);
execute('10|0,0|123,1,2,3,4,5,6,7,8,9,0', p123);
execute('10,0,0,123,1|2,3,4,5,6|7,8,9,0', p123);
execute('10,0,0,123,1,2|,3,4,5,6|7,8,9,0', p123);

function p42() {
  assert(packets.length === 1);
  assert(packets[0].length() === 4);
  assert(packets[0].sequenceId === 42);
}

execute('0,0,0,42', p42);
execute('0|0,0,42', p42);
execute('0,0|0,42', p42);
execute('0,0|0|42', p42);
execute('0,0,0|42', p42);
execute('0|0|0|42', p42);
execute('0|0,0|42', p42);

// two zero length packets
execute('0,0,0,120,0,0,0,121', p120_121);
execute('0,0,0|120|0|0|0|121', p120_121);

const p122_123 = function () {
  assert(packets.length === 2);
  assert(packets[0].length() === 9);
  assert(packets[0].sequenceId === 122);
  assert(packets[1].length() === 10);
  assert(packets[1].sequenceId === 123);
};
// two non-zero length packets
execute('5,0,0,122,1,2,3,4,5,6,0,0,123,1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5|6,0,0,123,1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4|5|6|0,0,123,1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5,6|0,0,123,1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5,6,0|0,123,1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5,6,0,0|123,1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5,6,0,0,123|1,2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3,4,5,6', p122_123);
execute('5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3|4,5,6', p122_123);

// test packet > 65536 lengt
// TODO combine with "execute" function

const length = 123000;
const pbuff = Buffer.alloc(length + 4);
pbuff[4] = 123;
pbuff[5] = 124;
pbuff[6] = 125;
const p = new Packet(144, pbuff, 4, pbuff.length - 4);
p.writeHeader(42);

function testBigPackets(chunks, cb) {
  const packets = [];
  const pp = new PacketParser((p) => {
    packets.push(p);
  });
  chunks.forEach((ch) => {
    pp.execute(ch);
  });
  cb(packets);
}

function assert2FullPackets(packets) {
  function assertPacket(p) {
    assert.equal(p.length(), length + 4);
    assert.equal(p.sequenceId, 42);
    assert.equal(p.readInt8(), 123);
    assert.equal(p.readInt8(), 124);
    assert.equal(p.readInt8(), 125);
  }
  // assert.equal(packets[0].buffer.slice(0, 8).toString('hex'), expectation);
  // assert.equal(packets[1].buffer.slice(0, 8).toString('hex'), expectation);
  assert.equal(packets.length, 2);
  assertPacket(packets[0]);
  assertPacket(packets[1]);
}

// 2 full packets in 2 chunks
testBigPackets([pbuff, pbuff], assert2FullPackets);

testBigPackets(
  [pbuff.slice(0, 120000), pbuff.slice(120000, 123004), pbuff],
  assert2FullPackets,
);
const frameEnd = 120000;
testBigPackets(
  [
    pbuff.slice(0, frameEnd),
    Buffer.concat([pbuff.slice(frameEnd, 123004), pbuff]),
  ],
  assert2FullPackets,
);
for (let frameStart = 1; frameStart < 100; frameStart++) {
  testBigPackets(
    [
      Buffer.concat([pbuff, pbuff.slice(0, frameStart)]),
      pbuff.slice(frameStart, 123004),
    ],
    assert2FullPackets,
  );
}
