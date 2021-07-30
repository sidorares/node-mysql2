'use strict';

const assert = require('assert');
const packets = require('../../../lib/packets/index.js');

[
  ['01:23:45', '0b000004000008000000000001172d'], // CONVERT('01:23:45', TIME)
  ['01:23:45.123456', '0f00000400000c000000000001172d40e20100'], // DATE_ADD(CONVERT('01:23:45', TIME), INTERVAL 0.123456 SECOND)
  ['-01:23:44.876544', '0f00000400000c010000000001172c00600d00'], // DATE_ADD(CONVERT('-01:23:45', TIME), INTERVAL 0.123456 SECOND)
  ['-81:23:44.876544', '0f00000400000c010300000009172c00600d00'], // DATE_ADD(CONVERT('-81:23:45', TIME), INTERVAL 0.123456 SECOND)
  ['81:23:45', '0b000004000008000300000009172d'], // CONVERT('81:23:45', TIME)
  ['123:23:45.123456', '0f00000400000c000500000003172d40e20100'], // DATE_ADD(CONVERT('123:23:45', TIME), INTERVAL 0.123456 SECOND)
  ['-121:23:45', '0b000004000008010500000001172d'], // CONVERT('-121:23:45', TIME)
  ['-01:23:44.88', '0f00000400000c010000000001172c806d0d00'] //DATE_ADD(CONVERT('-01:23:45', TIME), INTERVAL 0.12 SECOND)
].forEach(([expected, buffer]) => {
  const buf = Buffer.from(buffer, 'hex');
  const packet = new packets.Packet(4, buf, 0, buf.length);
  packet.readInt16(); // unused
  const d = packet.readTimeString(false);
  assert.equal(d, expected);
});
