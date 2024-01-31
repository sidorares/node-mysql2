'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;
const rows1 = [];
const rows2 = [];
const rows3 = [];
const rows4 = [];

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
connection.execute('SELECT * FROM announcements', async (err, _rows) => {
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
  const s3 = connection.query('SELECT * FROM announcements').stream();
  for await (const row of s3) {
    rows3.push(row);
  }
  const s4 = connection.query('SELECT * FROM announcements').stream();
  for await (const row of s4) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    rows4.push(row);
  }
});

process.on('exit', () => {
  assert.deepEqual(rows.length, 2);
  assert.deepEqual(rows, rows1);
  assert.deepEqual(rows, rows2);
  assert.deepEqual(rows, rows3);
  assert.deepEqual(rows, rows4);
});
