'use strict';

const fs = require('fs');
const ColumnDefinition = require('../../../lib/packets/column_definition.js');
const Packet = require('../../../lib/packets/packet.js');
const fixtureFile = `${__dirname}/../fixtures/column_definition`;

const npackets = 43;
const packets = [];
let packet;

for (let i = 0; i < npackets; ++i) {
  const buf = fs.readFileSync(fixtureFile + i);
  packet = new Packet(0, buf, 0, buf.length);
  packets.push(packet);
}

const repeats = 10000;

function bench(done) {
  for (let i = 0; i < repeats; ++i) {
    for (let j = 0; j < npackets; ++j) {
      packets[j].offset = 0;
      new ColumnDefinition(packets[j], 'utf8');
    }
  }
  done();
}

module.exports = bench;
module.exports.comment = `read ${npackets} column definitions (select * from mysql.user) x ${repeats}`;
module.exports.toSpeed = function(timeAvg, timeStdev) {
  const value = (43 * repeats * 1e9) / timeAvg;
  return {
    value: value,
    error: value * (timeStdev / timeAvg),
    units: 'columns/second'
  };
};
