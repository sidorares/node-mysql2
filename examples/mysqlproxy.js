var mysql = require('../index.js');

var server = mysql.createServer();
server.listen(3333);
server.on('connection', function(conn) {

  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });

  conn.on('field_list', function(table, fields) {
    console.log('FIELD LIST:', table, fields);
    conn.writeEof();
  });

  conn.on('query', function(sql) {
    var cli = mysql.createConnection({user: 'root', database: 'test'});
    cli.query(sql, function(err, rows, columns) {
      conn.writeTextResult(rows, columns);
    });
  });
});
