var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var rows1 = undefined;
var fields = undefined;

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

connection.execute('SELECT 1+? as test', [123], function(err, _rows, _fields) {
  if (err) throw err;

  rows = _rows;
  fields = _fields;
});
connection.execute('SELECT 1 as test', function(err, _rows, _fields) {
  if (err) throw err;

  rows1 = _rows;
  fields = _fields;
});

connection.execute('INSERT INTO announcements(title, text) VALUES(?, ?)', ['Есть место, где заканчивается тротуар', 'Расти борода, расти'], function(err) {
  if (err) throw err;
});
connection.execute('INSERT INTO announcements(title, text) VALUES(?, ?)', ['Граждане Российской Федерации имеют право собираться мирно без оружия', 'проводить собрания, митинги и демонстрации, шествия и пикетирование'], function(err) {
  if (err) throw err;
});
connection.execute('SELECT * FROM announcements', function (err, rows) {
  if (err) throw err;
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, 'Есть место, где заканчивается тротуар');
  assert.equal(rows[0].text, 'Расти борода, расти');
  assert.equal(rows[1].title, 'Граждане Российской Федерации имеют право собираться мирно без оружия');
  assert.equal(rows[1].text, 'проводить собрания, митинги и демонстрации, шествия и пикетирование');
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows, [{'test': 124}]);
  assert.deepEqual(rows1, [{'test': 1}]);
  assert.equal(fields[0].name, 'test');
});
