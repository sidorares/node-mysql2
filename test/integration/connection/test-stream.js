var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows;
var rows1 = [];
var rows2 = [];

connection.query([
  'CREATE TEMPORARY TABLE `announcements` (',
  '`id` int(11) NOT NULL AUTO_INCREMENT,',
  '`title` varchar(255) DEFAULT NULL,',
  '`text` varchar(255) DEFAULT NULL,',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'), function(err) {
  if (err) throw err;
});

connection.execute('INSERT INTO announcements(title, text) VALUES(?, ?)', ['Есть место, где заканчивается тротуар', 'Расти борода, расти'], function(err) {
  if (err) throw err;
});
connection.execute('INSERT INTO announcements(title, text) VALUES(?, ?)', ['Граждане Российской Федерации имеют право собираться мирно без оружия', 'проводить собрания, митинги и демонстрации, шествия и пикетирование'], function(err) {
  if (err) throw err;
});
connection.execute('SELECT * FROM announcements', function(err, _rows, cols) {
  rows = _rows;
  var s1 = connection.query('SELECT * FROM announcements').stream();
  s1.on('data', function(row) {
    rows1.push(row);
  });
  s1.on('end', function() {
    var s2 = connection.execute('SELECT * FROM announcements').stream();
    s2.on('data', function(row) {
      rows2.push(row);
    });
    s2.on('end', function() {
      connection.end();
    });
  });
});

process.on('exit', function() {
  assert.deepEqual(rows.length, 2);
  assert.deepEqual(rows, rows1);
  assert.deepEqual(rows, rows2);
});
