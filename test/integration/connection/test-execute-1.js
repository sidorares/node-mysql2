'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;
let rows1 = undefined;
let fields = undefined;

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

connection.execute('SELECT 1+? as test', [123], (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
});
connection.execute('SELECT 1 as test', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows1 = _rows;
  fields = _fields;
});

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
connection.execute('SELECT * FROM announcements', (err, rows) => {
  if (err) {
    throw err;
  }

  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, 'Есть место, где заканчивается тротуар');
  assert.equal(rows[0].text, 'Расти борода, расти');
  assert.equal(
    rows[1].title,
    'Граждане Российской Федерации имеют право собираться мирно без оружия'
  );
  assert.equal(
    rows[1].text,
    'проводить собрания, митинги и демонстрации, шествия и пикетирование'
  );
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ test: 124 }]);
  assert.deepEqual(rows1, [{ test: 1 }]);
  assert.equal(fields[0].name, 'test');
});
