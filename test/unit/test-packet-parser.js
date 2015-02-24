var PacketParser = require('../../lib/packet_parser.js');
var Packet       = require('../../lib/packets/packet.js');

var assert = require('assert');

var pp;
var packets = [];
function reset() {
  pp = new PacketParser(handler);
  packets = [];
}
var handler = function(p) {
  packets.push(p);
}

function execute(str, verify) {
  reset();
  var buffers = str.split('|').map(function(sb) { return sb.split(',').map(Number) });
  for(var i=0; i < buffers.length; ++i)
    pp.execute(new Buffer(buffers[i]));
  verify();
}

function p123() {
  assert(packets.length === 1);
  assert(packets[0].length() === 10);
  assert(packets[0].sequenceId === 123);
}

function p120_121() {
  packets.forEach(function(p) { p.dump });
  assert(packets.length === 2);
  assert(packets[0].length() === 0);
  assert(packets[0].sequenceId === 120);
  assert(packets[1].length() === 0);
  assert(packets[1].sequenceId === 121);
}

execute("10,0,0,123,1,2,3,4,5,6,7,8,9,0", p123);
execute("10,0,0,123|1,2,3,4,5,6,7,8,9,0", p123);
execute("10,0,0|123,1,2,3,4,5,6,7,8,9,0", p123);
execute("10|0,0|123,1,2,3,4,5,6,7,8,9,0", p123);
execute("10,0,0,123,1|2,3,4,5,6|7,8,9,0", p123);
execute("10,0,0,123,1,2|,3,4,5,6|7,8,9,0", p123);

function p42() {
  assert(packets.length === 1);
  assert(packets[0].length() === 0);
  assert(packets[0].sequenceId === 42);
}

execute("0,0,0,42", p42);
execute("0|0,0,42", p42);
execute("0,0|0,42", p42);
execute("0,0|0|42", p42);
execute("0,0,0|42", p42);
execute("0|0|0|42", p42);
execute("0|0,0|42", p42);

// two zero length packets
execute("0,0,0,120,0,0,0,121", p120_121);
execute("0,0,0|120|0|0|0|121", p120_121);

var p122_123 = function() {
  assert(packets.length === 2);
  assert(packets[0].length() === 5);
  assert(packets[0].sequenceId === 122);
  assert(packets[1].length() === 6);
  assert(packets[1].sequenceId === 123);
}
// two non-zero length packets
execute("5,0,0,122,1,2,3,4,5,6,0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5|6,0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4|5|6|0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6|0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0|0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0|123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0,123|1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3|4,5,6", p122_123);

// test packet > 65536 lengt
// TODO combine with "execute" function

var length = 123000
var pbuff = new Buffer(length+4);
pbuff[4] = 123;
pbuff[5] = 124;
pbuff[6] = 125;
var p = new Packet(144, pbuff, 4, pbuff.length - 4);
p.writeHeader(42);

function testBigPackets(chunks, cb) {
  var packets = [];
  var pp = new PacketParser(function(p) {
    packets.push(p);
  });
  chunks.forEach(function(ch) {
    pp.execute(ch);
  });
  cb(packets);
}

function assert2FullPackets(packets) {
  function assertPacket(p) {
    assert.equal(p.length(), length);
    assert.equal(p.sequenceId, 42);
    assert.equal(p.readInt8(), 123);
    assert.equal(p.readInt8(), 124);
    assert.equal(p.readInt8(), 125);
  }
  //assert.equal(packets[0].buffer.slice(0, 8).toString('hex'), expectation);
  //assert.equal(packets[1].buffer.slice(0, 8).toString('hex'), expectation);
  assert.equal(packets.length, 2);
  assertPacket(packets[0]);
  assertPacket(packets[1]);
}

// 2 full packets in 2 chunks
testBigPackets( [ pbuff, pbuff ], assert2FullPackets);

testBigPackets( [ pbuff.slice(0, 120000), pbuff.slice(120000, 123004), pbuff ], assert2FullPackets);
var frameEnd = 120000
testBigPackets( [ pbuff.slice(0, frameEnd), Buffer.concat([pbuff.slice(frameEnd, 123004), pbuff]) ], assert2FullPackets);
for(var frameStart=1; frameStart < 100; frameStart++) {
  testBigPackets([ Buffer.concat([pbuff, pbuff.slice(0, frameStart)]), pbuff.slice(frameStart, 123004) ], assert2FullPackets);
}
