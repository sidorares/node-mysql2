var mysql = require('../index.js');
var flags = require('../lib/constants/client.js');
var auth  = require('../lib/auth_41.js');

function authenticate(params, cb) {
  console.log(params);
  var doubleSha = auth.doubleSha1('pass123');
  var isValid = auth.verifyToken(params.authPluginData1, params.authPluginData2, params.authToken, doubleSha);
  if (isValid)
    cb(null);
  else
    // for list of codes lib/constants/errors.js
    cb(null, { message: 'wrong password dude', code: 1045});
}

var server = mysql.createServer();
server.listen(3333);
server.on('connection', function(conn) {

  // we can deny connection here:
  // conn.writeError({ message: 'secret', code: 123 });
  // conn.close();
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: '5.6.10', //'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff,
    authCallback: authenticate
  });

  conn.on('field_list', function(table, fields) {
    console.log('FIELD LIST:', table, fields);
    conn.writeEof();
  });

  conn.on('query', function(query) {
    conn.writeColumns([{
      catalog: 'def',
      schema: 'test',
      table: 'test_table',
      orgTable: 'test_table',
      name: 'beta',
      orgName: 'beta',
      characterSet: 33,
      columnLength: 384,
      columnType: 253,
      flags: 0,
      decimals: 0
    }]);
    conn.writeTextRow(['test тест テスト փորձարկում পরীক্ষা kiểm tra ']);
    conn.writeTextRow(['ტესტი પરીક્ષણ  מבחן פּרובירן اختبار परीक्षण']);
    conn.writeEof();
    conn.close();
  });
});
