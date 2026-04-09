import { describe, it, strict } from 'poku';
import ClientConstants from '../../../lib/constants/client.js';
import CursorType from '../../../lib/constants/cursor.js';
import Types from '../../../lib/constants/types.js';
import Execute from '../../../lib/packets/execute.js';
import Query from '../../../lib/packets/query.js';

const CLIENT_QUERY_ATTRIBUTES = ClientConstants.CLIENT_QUERY_ATTRIBUTES;
const UTF8_CHARSET = 33; // utf8_general_ci

describe('COM_QUERY with query attributes', () => {
  it('should produce the legacy format when CLIENT_QUERY_ATTRIBUTES is not set', () => {
    const q = new Query('SELECT 1', UTF8_CHARSET, { foo: 'bar' }, 0);
    const packet = q.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x03); // COM_QUERY
    const sql = packet.readString(undefined, 'utf8');
    strict.strictEqual(sql, 'SELECT 1');
  });

  it('should encode attributes in the extended COM_QUERY format', () => {
    const attrs = { trace_id: 'abc', count: 42 };
    const q = new Query(
      'SELECT 1',
      UTF8_CHARSET,
      attrs,
      CLIENT_QUERY_ATTRIBUTES
    );
    const packet = q.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x03); // COM_QUERY

    const paramCount = packet.readLengthCodedNumber();
    strict.strictEqual(paramCount, 2);

    const paramSetCount = packet.readLengthCodedNumber();
    strict.strictEqual(paramSetCount, 1);

    // null bitmap: 2 params -> 1 byte, neither is NULL
    const nullBitmap = packet.readInt8();
    strict.strictEqual(nullBitmap, 0);

    // new_params_bind_flag
    strict.strictEqual(packet.readInt8(), 1);

    // param 1: trace_id (string)
    const type1 = packet.readInt8();
    strict.strictEqual(type1, Types.VAR_STRING);
    packet.readInt8(); // unsigned flag
    const name1 = packet.readLengthCodedString('utf8');
    strict.strictEqual(name1, 'trace_id');

    // param 2: count (number -> DOUBLE)
    const type2 = packet.readInt8();
    strict.strictEqual(type2, Types.DOUBLE);
    packet.readInt8(); // unsigned flag
    const name2 = packet.readLengthCodedString('utf8');
    strict.strictEqual(name2, 'count');

    // value 1: length-coded string 'abc'
    const val1 = packet.readLengthCodedString('utf8');
    strict.strictEqual(val1, 'abc');

    // value 2: 8-byte double = 42
    const val2 = packet.readDouble();
    strict.strictEqual(val2, 42);

    // remaining bytes should be the SQL
    const sql = packet.readString(undefined, 'utf8');
    strict.strictEqual(sql, 'SELECT 1');
  });

  it('should handle zero attributes with CLIENT_QUERY_ATTRIBUTES set', () => {
    const q = new Query(
      'SELECT 1',
      UTF8_CHARSET,
      undefined,
      CLIENT_QUERY_ATTRIBUTES
    );
    const packet = q.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x03);
    strict.strictEqual(packet.readLengthCodedNumber(), 0); // parameter_count
    strict.strictEqual(packet.readLengthCodedNumber(), 1); // parameter_set_count
    const sql = packet.readString(undefined, 'utf8');
    strict.strictEqual(sql, 'SELECT 1');
  });

  it('should handle null attribute values', () => {
    const attrs = { gone: null };
    const q = new Query(
      'SELECT 1',
      UTF8_CHARSET,
      attrs,
      CLIENT_QUERY_ATTRIBUTES
    );
    const packet = q.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x03);
    strict.strictEqual(packet.readLengthCodedNumber(), 1);
    strict.strictEqual(packet.readLengthCodedNumber(), 1);

    // null bitmap: 1 param, first bit set
    const nullBitmap = packet.readInt8();
    strict.strictEqual(nullBitmap, 1);

    strict.strictEqual(packet.readInt8(), 1); // new_params_bind_flag

    const type = packet.readInt8();
    strict.strictEqual(type, Types.NULL);
    packet.readInt8(); // unsigned flag
    const name = packet.readLengthCodedString('utf8');
    strict.strictEqual(name, 'gone');

    // no value bytes for NULL, remainder is SQL
    const sql = packet.readString(undefined, 'utf8');
    strict.strictEqual(sql, 'SELECT 1');
  });
});

describe('COM_STMT_EXECUTE with query attributes', () => {
  it('should produce the legacy format when CLIENT_QUERY_ATTRIBUTES is not set', () => {
    const exec = new Execute(
      1,
      ['hello'],
      UTF8_CHARSET,
      'local',
      { foo: 'bar' },
      0
    );
    const packet = exec.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x17); // COM_STMT_EXECUTE
    packet.readInt32(); // stmtId
    const flags = packet.readInt8();
    strict.strictEqual(flags & CursorType.PARAMETER_COUNT_AVAILABLE, 0);
  });

  it('should encode bind params + attributes in extended format', () => {
    const attrs = { tag: 'test' };
    const exec = new Execute(
      42,
      ['hello'],
      UTF8_CHARSET,
      'local',
      attrs,
      CLIENT_QUERY_ATTRIBUTES
    );
    const packet = exec.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x17); // COM_STMT_EXECUTE
    strict.strictEqual(packet.readInt32(), 42); // stmtId

    const flags = packet.readInt8();
    strict.ok(flags & CursorType.PARAMETER_COUNT_AVAILABLE);

    strict.strictEqual(packet.readInt32(), 1); // iteration-count

    // lenenc parameter_count = 1 bind + 1 attr = 2
    const paramCount = packet.readLengthCodedNumber();
    strict.strictEqual(paramCount, 2);

    // null bitmap: 2 params -> 1 byte, neither NULL
    strict.strictEqual(packet.readInt8(), 0);

    // new_params_bind_flag
    strict.strictEqual(packet.readInt8(), 1);

    // bind param: type + unsigned + name (empty for positional)
    const bindType = packet.readInt8();
    strict.strictEqual(bindType, Types.VAR_STRING);
    packet.readInt8(); // unsigned flag
    const bindName = packet.readLengthCodedString('utf8');
    strict.strictEqual(bindName, ''); // positional params have empty name

    // attr param: type + unsigned + name
    const attrType = packet.readInt8();
    strict.strictEqual(attrType, Types.VAR_STRING);
    packet.readInt8(); // unsigned flag
    const attrName = packet.readLengthCodedString('utf8');
    strict.strictEqual(attrName, 'tag');

    // bind value
    const bindVal = packet.readLengthCodedString('utf8');
    strict.strictEqual(bindVal, 'hello');

    // attr value
    const attrVal = packet.readLengthCodedString('utf8');
    strict.strictEqual(attrVal, 'test');
  });

  it('should work with only attributes and no bind params', () => {
    const attrs = { mode: 'fast' };
    const exec = new Execute(
      1,
      [],
      UTF8_CHARSET,
      'local',
      attrs,
      CLIENT_QUERY_ATTRIBUTES
    );
    const packet = exec.toPacket();
    packet.offset = 4;

    strict.strictEqual(packet.readInt8(), 0x17);
    packet.readInt32(); // stmtId
    const flags = packet.readInt8();
    strict.ok(flags & CursorType.PARAMETER_COUNT_AVAILABLE);
    packet.readInt32(); // iteration-count

    strict.strictEqual(packet.readLengthCodedNumber(), 1); // 0 bind + 1 attr

    // null bitmap
    strict.strictEqual(packet.readInt8(), 0);
    strict.strictEqual(packet.readInt8(), 1); // new_params_bind_flag

    const type = packet.readInt8();
    strict.strictEqual(type, Types.VAR_STRING);
    packet.readInt8();
    const name = packet.readLengthCodedString('utf8');
    strict.strictEqual(name, 'mode');

    const val = packet.readLengthCodedString('utf8');
    strict.strictEqual(val, 'fast');
  });
});
