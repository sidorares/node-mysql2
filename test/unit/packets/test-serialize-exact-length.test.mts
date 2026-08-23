import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import ClientConstants from '../../../lib/constants/client.js';
import Execute from '../../../lib/packets/execute.js';
import Query from '../../../lib/packets/query.js';

const { TypedParameter } = mysql;

const { toParameter } =
  await import('../../../lib/packets/encode_parameter.js');
const { default: Packet } = await import('../../../lib/packets/packet.js');

const CLIENT_QUERY_ATTRIBUTES = ClientConstants.CLIENT_QUERY_ATTRIBUTES;
const UTF8MB4_CHARSET = 224;

const parameterMatrix: [string, unknown[]][] = [
  ['no parameters', []],
  ['null', [null]],
  ['booleans', [true, false]],
  ['numbers', [0, 42, -1.5, Number.NaN, Number.POSITIVE_INFINITY]],
  ['strings', ['', 'ascii', 'ünïcødé 汉字 🙂', 'x'.repeat(300)]],
  ['buffers', [Buffer.alloc(0), Buffer.from('abc'), Buffer.alloc(300, 1)]],
  ['dates', [new Date(2026, 0, 2, 3, 4, 5, 678)]],
  ['json objects', [{ a: [1, 'two', null] }, [1, 2, 3]]],
  ['bigint', [123456789n]],
  [
    'nine nulls spilling the bitmap',
    [null, null, null, null, null, null, null, null, null],
  ],
  [
    'typed integers',
    [
      TypedParameter.TINY(1),
      TypedParameter.SHORT.unsigned(65535),
      TypedParameter.INT(-5),
      TypedParameter.BIGINT.unsigned(18446744073709551615n),
    ],
  ],
  [
    'typed temporal',
    [
      TypedParameter.DATETIME(new Date(2026, 3, 4, 5, 6, 7, 890)),
      TypedParameter.DATE(new Date(2026, 3, 4)),
      TypedParameter.TIME('00:00:00'),
      TypedParameter.TIME('01:02:03'),
      TypedParameter.TIME('123:04:05.5'),
    ],
  ],
  [
    'typed text and nulls',
    [
      TypedParameter.VARCHAR('ab'),
      TypedParameter.JSON({ a: 1 }),
      TypedParameter.BLOB(Buffer.from('xy')),
      TypedParameter.NULL(),
      TypedParameter.INT(null),
    ],
  ],
];

describe('toParameter length matches the bytes its writer emits', () => {
  for (const [name, values] of parameterMatrix) {
    it(name, () => {
      for (const value of values) {
        const parameter = toParameter(value, 'utf8', 'local', false);
        const buffer = Buffer.alloc(1024);
        const packet = new Packet(0, buffer, 0, buffer.length);
        packet.offset = 0;
        parameter.writer.call(packet, parameter.value);
        strict.equal(
          packet.offset,
          parameter.isNull ? 0 : parameter.length,
          `written bytes != declared length for ${String(value)}`
        );
      }
    });
  }
});

describe('COM_STMT_EXECUTE single-pass serialization fills the buffer exactly', () => {
  for (const [name, values] of parameterMatrix) {
    for (const flags of [0, CLIENT_QUERY_ATTRIBUTES]) {
      it(`${name} (${flags ? 'attribute' : 'legacy'} format)`, () => {
        const packet = new Execute(
          3,
          values,
          UTF8MB4_CHARSET,
          'local',
          undefined,
          flags
        ).toPacket();
        strict.equal(packet.offset, packet.buffer.length);
        strict.equal(packet.length(), packet.buffer.length);
      });
    }
  }

  it('with attributes, including multibyte names', () => {
    const attributes = {
      tag: 'test',
      nâmé汉: 42,
      gone: null,
      typed: TypedParameter.BIGINT.unsigned(1n),
    };
    const packet = new Execute(
      3,
      ['value'],
      UTF8MB4_CHARSET,
      'local',
      attributes,
      CLIENT_QUERY_ATTRIBUTES
    ).toPacket();
    strict.equal(packet.offset, packet.buffer.length);
  });
});

describe('COM_STMT_EXECUTE hand-computed packet sizes', () => {
  // 4 header + 1 command + 4 statement id + 1 flags + 4 iteration count = 14
  it('one TINY parameter, legacy format', () => {
    const packet = new Execute(
      1,
      [true],
      UTF8MB4_CHARSET,
      'local',
      undefined,
      0
    ).toPacket();
    // 14 + 1 null bitmap + 1 bind flag + 2 type/unsigned + 1 value
    strict.equal(packet.buffer.length, 19);
  });

  it('one TINY parameter, attribute format', () => {
    const packet = new Execute(
      1,
      [true],
      UTF8MB4_CHARSET,
      'local',
      undefined,
      CLIENT_QUERY_ATTRIBUTES
    ).toPacket();
    // 19 + 1 parameter count + 1 empty parameter name
    strict.equal(packet.buffer.length, 21);
  });
});

describe('COM_QUERY with attributes fills the buffer exactly', () => {
  it('hand-computed size for one string attribute', () => {
    const packet = new Query(
      'SELECT 1',
      UTF8MB4_CHARSET,
      { a: 'bc' },
      CLIENT_QUERY_ATTRIBUTES
    ).toPacket();
    // 4 header + 1 command + 1 count + 1 set count + 1 bitmap + 1 bind flag
    // + 2 type/unsigned + 2 name + 3 value + 8 sql
    strict.equal(packet.buffer.length, 24);
    strict.equal(packet.offset, packet.buffer.length);
  });

  it('multibyte attribute names and values', () => {
    const packet = new Query(
      'SELECT 1',
      UTF8MB4_CHARSET,
      { nâmé汉: 'ünïcødé 🙂', n: null, typed: TypedParameter.TIME('01:02:03') },
      CLIENT_QUERY_ATTRIBUTES
    ).toPacket();
    strict.equal(packet.offset, packet.buffer.length);
  });

  it('nine attributes spill into a second null-bitmap byte', () => {
    const attributes: Record<string, unknown> = {};
    for (let i = 0; i < 9; i++) {
      attributes[`a${i}`] = i === 0 || i === 8 ? null : i;
    }
    const packet = new Query(
      'SELECT 1',
      UTF8MB4_CHARSET,
      attributes,
      CLIENT_QUERY_ATTRIBUTES
    ).toPacket();
    strict.equal(packet.offset, packet.buffer.length);

    packet.offset = 5;
    strict.equal(packet.readLengthCodedNumber(), 9);
    strict.equal(packet.readLengthCodedNumber(), 1);
    strict.equal(packet.readInt8(), 1); // attributes 0-7: only a0 is null
    strict.equal(packet.readInt8(), 1); // attribute 8 is null
    strict.equal(packet.readInt8(), 1); // new_params_bind_flag
  });
});

describe('a writer that drifts from its declared length throws', () => {
  const originalWriteDouble = Packet.prototype.writeDouble;
  const drift = function (this: typeof Packet.prototype, n: number) {
    originalWriteDouble.call(this, n);
    this.offset -= 1;
  };

  it('COM_STMT_EXECUTE', () => {
    Packet.prototype.writeDouble = drift;
    try {
      strict.throws(
        () =>
          new Execute(
            1,
            [1.5],
            UTF8MB4_CHARSET,
            'local',
            undefined,
            0
          ).toPacket(),
        /Internal error: COM_STMT_EXECUTE serialized/
      );
    } finally {
      Packet.prototype.writeDouble = originalWriteDouble;
    }
  });

  it('COM_QUERY', () => {
    Packet.prototype.writeDouble = drift;
    try {
      strict.throws(
        () =>
          new Query(
            'SELECT 1',
            UTF8MB4_CHARSET,
            { a: 1.5 },
            CLIENT_QUERY_ATTRIBUTES
          ).toPacket(),
        /Internal error: COM_QUERY serialized/
      );
    } finally {
      Packet.prototype.writeDouble = originalWriteDouble;
    }
  });
});
