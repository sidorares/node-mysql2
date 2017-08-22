var common = require('../../common');
var connection = common.createConnection({ dateStrings: false });
var assert = require('assert');

var tableName = 'dates';
var testFields = ['id', 'date1', 'date2', 'name'];
var testRows = [
  [1, '2017-07-26 09:36:42.000', '2017-07-29 09:22:24.000', 'John'],
  [2, '2017-07-26 09:36:42.123', '2017-07-29 09:22:24.321', 'Jane']
];
var expected = [
  {
    id: 1,
    date1: new Date('2017-07-26T09:36:42.000Z'),
    date2: new Date('2017-07-29T09:22:24.000Z'),
    name: 'John'
  },
  {
    id: 2,
    date1: new Date('2017-07-26T09:36:42.123Z'),
    date2: new Date('2017-07-29T09:22:24.321Z'),
    name: 'Jane'
  }
];

var actualRows = null;

connection.query(
  [
    'CREATE TEMPORARY TABLE `' + tableName + '` (',
    ' `' + testFields[0] + '` int,',
    ' `' + testFields[1] + '` TIMESTAMP(3),',
    ' `' + testFields[2] + '` DATETIME(3),',
    ' `' + testFields[3] + '` varchar(10)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join(' '),
  function(err) {
    assert.ifError(err);
    connection.query(
      [
        'INSERT INTO `' + tableName + '` VALUES',
        '(' +
          testRows[0][0] +
          ',"' +
          testRows[0][1] +
          '", "' +
          testRows[0][2] +
          '", "' +
          testRows[0][3] +
          '"),',
        '(' +
          testRows[1][0] +
          ',"' +
          testRows[1][1] +
          '", "' +
          testRows[1][2] +
          '", "' +
          testRows[1][3] +
          '")'
      ].join(' '),
      executeTest
    );
  }
);

function executeTest(err) {
  assert.ifError(err);
  connection.execute('SELECT * FROM `' + tableName + '`', function(
    err,
    rows,
    fields
  ) {
    assert.ifError(err);
    actualRows = rows;
    connection.end();
  });
}

process.on('exit', function() {
  expected.map(function(exp, index) {
    var row = actualRows[index];
    Object.keys(exp).map(function(key) {
      if (key.startsWith('date')) {
        assert.equal(+exp[key], +row[key]);
      } else {
        assert.equal(exp[key], row[key]);
      }
    });
  });
});
