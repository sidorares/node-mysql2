var mysql = require('../index.js');
var flags  = require('../lib/constants/client');
var Packets      = require('../lib/packets/index.js');
var Packet       = require('../lib/packets/packet');

function prepareReply(columns, row, n) {
  var length = 0;
  var rsHeader = Packets.ResultSetHeader.toPacket(columns.length);
  length += rsHeader.length();
  var columnPackets = [];
  columns.forEach(function(column) {
    var packet = Packets.ColumnDefinition.toPacket(column);
    length += packet.length();
    columnPackets.push(packet);
  });
  var eof = Packets.EOF.toPacket();
  length += 2*eof.length();
  var rowPacket = Packets.TextRow.toPacket(row);
  length += n*rowPacket.length();

  var replyBuffer = new Buffer(length);
  var offset = 0;
  var id = 1;
  function add(packet) {
    packet.writeHeader(id);
    id = id + 1;
    packet.buffer.copy(replyBuffer, offset);
    offset += packet.length();
  }

  var i;
  add(rsHeader);
  for (i=0; i < columns.length; ++i)
    add(columnPackets[i]);
  add(eof);
  for (i=0; i < n; ++i)
    add(rowPacket);
  add(eof);

  return replyBuffer;
}

var buff = prepareReply([{
      catalog: 'def',
      schema: 'test',
      table: 'test_table',
      orgTable: 'test_table',
      name: 'beta',
      orgName: 'beta',
      characterSet: 33,
      columnLength: 384,
      columnType: 3, //253,
      flags: 0,
      decimals: 0
    }], ['12345'], 1);

var server = mysql.createServer();
server.listen('/tmp/mybench3.sock');
server.on('connection', function(conn) {
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });
  conn.on('query', function(query) {
    //console.log(query);
    conn.write(buff);
  });
});
