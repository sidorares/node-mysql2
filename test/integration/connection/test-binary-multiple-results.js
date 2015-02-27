var mysql = require('../../common.js').createConnection({multipleStatements: true});
var assert = require('assert');
mysql.query('CREATE TEMPORARY TABLE no_rows (test int)');
mysql.query('CREATE TEMPORARY TABLE some_rows (test int)');
mysql.query('INSERT INTO some_rows values(0)');
mysql.query('INSERT INTO some_rows values(42)');
mysql.query('INSERT INTO some_rows values(314149)');

var clone = function(obj) { return JSON.parse(JSON.stringify(obj)); };

var rs1 = {
  affectedRows: 0,
  fieldCount: 0,
  insertId: 0,
  serverStatus: 10,
  warningStatus: 0
};
var rs2 = clone(rs1);
rs2.serverStatus = 2;
var rs3 = clone(rs1);
rs3.serverStatus = 34;

var twoInsertResult = [[rs1, rs2], [undefined, undefined], 2];
var select1 = [{"1":"1"}];
var select2 = [{"2":"2"}];
var fields1 = [{
  catalog: "def",
  characterSet: 63,
  columnLength: 1,
  columnType: 8,
  decimals: 0,
  flags: 129,
  name: "1",
  orgName: "",
  orgTable: "",
  schema: "",
  table: ""
}];
var nr_fields = [{
  catalog: "def",
  characterSet: 63,
  columnLength: 11,
  columnType: 3,
  decimals: 0,
  flags: 0,
  name: "test",
  orgName: "test",
  orgTable: "no_rows",
  schema: mysql.config.database,
  table: "no_rows"
}];

var sr_fields = clone(nr_fields);
sr_fields[0].orgTable = "some_rows";
sr_fields[0].table = "some_rows";
var select3 = [{"test":0},{"test":42},{"test":314149}];

var fields2 = clone(fields1);
fields2[0].name = "2";

var tests = [
  ["select * from some_rows", [[select3,rs3],[sr_fields,undefined],2]], //  select 3 rows
  ["SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT; SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS", [rs2, undefined, 1]],
  ["set @a = 1", [rs2, undefined, 1]],
  ["set @a = 1; set @b = 2", [rs2, undefined, 1]],
  ["select 1; select 2", [[select1,select2,rs2],[fields1,fields2,undefined], 3]],
  ["set @a = 1; select 1", [[select1,rs2], [fields1,undefined], 2]],
  ["select 1; set @a = 1", [[select1, rs2], [fields1, undefined], 2]],
  ["select * from no_rows", [[[], rs3], [nr_fields, undefined], 2]],    // select 0 rows"
  ["set @a = 1; select * from no_rows", [[[], rs3], [nr_fields, undefined], 2]], // insert + select 0 rows
  ["select * from no_rows; set @a = 1", [[[], rs3], [nr_fields, undefined], 2]], //  select 0 rows + insert
  ["set @a = 1; select * from some_rows", [[select3, rs3],[sr_fields,undefined],2]], // insert + select 3 rows
  ["select * from some_rows; set @a = 1", [[select3, rs3],[sr_fields,undefined],2]] //  select 3 rows + insert
];

function procedurise(sql) {
  return [
    'DROP PROCEDURE IF EXISTS _as_sp_call;',
    'CREATE PROCEDURE _as_sp_call()',
    'BEGIN',
     sql + ';',
    'END',
  ].join('\n');
}

function do_test(testIndex) {
  var next = function() {
    if (testIndex + 1 < tests.length)
      do_test(testIndex + 1);
    else {
      mysql.end();
    }
  };

  var entry = tests[testIndex];
  var sql = entry[0];
  var origSql = sql;
  var expectation = entry[1];
  // prepared statements do not support multiple statements itself, we need to wrap quey in a stored procedure
  var sp = procedurise(sql);
  mysql.query(sp, function(err) {
    if (err)
        throw(err);
    sql = "CALL _as_sp_call()"; // this call is allowed with prepared statements, and result contain multiple statements
    mysql.query(sql, function(err, _rows, _columns, _numResults) {
      if (err)
        throw err;

      var arrOrColumn = function (c) {
        if (Array.isArray(c))
          return c.map(arrOrColumn);

        if (typeof c == 'undefined')
          return void(0);

        return c.inspect();
      };

      assert.deepEqual(expectation[0], _rows);
      assert.deepEqual(expectation[1], arrOrColumn(_columns));
      assert.deepEqual(expectation[2], _numResults);

      var q = mysql.execute(sql);
      var resIndex = 0;
      var rowIndex = 0;
      function checkRow(row, index) {

        if (_numResults == 1) {
          assert.equal(index, 0);
          if (row.constructor.name == 'ResultSetHeader')
            assert.deepEqual(_rows, row);
          else
            assert.deepEqual(_rows[rowIndex], row);
        } else {
          if (resIndex != index) {
            rowIndex = 0;
            resIndex = index;
          }
          if (row.constructor.name == 'ResultSetHeader')
            assert.deepEqual(_rows[index], row);
          else
            assert.deepEqual(_rows[index][rowIndex], row);
        }
        rowIndex++;
      }
      function checkFields(fields, index) {
        if (_numResults == 1) {
          assert.equal(index, 0);
          assert.deepEqual(arrOrColumn(_columns), arrOrColumn(fields));
        }
        else
          assert.deepEqual(arrOrColumn(_columns[index]), arrOrColumn(fields));
      }
      q.on('result', checkRow);
      q.on('fields', checkFields);
      q.on('end', next);
    });
  });
}
do_test(0);
