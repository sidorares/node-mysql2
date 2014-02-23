// http://dev.mysql.com/doc/internals/en/query-event.html

var keys = {
  FLAGS2: 0,
  SQL_MODE: 1,
  CATALOG: 2,
  AUTO_INCREMENT: 3,
  CHARSET: 4,
  TIME_ZONE: 5,
  CATALOG_NZ: 6,
  LC_TIME_NAMES: 7,
  CHARSET_DATABASE: 8,
  TABLE_MAP_FOR_UPDATE: 9,
  MASTER_DATA_WRITTEN: 10,
  INVOKERS: 11,
  UPDATED_DB_NAMES: 12,
  MICROSECONDS: 3
};

module.exports = function parseStatusVars(buffer) {
  var result = [];
  var offset = 0;
  var key, val;
  var length, username, hostname, prevOffset;
  while(offset < buffer.length) {
    key = buffer[offset++];
    val = [key];
    switch(key) {
    case keys.FLAGS2:
      val.push(buffer.readUInt32LE(offset)); offset += 4; break;
    case keys.SQL_MODE:
      // value is 8 bytes, but all dcumented flags are in first 4 bytes
      val.push(buffer.readUInt32LE(offset)); offset += 8; break;
    case keys.CATALOG:
      length = buffer[offset++];
      val.push(buffer.toString('utf8', offset, offset + length));
      offset += length + 1; // null byte after string
      break;
    case keys.CHARSET:
      val.push({
        charsetClient:       buffer.readUInt16LE(offset),
        collationConnection: buffer.readUInt16LE(offset + 2),
        collationServer:     buffer.readUInt16LE(offset + 4)
      });
      offset += 6;
      break;
    case keys.TIME_ZONE:
      length = buffer[offset++];
      val.push(buffer.toString('utf8', offset, offset + length));
      offset += length; // no null byte
      break;
    case keys.CATALOG_NZ:
      length = buffer[offset++];
      val.push(buffer.toString('utf8', offset, offset + length));
      offset += length ; // no null byte
      break;
    case keys.LC_TIME_NAMES:
      val.push(buffer.readUInt16LE(offset)); offset += 2; break;
    case keys.CHARSET_DATABASE:
      val.push(buffer.readUInt16LE(offset)); offset += 2; break;
    case keys.TABLE_MAP_FOR_UPDATE:
      val.push([ // 64 bit field, represent as two values
        buffer.readUInt32LE(offset),
        buffer.readUInt32LE(offset + 4)
      ]); 
      offset += 8; 
      break;
    case keys.MASTER_DATA_WRITTEN:
      val.push(buffer.readUInt32LE(offset)); offset += 4; break;
    case keys.INVOKERS:
      length = buffer[offset++];
      username = buffer.toString('utf8', offset, offset + length);
      offset += length;
      length = buffer[offset++];
      hostname = buffer.toString('utf8', offset, offset + length);
      offset += length;
      val.push({
        username: username,
        hostname: hostname
      });
      break;
    case keys.UPDATED_DB_NAMES:
      length = buffer[offset++];
      // length - number of null-terminated strings
      val.push([]); // we'll store them as array here
      for (; length; --length) {
        prevOffset = offset;
        // fast forward to null terminating byte
        while(buffer[offset++] && offset < buffer.length) {}
        val[1].push(buffer.toString('utf8', prevOffset, offset-1));
      }
      break;
    case keys.MICROSECONDS:
      val.push(
        buffer.readInt16LE(offset) + (buffsre[offset+2] << 16)
      );
      offset += 3;
    }    
    result.push(val);
  }
  return result;
}