'use strict';

const mysql = require('mysql2');
const flags = require('mysql2/lib/constants/client.js');
const auth = require('mysql2/lib/auth_41.js');

function authenticate(params, cb) {
  console.log(params);
  const doubleSha = auth.doubleSha1('pass123');
  const isValid = auth.verifyToken(
    params.authPluginData1,
    params.authPluginData2,
    params.authToken,
    doubleSha
  );
  if (isValid) {
    cb(null);
  } else {
    // for list of codes lib/constants/errors.js
    cb(null, { message: 'wrong password dude', code: 1045 });
  }
}

const server = mysql.createServer();
server.listen(3333);
server.on('connection', conn => {
  // we can deny connection here:
  // conn.writeError({ message: 'secret', code: 123 });
  // conn.close();
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: '5.6.10', // 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    // capabilityFlags: 0xffffff,
    // capabilityFlags: -2113931265,
    capabilityFlags: 2181036031,
    authCallback: authenticate
  });

  conn.on('field_list', (table, fields) => {
    console.log('FIELD LIST:', table, fields);
    conn.writeEof();
  });

  conn.on('query', query => {
    conn.writeColumns([
      {
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
      }
    ]);
    conn.writeTextRow(['test тест テスト փորձարկում পরীক্ষা kiểm tra ']);
    conn.writeTextRow(['ტესტი પરીક્ષણ  מבחן פּרובירן اختبار परीक्षण']);
    conn.writeEof();
    conn.close();
  });
});
