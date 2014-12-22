var fs = require('fs');
var ColumnDefinition = require('../../../lib/packets/column_definition.js');
var Packet = require('../../../lib/packets/packet.js');
var fixtureFile = __dirname + '/../fixtures/column_definition';

function prepareFixture() {
  var Packets = require('../../../lib/packets/index.js');
  var packetInd = 0;
  Packets.ColumnDefinition = function(packet) {
    fs.writeFileSync(fixtureFile + packetInd, packet.buffer.slice(packet.start, packet.end));
    packetInd++;
    var c = new ColumnDefinition(packet);
    //console.log('packet', c);
    return c;
  };
  var connection = require('../../../test/common.js').createConnection();
  connection.query('select * from mysql.user', function() {});
  connection.end();
}

//prepareFixture();
//return;

var npackets = 43;
var packets = [];
var packet;

for (var i=0; i < npackets; ++i) {
  var buf = fs.readFileSync(fixtureFile + i);
  packet = new Packet(0, buf, 0, buf.length);
  packets.push(packet);
}

var c;
var repeats = 10000;

function bench(done) {
  for (var i=0; i < repeats; ++i) {
    for (var j=0; j < npackets; ++j) {
      packets[j].offset = 0;
      c =new ColumnDefinition(packets[j]);
    }
  }
  done();
}

module.exports = bench;
module.exports.comment = "read " + npackets + " column definitions (select * from mysql.user) x " + repeats;
module.exports.toSpeed = function(timeAvg, timeStdev) {
  var value = 43*repeats*1e9 / timeAvg;
  return {
    value: value,
    error: value*(timeStdev / timeAvg),
    units: 'columns/second'
  }
}
