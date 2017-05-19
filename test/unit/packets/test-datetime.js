var Buffer = require('safe-buffer').Buffer;
var assert = require('assert');
var packets = require('../../../lib/packets/index.js');

var buf = Buffer.from('0a000004000007dd070116010203', 'hex');

var packet = new packets.Packet(4, buf, 0, buf.length);
var i = packet.readInt16();
var d = packet.readDateTime();

assert.equal(+d, 1358816523000);

buf = Buffer.from(
  '18000006000004666f6f310be00702090f01095d7f06000462617231',
  'hex'
);
packet = new packets.Packet(6, buf, 0, buf.length);

i = packet.readInt16();
var s = packet.readLengthCodedString('cesu8');
assert.equal(s, 'foo1');
d = packet.readDateTime();
assert.equal(+d, 1455030494821);

var s1 = packet.readLengthCodedString('cesu8');
assert.equal(s1, 'bar1');
assert.equal(packet.offset, packet.end);
