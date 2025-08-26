'use strict';

const common = require('../../common.test.cjs');

const connection = common.createConnection();

connection.query(
  [
    'CREATE TEMPORARY TABLE `items` (',
    '`id` int(11) NOT NULL AUTO_INCREMENT,',
    '`text` varchar(255) DEFAULT NULL,',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
  (err) => {
    if (err) {
      throw err;
    }
  }
);

for (let i = 0; i < 100; i++) {
  connection.execute('INSERT INTO items(text) VALUES(?)', ['test'], (err) => {
    if (err) {
      throw err;
    }
  });
}

async function run() {
  const rows = connection.query('SELECT * FROM items').stream();
  // eslint-disable-next-line no-unused-vars
  for await (const row of rows) {
    break;
  }
  setTimeout(() => {
    throw new Error('Connection remains open after stream error');
  }, 5000).unref();
  connection.end();
}

run();
