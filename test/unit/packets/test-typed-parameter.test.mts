import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';

const { TypedParameter, Types } = mysql;

const { toParameter } =
  await import('../../../lib/packets/encode_parameter.js');
const { default: Packet } = await import('../../../lib/packets/packet.js');
const { TypedParameter: Container } =
  await import('../../../lib/packets/typed_parameter.js');

const encode = (value: unknown) => toParameter(value, 'utf8', 'local', false);

const wire = (value: unknown) => {
  const parameter = encode(value);
  const buffer = Buffer.alloc(64);
  const packet = new Packet(0, buffer, 0, buffer.length);
  packet.offset = 0;
  parameter.writer.call(packet, parameter.value);
  return buffer.subarray(0, packet.offset);
};

describe('TypedParameter: declared type reaches the wire', () => {
  const cases: [string, unknown, number][] = [
    ['TINY', TypedParameter.TINY(1), Types.TINY],
    ['SHORT', TypedParameter.SHORT(1), Types.SHORT],
    ['LONG', TypedParameter.INT(1), Types.LONG],
    ['LONGLONG', TypedParameter.BIGINT(1), Types.LONGLONG],
    ['FLOAT', TypedParameter.FLOAT(1.5), Types.FLOAT],
    ['DOUBLE', TypedParameter.DOUBLE(1.5), Types.DOUBLE],
    ['DATETIME', TypedParameter.DATETIME(new Date()), Types.DATETIME],
    ['TIME', TypedParameter.TIME('01:02:03'), Types.TIME],
    ['VAR_STRING', TypedParameter.VARCHAR('a'), Types.VARCHAR],
    ['BLOB', TypedParameter.BLOB(Buffer.from('a')), Types.BLOB],
    ['JSON', TypedParameter.JSON({ a: 1 }), Types.JSON],
    ['NULL', TypedParameter.NULL(), Types.NULL],
  ];

  for (const [name, parameter, expected] of cases) {
    it(`sends ${name}`, () => {
      strict.equal(encode(parameter).type, expected);
    });
  }
});

// MySQL rejects INT24, YEAR, ENUM, SET, BIT and GEOMETRY as bind types and
// MariaDB rejects JSON and VECTOR, so a declared type is transmitted as the
// nearest type both servers accept.
describe('TypedParameter: declared types the servers refuse to bind', () => {
  const mapped: [string, unknown, number][] = [
    ['MEDIUMINT as LONG', TypedParameter.MEDIUMINT(1), Types.LONG],
    ['YEAR as SHORT', TypedParameter.YEAR(2020), Types.SHORT],
    ['ENUM as STRING', TypedParameter.ENUM('a'), Types.STRING],
    ['SET as STRING', TypedParameter.SET('a'), Types.STRING],
    ['VECTOR as BLOB', TypedParameter.VECTOR(Buffer.from('a')), Types.BLOB],
  ];

  for (const [name, parameter, expected] of mapped) {
    it(`sends ${name}`, () => {
      strict.equal(encode(parameter).type, expected);
    });
  }

  it('sends JSON as a string when the server has no JSON bind type', () => {
    const parameter = TypedParameter.JSON({ a: 1 });

    strict.equal(
      toParameter(parameter, 'utf8', 'local', false).type,
      Types.JSON
    );
    strict.equal(
      toParameter(parameter, 'utf8', 'local', true).type,
      Types.VAR_STRING
    );
  });

  it('offers no factory for a type with no unambiguous encoding', () => {
    strict.equal(TypedParameter.BIT, undefined);
    strict.equal(TypedParameter.GEOMETRY, undefined);
  });
});

describe('TypedParameter: integer encoding', () => {
  it('encodes LONGLONG as 8 little-endian bytes', () => {
    strict.deepEqual(
      wire(TypedParameter.BIGINT(1)),
      Buffer.from([1, 0, 0, 0, 0, 0, 0, 0])
    );
  });

  it("encodes negative values as two's complement", () => {
    strict.deepEqual(wire(TypedParameter.TINY(-1)), Buffer.from([0xff]));
    strict.deepEqual(
      wire(TypedParameter.BIGINT(-1n)),
      Buffer.from([255, 255, 255, 255, 255, 255, 255, 255])
    );
  });

  it('keeps integers beyond Number.MAX_SAFE_INTEGER exact', () => {
    strict.deepEqual(
      wire(TypedParameter.BIGINT('9007199254740993')),
      Buffer.from([1, 0, 0, 0, 0, 0, 32, 0])
    );
  });

  it('marks unsigned parameters', () => {
    strict.equal(encode(TypedParameter.BIGINT.unsigned(1)).unsigned, true);
    strict.equal(encode(TypedParameter.BIGINT(1)).unsigned, false);
  });

  it('accepts the full unsigned 64-bit range', () => {
    strict.deepEqual(
      wire(TypedParameter.BIGINT.unsigned('18446744073709551615')),
      Buffer.from([255, 255, 255, 255, 255, 255, 255, 255])
    );
  });
});

describe('TypedParameter: non-integer encoders', () => {
  it('writes FLOAT as four little-endian bytes', () => {
    strict.deepEqual(
      wire(TypedParameter.FLOAT(1.5)),
      Buffer.from([0x00, 0x00, 0xc0, 0x3f])
    );
  });

  it('writes DOUBLE as eight little-endian bytes', () => {
    strict.deepEqual(
      wire(TypedParameter.DOUBLE(1.5)),
      Buffer.from([0, 0, 0, 0, 0, 0, 0xf8, 0x3f])
    );
  });

  it('writes a DATE as the binary date form', () => {
    const bytes = wire(TypedParameter.DATE(new Date(2020, 0, 2, 3, 4, 5)));

    strict.equal(bytes[0], 11);
    strict.equal(bytes.readUInt16LE(1), 2020);
    strict.equal(bytes[3], 1);
    strict.equal(bytes[4], 2);
  });

  it('accepts a TIMESTAMP given as a parsable string', () => {
    strict.equal(
      encode(TypedParameter.TIMESTAMP('2020-01-02T03:04:05Z')).type,
      Types.TIMESTAMP
    );
  });

  it('writes a TIME from HH:MM:SS with microseconds', () => {
    strict.deepEqual(
      wire(TypedParameter.TIME('26:03:04.500000')),
      Buffer.from([12, 0, 1, 0, 0, 0, 2, 3, 4, 0x20, 0xa1, 0x07, 0]).subarray(
        0,
        13
      )
    );
  });

  it('writes a negative TIME', () => {
    const bytes = wire(TypedParameter.TIME('-01:02:03'));

    strict.equal(bytes[0], 8);
    strict.equal(bytes[1], 1);
  });

  it('writes a zero TIME as an empty value', () => {
    strict.deepEqual(wire(TypedParameter.TIME('00:00:00')), Buffer.from([0]));
  });

  it('accepts a TIME given in milliseconds', () => {
    const bytes = wire(TypedParameter.TIME(3723000));

    strict.equal(bytes[1], 0);
    strict.equal(bytes[6], 1);
    strict.equal(bytes[7], 2);
    strict.equal(bytes[8], 3);
  });

  it('writes a length coded string for the text types', () => {
    strict.deepEqual(
      wire(TypedParameter.VARCHAR('ab')),
      Buffer.from([2, 0x61, 0x62])
    );
    strict.deepEqual(
      wire(TypedParameter.DECIMAL('1.50')),
      Buffer.from([4, 0x31, 0x2e, 0x35, 0x30])
    );
  });

  it('stringifies a value the caller did not stringify', () => {
    strict.deepEqual(
      wire(TypedParameter.VARCHAR(42)),
      Buffer.from([2, 0x34, 0x32])
    );
  });

  it('has no encoder for a type outside the supported set', () => {
    strict.throws(() => encode(new Container(Types.BIT, 1, false)));
  });
});

describe('TypedParameter: rejects values it cannot represent', () => {
  const invalid: [string, () => unknown][] = [
    ['TINY above range', () => encode(TypedParameter.TINY(128))],
    ['TINY below range', () => encode(TypedParameter.TINY(-129))],
    [
      'unsigned given a negative',
      () => encode(TypedParameter.INT.unsigned(-1)),
    ],
    ['LONG given a fraction', () => encode(TypedParameter.INT(1.5))],
    [
      'BIGINT given an unsafe number',
      () => encode(TypedParameter.BIGINT(Number.MAX_SAFE_INTEGER + 2)),
    ],
    ['BIGINT given a word', () => encode(TypedParameter.BIGINT('abc'))],
    ['DATETIME given a word', () => encode(TypedParameter.DATETIME('abc'))],
    ['TIME given a word', () => encode(TypedParameter.TIME('abc'))],
    ['BIGINT given an object', () => encode(TypedParameter.BIGINT(new Date()))],
    ['DATE given an invalid date', () => encode(TypedParameter.DATE('nope'))],
  ];

  for (const [name, run] of invalid) {
    it(`throws on ${name}`, () => {
      strict.throws(run);
    });
  }
});

describe('TypedParameter: null keeps its declared type', () => {
  it('reports null through the bitmap, not the type byte', () => {
    const parameter = encode(TypedParameter.BIGINT(null));

    strict.equal(parameter.isNull, true);
    strict.equal(parameter.type, Types.LONGLONG);
  });

  it('still sends NULL for an untyped null', () => {
    strict.equal(encode(null).type, Types.NULL);
    strict.equal(encode(null).isNull, true);
  });
});

// The narrow default: a server hint is adopted only when it names an integer
// type and the value is already an integer that fits it.
describe('Integer hints: when the server type is adopted', () => {
  const hint = (columnType: number, unsigned = false) => ({
    columnType,
    flags: unsigned ? 32 : 0,
  });
  const sent = (value: unknown, columnType: number, unsigned = false) =>
    toParameter(value, 'utf8', 'local', false, hint(columnType, unsigned)).type;

  it('adopts an integer hint for an integer value', () => {
    strict.equal(sent(1, Types.LONGLONG), Types.LONGLONG);
    strict.equal(sent(1n, Types.LONGLONG), Types.LONGLONG);
    strict.equal(sent(true, Types.LONGLONG), Types.LONGLONG);
  });

  it('carries the unsigned flag from the hint', () => {
    strict.equal(
      toParameter(1, 'utf8', 'local', false, hint(Types.LONGLONG, true))
        .unsigned,
      true
    );
  });

  it('ignores a hint that does not name an integer type', () => {
    strict.equal(sent(1, Types.VAR_STRING), Types.DOUBLE);
    strict.equal(sent(1, Types.NEWDECIMAL), Types.DOUBLE);
    strict.equal(sent(1, Types.DATETIME), Types.DOUBLE);
  });

  it('ignores the MYSQL_TYPE_NULL hint MariaDB reports', () => {
    strict.equal(sent(1, Types.NULL), Types.DOUBLE);
  });

  it('ignores an integer type the servers refuse to bind', () => {
    strict.equal(sent(2020, Types.YEAR), Types.DOUBLE);
    strict.equal(sent(1, Types.INT24), Types.DOUBLE);
  });

  it('ignores a value that is not already an integer', () => {
    strict.equal(sent(1.5, Types.LONGLONG), Types.DOUBLE);
    strict.equal(sent('1', Types.LONGLONG), Types.VAR_STRING);
    strict.equal(sent('7abc', Types.LONGLONG), Types.VAR_STRING);
    strict.equal(sent(new Date(), Types.LONGLONG), Types.DATETIME);
    strict.equal(sent(null, Types.LONGLONG), Types.NULL);
  });

  it('ignores a value that has already lost precision', () => {
    strict.equal(
      sent(Number.MAX_SAFE_INTEGER + 2, Types.LONGLONG),
      Types.DOUBLE
    );
  });

  it('ignores a value that does not fit the hinted type', () => {
    strict.equal(sent(128, Types.TINY), Types.DOUBLE);
    strict.equal(sent(-1, Types.LONGLONG, true), Types.DOUBLE);
    strict.equal(sent(127, Types.TINY), Types.TINY);
  });

  it('never adopts a hint when a container was passed', () => {
    strict.equal(
      toParameter(
        TypedParameter.VARCHAR(1),
        'utf8',
        'local',
        false,
        hint(Types.LONGLONG)
      ).type,
      Types.VARCHAR
    );
  });
});

describe('TypedParameter: inference is unchanged for plain values', () => {
  const unchanged: [string, unknown, number][] = [
    ['number', 1, Types.DOUBLE],
    ['string', 'a', Types.VAR_STRING],
    ['boolean', true, Types.TINY],
    ['Date', new Date(), Types.DATETIME],
    ['Buffer', Buffer.from('a'), Types.BLOB],
    ['object', { a: 1 }, Types.JSON],
  ];

  for (const [name, value, expected] of unchanged) {
    it(`keeps ${name} inference unchanged`, () => {
      strict.equal(encode(value).type, expected);
    });
  }

  it('never marks a plain value unsigned', () => {
    strict.equal(encode(1).unsigned, false);
  });
});
