'use strict';

const { assert } = require('poku');
const packets = require('../../../lib/packets/index.js');
const { Buffer } = require('node:buffer');

let buf = Buffer.from('0a000004000007dd070116010203', 'hex');

let packet = new packets.Packet(4, buf, 0, buf.length);
packet.readInt16(); // unused
let d = packet.readDateTime('Z');

assert.equal(+d, 1358816523000);

buf = Buffer.from(
  '18000006000004666f6f310be00702090f01095d7f06000462617231',
  'hex',
);
packet = new packets.Packet(6, buf, 0, buf.length);

packet.readInt16(); // ignore
const s = packet.readLengthCodedString('cesu8');
assert.equal(s, 'foo1');
d = packet.readDateTime('Z');
assert.equal(+d, 1455030069425);

const s1 = packet.readLengthCodedString('cesu8');
assert.equal(s1, 'bar1');
assert.equal(packet.offset, packet.end);
