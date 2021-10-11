'use strict';

const mysql = require('../index.js');
const Packets = require('../lib/packets/index.js');

function prepareReply(columns, row, n) {
  let length = 0;
  const rsHeader = Packets.ResultSetHeader.toPacket(columns.length);
  length += rsHeader.length();
  const columnPackets = [];
  columns.forEach(column => {
    const packet = Packets.ColumnDefinition.toPacket(column);
    length += packet.length();
    columnPackets.push(packet);
  });
  const eof = Packets.EOF.toPacket();
  length += 2 * eof.length();
  const rowPacket = Packets.TextRow.toPacket(row, 'utf8');
  length += n * rowPacket.length();

  const replyBuffer = Buffer.allocUnsafe(length);
  let offset = 0;
  let id = 1;
  function add(packet) {
    packet.writeHeader(id);
    id = id + 1;
    packet.buffer.copy(replyBuffer, offset);
    offset += packet.length();
  }

  let i;
  add(rsHeader);
  for (i = 0; i < columns.length; ++i) add(columnPackets[i]);
  add(eof);
  for (i = 0; i < n; ++i) add(rowPacket);
  add(eof);

  return replyBuffer;
}

const buff = prepareReply(
  [
    {
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
    }
  ],
  ['12345'],
  1
);

const server = mysql.createServer();
server.listen('/tmp/mybench3.sock');
server.on('connection', conn => {
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });
  conn.on('query', () => {
    //console.log(query);
    conn.write(buff);
  });
});
