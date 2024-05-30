'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();
const connection1 = common.createConnection({ dateStrings: true });
const connection2 = common.createConnection({ dateStrings: ['DATE'] });
const connectionZ = common.createConnection({ timezone: 'Z' });
const connection0930 = common.createConnection({ timezone: '+09:30' });

let rows,
  rowsZ,
  rows0930,
  rows1,
  rows1Z,
  rows10930,
  rows2,
  rows3,
  rows4,
  rows5,
  rows6,
  rows7,
  rows8;

const date = new Date('1990-01-01 08:15:11 UTC');
const datetime = new Date('2010-12-10 14:12:09.019473');

const date1 = new Date('2000-03-03 08:15:11 UTC');
const date2 = '2010-12-10 14:12:09.019473';
const date3 = null;
const date4 = '2010-12-10 14:12:09.123456';
const date5 = '2010-12-10 14:12:09.019';

function adjustTZ(d, offset) {
  if (offset === undefined) {
    offset = d.getTimezoneOffset();
  }
  return new Date(d.getTime() - offset * 60000);
}

function toMidnight(d, offset) {
  const t = d.getTime();
  if (offset === undefined) {
    offset = d.getTimezoneOffset();
  }
  return new Date(t - (t % (24 * 60 * 60 * 1000)) + offset * 60000);
}

function formatUTCDate(d) {
  return d.toISOString().substring(0, 10);
}

function formatUTCDateTime(d, precision) {
  const raw = d.toISOString().replace('T', ' ');
  if (precision === undefined) {
    precision = 0;
  }
  return precision <= 3
    ? raw.substring(0, 19 + (precision && 1) + precision)
    : raw.substring(0, 23) + '0'.repeat(precision - 3);
}

connection.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 DATETIME(3), d3 DATETIME(6))',
);
connection.query('INSERT INTO t set d1=?, d2=?, d3=?', [
  date,
  datetime,
  datetime,
]);

connection1.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 TIMESTAMP, d3 DATETIME, d4 DATETIME, d5 DATETIME(6), d6 DATETIME(3))',
);
connection1.query('INSERT INTO t set d1=?, d2=?, d3=?, d4=?, d5=?, d6=?', [
  date,
  date1,
  date2,
  date3,
  date4,
  date5,
]);

connection2.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 TIMESTAMP, d3 DATETIME, d4 DATETIME, d5 DATETIME(6), d6 DATETIME(3))',
);
connection2.query('INSERT INTO t set d1=?, d2=?, d3=?, d4=?, d5=?, d6=?', [
  date,
  date1,
  date2,
  date3,
  date4,
  date5,
]);

connectionZ.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 DATETIME(3), d3 DATETIME(6))',
);
connectionZ.query("set time_zone = '+00:00'");
connectionZ.query('INSERT INTO t set d1=?, d2=?, d3=?', [
  date,
  datetime,
  datetime,
]);

connection0930.query(
  'CREATE TEMPORARY TABLE t (d1 DATE, d2 DATETIME(3), d3 DATETIME(6))',
);
connection0930.query("set time_zone = '+09:30'");
connection0930.query('INSERT INTO t set d1=?, d2=?, d3=?', [
  date,
  datetime,
  datetime,
]);

const dateAsStringExpected = [
  {
    d1: formatUTCDate(adjustTZ(date)),
    d2: formatUTCDateTime(adjustTZ(date1)),
    d3: date2.substring(0, 19),
    d4: date3,
    d5: date4,
    d6: date5,
  },
];

connection.execute(
  'select from_unixtime(?) t',
  [(+date).valueOf() / 1000],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
  },
);

connectionZ.execute(
  'select from_unixtime(?) t',
  [(+date).valueOf() / 1000],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rowsZ = _rows;
  },
);

connection0930.execute(
  'select from_unixtime(?) t',
  [(+date).valueOf() / 1000],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows0930 = _rows;
  },
);

connection.query('select from_unixtime(631152000) t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
});

connectionZ.query('select from_unixtime(631152000) t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows1Z = _rows;
});

connection0930.query('select from_unixtime(631152000) t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows10930 = _rows;
});

connection.query(
  'select *, cast(d1 as char) as d4, cast(d2 as char) as d5, cast(d3 as char) as d6 from t',
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows2 = _rows;
    connection.end();
  },
);

connectionZ.execute(
  'select *, cast(d1 as char) as d4, cast(d2 as char) as d5, cast(d3 as char) as d6 from t',
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows3 = _rows;
    connectionZ.end();
  },
);

connection1.query('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows4 = _rows;
});

connection1.execute('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows5 = _rows;
});

connection1.execute(
  'select * from t where d6 = ?',
  [new Date(date5)],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows6 = _rows;
    connection1.end();
  },
);

connection2.execute('select * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows8 = _rows;
  connection2.end();
});

connection0930.execute(
  'select *, cast(d1 as char) as d4, cast(d2 as char) as d5, cast(d3 as char) as d6 from t',
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows7 = _rows;
    connection0930.end();
  },
);

process.on('exit', () => {
  const connBadTz = common.createConnection({ timezone: 'utc' });
  assert.equal(connBadTz.config.timezone, 'Z');
  connBadTz.end();

  // local TZ
  assert.equal(rows[0].t.constructor, Date);
  assert.equal(rows[0].t.getDate(), date.getDate());
  assert.equal(rows[0].t.getHours(), date.getHours());
  assert.equal(rows[0].t.getMinutes(), date.getMinutes());
  assert.equal(rows[0].t.getSeconds(), date.getSeconds());

  // UTC
  assert.equal(rowsZ[0].t.constructor, Date);
  assert.equal(rowsZ[0].t.getDate(), date.getDate());
  assert.equal(rowsZ[0].t.getHours(), date.getHours());
  assert.equal(rowsZ[0].t.getMinutes(), date.getMinutes());
  assert.equal(rowsZ[0].t.getSeconds(), date.getSeconds());

  // +09:30
  assert.equal(rows0930[0].t.constructor, Date);
  assert.equal(rows0930[0].t.getDate(), date.getDate());
  assert.equal(rows0930[0].t.getHours(), date.getHours());
  assert.equal(rows0930[0].t.getMinutes(), date.getMinutes());
  assert.equal(rows0930[0].t.getSeconds(), date.getSeconds());

  // local TZ
  assert.equal(rows1[0].t.constructor, Date);
  assert.equal(
    rows1[0].t.getTime(),
    new Date('Mon Jan 01 1990 00:00:00 UTC').getTime(),
  );

  // UTC
  assert.equal(rows1Z[0].t.constructor, Date);
  assert.equal(
    rows1Z[0].t.getTime(),
    new Date('Mon Jan 01 1990 00:00:00 UTC').getTime(),
  );

  // +09:30
  assert.equal(rows10930[0].t.constructor, Date);
  assert.equal(
    rows10930[0].t.getTime(),
    new Date('Mon Jan 01 1990 00:00:00 UTC').getTime(),
  );

  // local TZ
  assert.equal(rows2[0].d1.getTime(), toMidnight(date).getTime());
  assert.equal(rows2[0].d2.getTime(), datetime.getTime());
  assert.equal(rows2[0].d3.getTime(), datetime.getTime());
  assert.equal(rows2[0].d4, formatUTCDate(adjustTZ(date)));
  assert.equal(rows2[0].d5, formatUTCDateTime(adjustTZ(datetime), 3));
  assert.equal(rows2[0].d6, formatUTCDateTime(adjustTZ(datetime), 6));

  // UTC
  assert.equal(rows3[0].d1.getTime(), toMidnight(date, 0).getTime());
  assert.equal(rows3[0].d2.getTime(), datetime.getTime());
  assert.equal(rows3[0].d3.getTime(), datetime.getTime());
  assert.equal(rows3[0].d4, formatUTCDate(date));
  assert.equal(rows3[0].d5, formatUTCDateTime(datetime, 3));
  assert.equal(rows3[0].d6, formatUTCDateTime(datetime, 6));

  // dateStrings
  assert.deepEqual(rows4, dateAsStringExpected);
  assert.deepEqual(rows5, dateAsStringExpected);
  assert.equal(rows6.length, 1);

  // dateStrings as array
  assert.equal(rows8[0].d1, '1990-01-01');
  assert.equal(rows8[0].d1.constructor, String);
  assert.equal(rows8[0].d2.constructor, Date);
  assert.equal(rows8[0].d3.constructor, Date);
  assert.equal(rows8[0].d4, null);
  assert.equal(rows8[0].d5.constructor, Date);
  assert.equal(rows8[0].d6.constructor, Date);

  // +09:30
  const tzOffset = -570;
  assert.equal(rows7[0].d1.getTime(), toMidnight(date, tzOffset).getTime());
  assert.equal(rows7[0].d2.getTime(), datetime.getTime());
  assert.equal(rows7[0].d3.getTime(), datetime.getTime());
  assert.equal(rows7[0].d4, formatUTCDate(adjustTZ(date, tzOffset)));
  assert.equal(rows7[0].d5, formatUTCDateTime(adjustTZ(datetime, tzOffset), 3));
  assert.equal(rows7[0].d6, formatUTCDateTime(adjustTZ(datetime, tzOffset), 6));
});
