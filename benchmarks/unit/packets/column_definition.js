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

module.exports = [
  {
    name: `read ${npackets} column definitions (select * from mysql.user)`,
    fn: function() {
      const useit = 0;
      for (let j = 0; j < npackets; ++j) {
        packets[j].offset = 0;
        new ColumnDefinition(packets[j], 'utf8');
      }
      return useit;
    }  
  },
  {
    name: `read ${npackets} column definitions (select * from mysql.user) and access column lazy fields once`,
    fn: function() {
      let useit = 0;
      for (let j = 0; j < npackets; ++j) {
        packets[j].offset = 0;
        const c = new ColumnDefinition(packets[j], 'utf8');
        useit += c.table.length + c.catalog.length + c.schema.length + c.table.length + c.orgTable.length + c.orgName.length;
      }
      return useit;
    }
  },
  {
    // see https://github.com/sidorares/node-mysql2/pull/1400 optimisation
    name: `read ${npackets} column definitions (select * from mysql.user) and access column lazy fields 5 times`,
    fn: function() {
      let useit = 0;
      for (let j = 0; j < npackets; ++j) {
        packets[j].offset = 0;
        const c = new ColumnDefinition(packets[j], 'utf8');
        useit += c.table.length + c.catalog.length + c.schema.length + c.table.length + c.orgTable.length + c.orgName.length;
        useit += c.table.length + c.catalog.length + c.schema.length + c.table.length + c.orgTable.length + c.orgName.length;
        useit += c.table.length + c.catalog.length + c.schema.length + c.table.length + c.orgTable.length + c.orgName.length;
        useit += c.table.length + c.catalog.length + c.schema.length + c.table.length + c.orgTable.length + c.orgName.length;
        useit += c.table.length + c.catalog.length + c.schema.length + c.table.length + c.orgTable.length + c.orgName.length;
      }
      return useit;
    }
  }  
]
