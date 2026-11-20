import type { TypeCastField } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import FieldFlags from '../../../lib/constants/field_flags.js';
import Packet from '../../../lib/packets/packet.js';
import getBinaryParser from '../../../lib/parsers/binary_parser.js';
import getStaticBinaryParser from '../../../lib/parsers/static_binary_parser.js';

const { Types } = mysql;

const column = (name: string, columnType: number, flags = 0) => ({
  name,
  columnType,
  characterSet: 63,
  encoding: 'binary',
  flags,
  decimals: 0,
  columnLength: 20,
  schema: 'test',
  table: 't',
});

const fields = [
  column('smallint', Types.SHORT),
  column('usmallint', Types.SHORT, FieldFlags.UNSIGNED),
  column('mediumint', Types.INT24),
  column('int', Types.LONG),
  column('uint', Types.LONG, FieldFlags.UNSIGNED),
  column('bigint', Types.LONGLONG),
  column('ubigint', Types.LONGLONG, FieldFlags.UNSIGNED),
  {
    ...column('varchar', Types.VAR_STRING),
    characterSet: 224,
    encoding: 'utf8',
  },
];

const integers = Buffer.alloc(32);
integers.writeInt16LE(-300, 0);
integers.writeUInt16LE(65535, 2);
integers.writeInt32LE(-8388608, 4);
integers.writeInt32LE(-2147483648, 8);
integers.writeUInt32LE(4294967295, 12);
integers.writeBigInt64LE(-9007199254740993n, 16);
integers.writeBigUInt64LE(18446744073709551615n, 24);

const binaryRowPacket = () => {
  const buf = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from([0]), // status byte
    Buffer.from([0, 0]), // null bitmap
    integers,
    Buffer.from([5]),
    Buffer.from('after'),
  ]);
  return new Packet(0, buf, 0, buf.length);
};

const expected = {
  smallint: '-300',
  usmallint: '65535',
  mediumint: '-8388608',
  int: '-2147483648',
  uint: '4294967295',
  bigint: '-9007199254740993',
  ubigint: '18446744073709551615',
  varchar: 'after',
};

const options = {
  typeCast: (field: TypeCastField) => field.string(),
};

describe('Binary Parser: typeCast field.string() with integer columns', () => {
  it('binary parser should return integers as text protocol strings', () => {
    const Parser = getBinaryParser(fields, options, {});
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.deepEqual(row, expected);
  });

  it('static binary parser should return integers as text protocol strings', () => {
    const Parser = getStaticBinaryParser(fields, options, {});
    const row = new Parser().next(binaryRowPacket(), fields, options);
    strict.deepEqual(row, expected);
  });
});
