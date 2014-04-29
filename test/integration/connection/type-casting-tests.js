module.exports = function(connection){
  return [
    {type: 'decimal(4,3)', insert: '1.234'},
//  {type: 'decimal(3,3)', insert: 0.33},
    {type: 'tinyint', insert: 1},
    {type: 'smallint', insert: 2},
    {type: 'int', insert: 3},
    {type: 'float', insert: 4.5},
    {type: 'double', insert: 5.5},
    {type: 'bigint', insert: '6', expect: 6},
    {type: 'bigint', insert: 6},
    {type: 'mediumint', insert: 7},
    {type: 'year', insert: 2012},
    {type: 'timestamp', insert: new Date('2012-05-12 11:00:23')},
    {type: 'datetime', insert: new Date('2012-05-12 12:00:23')},
    {type: 'date', insert: new Date('2012-05-12 00:00:00')},
    {type: 'time', insert: '13:13:23'},
    {type: 'time', insert: '-13:13:23'},
    {type: 'time', insert: '413:13:23'},
    {type: 'time', insert: '-413:13:23'},
    {type: 'binary(4)', insert: new Buffer([0, 1, 254, 255])},
    {type: 'varbinary(4)', insert: new Buffer([0, 1, 254, 255])},
    {type: 'tinyblob', insert: new Buffer([0, 1, 254, 255])},
    {type: 'mediumblob', insert: new Buffer([0, 1, 254, 255])},
    {type: 'longblob', insert: new Buffer([0, 1, 254, 255])},
    {type: 'blob', insert: new Buffer([0, 1, 254, 255])},
    {type: 'bit(32)', insert: new Buffer([0, 1, 254, 255])},
    {type: 'char(5)', insert: 'Hello'},
    {type: 'varchar(5)', insert: 'Hello'},
    {type: 'varchar(3) character set utf8 collate utf8_bin', insert: 'bin'},
    {type: 'tinytext', insert: 'Hello World'},
    {type: 'mediumtext', insert: 'Hello World'},
    {type: 'longtext', insert: 'Hello World'},
    {type: 'text', insert: 'Hello World'},
    {type: 'point', insertRaw: 'POINT(1.2,-3.4)', expect: {x:1.2, y:-3.4}, deep: true},
    {type: 'point', insertRaw: (function() {
        var buffer = new Buffer(21);
        buffer.writeUInt8(1, 0);
        buffer.writeUInt32LE(1, 1);
        buffer.writeDoubleLE(-5.6, 5);
        buffer.writeDoubleLE(10.23, 13);
        return 'GeomFromWKB(' + connection.escape(buffer) + ')';
      })(), expect: {x:-5.6, y:10.23}, deep: true},
    {type: 'point', insertRaw: '', insert: null, expect: null},
    {type: 'linestring', insertRaw: 'LINESTRING(POINT(1.2,-3.4),POINT(-5.6,10.23),POINT(0.2,0.7))', expect: [{x:1.2, y:-3.4}, {x:-5.6, y:10.23}, {x:0.2, y:0.7}], deep: true},
    {type: 'polygon', insertRaw: "GeomFromText('POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5))')", expect: [[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:0,y:0}],[{x:5,y:5},{x:7,y:5},{x:7,y:7},{x:5,y:7},{x:5,y:5}]], deep: true},
    {type: 'geometry', insertRaw: 'POINT(1.2,-3.4)', expect: {x:1.2, y:-3.4}, deep: true},
    {type: 'multipoint', insertRaw: "GeomFromText('MULTIPOINT(0 0, 20 20, 60 60)')", expect: [{x:0, y:0}, {x:20, y:20}, {x:60, y:60}], deep: true},
    {type: 'multilinestring', insertRaw: "GeomFromText('MULTILINESTRING((10 10, 20 20), (15 15, 30 15))')", expect: [[{x:10,y:10},{x:20,y:20}],[{x:15,y:15},{x:30,y:15}]], deep: true},
    {type: 'multipolygon', insertRaw: "GeomFromText('MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0)),((5 5,7 5,7 7,5 7, 5 5)))')", expect: [[[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:0,y:0}]],[[{x:5,y:5},{x:7,y:5},{x:7,y:7},{x:5,y:7},{x:5,y:5}]]], deep: true},
    {type: 'geometrycollection', insertRaw: "GeomFromText('GEOMETRYCOLLECTION(POINT(11 10), POINT(31 30), LINESTRING(15 15, 20 20))')", expect: [{x:11,y:10},{x:31,y:30},[{x:15,y:15},{x:20,y:20}]], deep: true}
  ];
};
