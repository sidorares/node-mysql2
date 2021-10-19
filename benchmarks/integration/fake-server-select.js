'use strict';

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite;
const portfinder = require('portfinder');

let connection = null;
const mysql = require('../index.js');
const Packets = require('../lib/packets/index.js');

const cache = [];
function prepareReply(columns, row, n) {
  if (cache[n]) {
    return cache[n];
  }
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
  cache[n] = replyBuffer;
  return replyBuffer;
}

const server = mysql.createServer(conn => {
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });
  conn.on('query', query => {
    // when client sends "1" query we return 1 trow, when "1000" - 1000
    const limit = parseInt(query, 10);
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
          columnType: 3, 
          flags: 0,
          decimals: 0
        }, {
          catalog: 'def',
          schema: 'test',
          table: 'test_table',
          orgTable: 'test_table',
          name: 'beta2',
          orgName: 'beta2',
          characterSet: 33,
          columnLength: 384,
          columnType: 3, 
          flags: 0,
          decimals: 0
        }
      ],
      ['12345', '1237788'],
      limit
    );
    conn.write(buff);
    conn._resetSequenceId();
  });
});


// add tests
suite.add('Select 1 row x 2 small text column from fake server', async () => new Promise(accept => {
  connection.query('1', (err, rows) => {
    const result = rows[0].beta + rows[0].beta2;
    accept(result);
  });
})).add('Select 2 rows x 2 small text column from fake server', async () => new Promise(accept => {
  connection.query('1000', accept)
})).on('start', async () => new Promise(accept => {
  portfinder.getPort((_, port) => {
    server.listen(port);
    connection = mysql.createConnection({
      port: port,
    });
    connection.on('connect', accept);
  })
})).on('complete', () => {
  console.log('done!')
  connection.end()
  server.close();
}).on('cycle', event => {
  console.log(String(event.target));
})
  .run({ 'async': true, minSamples: 100 });