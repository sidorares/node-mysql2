'use strict';

module.exports = function(connection) {
  const serverVersion = connection._handshakePacket.serverVersion;
  // mysql8 renamed some standard functions
  // see https://dev.mysql.com/doc/refman/8.0/en/gis-wkb-functions.html
  const stPrefix = serverVersion[0] === '8' ? 'ST_' : '';

  return [
    { type: 'decimal(4,3)', insert: '1.234', columnType: 'NEWDECIMAL' },
    //  {type: 'decimal(3,3)', insert: 0.33},
    { type: 'tinyint', insert: 1, columnType: 'TINY' },
    { type: 'smallint', insert: 2, columnType: 'SHORT' },
    { type: 'int', insert: 3, columnType: 'LONG' },
    { type: 'float', insert: 4.5, columnType: 'FLOAT' },
    { type: 'double', insert: 5.5, columnType: 'DOUBLE' },
    { type: 'bigint', insert: '6', expect: 6, columnType: 'LONGLONG' },
    { type: 'bigint', insert: 6, columnType: 'LONGLONG' },
    { type: 'mediumint', insert: 7, columnType: 'INT24' },
    { type: 'year', insert: 2012, columnType: 'YEAR' },
    { type: 'timestamp', insert: new Date('2012-05-12 11:00:23'), columnType: 'TIMESTAMP' },
    { type: 'datetime', insert: new Date('2012-05-12 12:00:23'), columnType: 'DATETIME' },
    { type: 'date', insert: new Date('2012-05-12 00:00:00'), columnType: 'DATE' },
    { type: 'time', insert: '13:13:23', columnType: 'TIME' },
    { type: 'time', insert: '-13:13:23', columnType: 'TIME' },
    { type: 'time', insert: '413:13:23', columnType: 'TIME' },
    { type: 'time', insert: '-413:13:23', columnType: 'TIME' },
    { type: 'binary(4)', insert: Buffer.from([0, 1, 254, 255]), columnType: 'STRING' },
    { type: 'varbinary(4)', insert: Buffer.from([0, 1, 254, 255]), columnType: 'VAR_STRING' },
    { type: 'tinyblob', insert: Buffer.from([0, 1, 254, 255]), columnType: 'BLOB' },
    { type: 'mediumblob', insert: Buffer.from([0, 1, 254, 255]), columnType: 'BLOB' },
    { type: 'longblob', insert: Buffer.from([0, 1, 254, 255]), columnType: 'BLOB' },
    { type: 'blob', insert: Buffer.from([0, 1, 254, 255]), columnType: 'BLOB' },
    { type: 'bit(32)', insert: Buffer.from([0, 1, 254, 255]), columnType: 'BIT' },
    { type: 'char(5)', insert: 'Hello', columnType: 'STRING' },
    { type: 'varchar(5)', insert: 'Hello', columnType: 'VAR_STRING' },
    { type: 'varchar(3) character set utf8 collate utf8_bin', insert: 'bin', columnType: 'VAR_STRING' },
    { type: 'tinytext', insert: 'Hello World', columnType: 'BLOB' },
    { type: 'mediumtext', insert: 'Hello World', columnType: 'BLOB' },
    { type: 'longtext', insert: 'Hello World', columnType: 'BLOB' },
    { type: 'text', insert: 'Hello World', columnType: 'BLOB' },
    {
      type: 'point',
      insertRaw: 'POINT(1.2,-3.4)',
      expect: { x: 1.2, y: -3.4 },
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'point',
      insertRaw: (function() {
        const buffer = Buffer.alloc(21);
        buffer.writeUInt8(1, 0);
        buffer.writeUInt32LE(1, 1);
        buffer.writeDoubleLE(-5.6, 5);
        buffer.writeDoubleLE(10.23, 13);
        return `${stPrefix}GeomFromWKB(${connection.escape(buffer)})`;
      })(),
      expect: { x: -5.6, y: 10.23 },
      deep: true, 
      columnType: 'GEOMETRY'
    },
    { type: 'point', insertRaw: '', insert: null, expect: null, columnType: 'GEOMETRY' },
    {
      type: 'linestring',
      insertRaw: 'LINESTRING(POINT(1.2,-3.4),POINT(-5.6,10.23),POINT(0.2,0.7))',
      expect: [{ x: 1.2, y: -3.4 }, { x: -5.6, y: 10.23 }, { x: 0.2, y: 0.7 }],
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'polygon',
      insertRaw: `${stPrefix}GeomFromText('POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5))')`,
      expect: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 0, y: 0 }
        ],
        [
          { x: 5, y: 5 },
          { x: 7, y: 5 },
          { x: 7, y: 7 },
          { x: 5, y: 7 },
          { x: 5, y: 5 }
        ]
      ],
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'geometry',
      insertRaw: 'POINT(1.2,-3.4)',
      expect: { x: 1.2, y: -3.4 },
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'multipoint',
      insertRaw: `${stPrefix}GeomFromText('MULTIPOINT(0 0, 20 20, 60 60)')`,
      expect: [{ x: 0, y: 0 }, { x: 20, y: 20 }, { x: 60, y: 60 }],
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'multilinestring',
      insertRaw: `${stPrefix}GeomFromText('MULTILINESTRING((10 10, 20 20), (15 15, 30 15))')`,
      expect: [
        [{ x: 10, y: 10 }, { x: 20, y: 20 }],
        [{ x: 15, y: 15 }, { x: 30, y: 15 }]
      ],
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'multipolygon',
      insertRaw: `${stPrefix}GeomFromText('MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0)),((5 5,7 5,7 7,5 7, 5 5)))')`,
      expect: [
        [
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }
          ]
        ],
        [
          [
            { x: 5, y: 5 },
            { x: 7, y: 5 },
            { x: 7, y: 7 },
            { x: 5, y: 7 },
            { x: 5, y: 5 }
          ]
        ]
      ],
      deep: true, 
      columnType: 'GEOMETRY'
    },
    {
      type: 'geometrycollection',
      insertRaw: `${stPrefix}GeomFromText('GEOMETRYCOLLECTION(POINT(11 10), POINT(31 30), LINESTRING(15 15, 20 20))')`,
      expect: [
        { x: 11, y: 10 },
        { x: 31, y: 30 },
        [{ x: 15, y: 15 }, { x: 20, y: 20 }]
      ],
      deep: true, 
      columnType: 'GEOMETRY'
    }
  ];
};
