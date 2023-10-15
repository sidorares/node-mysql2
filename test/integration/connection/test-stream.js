'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');
const { finished } = require("stream/promises");

let rows;
const rows1 = [];
const rows2 = [];

connection.query(
  [
    'CREATE TEMPORARY TABLE `announcements` (',
    '`id` int(11) NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255) DEFAULT NULL,',
    '`text` varchar(255) DEFAULT NULL,',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join('\n'),
  err => {
    if (err) {
      throw err;
    }
  }
);

connection.execute(
  'INSERT INTO announcements(title, text) VALUES(?, ?)',
  ['Есть место, где заканчивается тротуар', 'Расти борода, расти'],
  err => {
    if (err) {
      throw err;
    }
  }
);
connection.execute(
  'INSERT INTO announcements(title, text) VALUES(?, ?)',
  [
    'Граждане Российской Федерации имеют право собираться мирно без оружия',
    'проводить собрания, митинги и демонстрации, шествия и пикетирование'
  ],
  err => {
    if (err) {
      throw err;
    }
  }
);
connection.execute('SELECT * FROM announcements', (err, _rows) => {
  rows = _rows;
  const s1 = connection.query('SELECT * FROM announcements').stream();
  s1.on('data', row => {
    rows1.push(row);
  });
  s1.on('end', () => {
    const s2 = connection.execute('SELECT * FROM announcements').stream();
    s2.on('data', row => {
      rows2.push(row);
    });
    s2.on('end', () => {
      connection.end();
    });
  });
});


const rowsStreamForAwait = []
async function testStreamForAwait() {
  const stream = connection.execute('SELECT * FROM announcements').stream()
  for await (const row of stream) {
    rowsStreamForAwait.push(row)
  }
}
testStreamForAwait().then()


const rowsStreamFinished = []
async function testStreamFinished() {
  const stream = connection.execute('SELECT * FROM announcements').stream()
  stream.on('result', row => {
    rowsStreamFinished.push(row)
  })
  await finished(stream)
}
testStreamFinished().then()

process.on('exit', () => {
  assert.deepEqual(rows.length, 2);
  assert.deepEqual(rows, rows1);
  assert.deepEqual(rows, rows2);
  assert.deepEqual(rows, rowsStreamForAwait);
  assert.deepEqual(rows, rowsStreamFinished);
});
