import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import ClientConstants from '../../../lib/constants/client.js';
import Execute from '../../../lib/packets/execute.js';
import Query from '../../../lib/packets/query.js';

const { Types } = mysql;
const UTF8MB4 = 224;
const LATIN1 = 8;
const CP1251 = 51;

const unsupported = (received: string) => ({
  name: 'TypeError',
  message: `Bind parameters must be null, a number, boolean, bigint, string, Date, Buffer, ArrayBuffer, TypedArray, DataView, plain object, array, or an object with toJSON(); received ${received}`,
});

const encodeExecute = (
  value: unknown,
  charset = UTF8MB4,
  jsonAsString = false
) => {
  const buffer = new Execute(
    1,
    [value],
    charset,
    'Z',
    undefined,
    0,
    jsonAsString
  ).toPacket().buffer;
  return {
    type: buffer[16],
    bytes: buffer.subarray(18).toString('hex'),
  };
};

const encodeAttribute = (value: unknown) => {
  const buffer = new Query(
    'SELECT 1',
    UTF8MB4,
    { attr: value },
    Number(ClientConstants.CLIENT_QUERY_ATTRIBUTES)
  ).toPacket().buffer;
  return {
    type: buffer[9],
    bytes: buffer
      .subarray(16, buffer.length - 'SELECT 1'.length)
      .toString('hex'),
  };
};

describe('Bind parameters that Buffer.from would coerce', () => {
  it('rejects an array-like instance before reading its length', () => {
    const touched: PropertyKey[] = [];

    class Tripwire {
      get length() {
        touched.push('length');
        return 4e8;
      }

      get type() {
        touched.push('type');
        return 'Buffer';
      }

      get data() {
        touched.push('data');
        return [1, 2, 3];
      }

      get buffer() {
        touched.push('buffer');
        return new ArrayBuffer(8);
      }

      valueOf() {
        touched.push('valueOf');
        return 'coerced';
      }

      [Symbol.toPrimitive]() {
        touched.push(Symbol.toPrimitive);
        return 'coerced';
      }
    }

    strict.throws(() => encodeExecute(new Tripwire()), unsupported('Tripwire'));
    strict.throws(
      () => encodeAttribute(new Tripwire()),
      unsupported('Tripwire')
    );
    strict.deepEqual(touched, []);
  });

  it('rejects an instance with a huge own length', () => {
    class Sized {
      length = 4e8;
    }

    strict.throws(() => encodeExecute(new Sized()), unsupported('Sized'));
    strict.throws(() => encodeAttribute(new Sized()), unsupported('Sized'));
  });

  it('rejects an instance shaped like a serialized Buffer', () => {
    class Serialized {
      type = 'Buffer';
      data = [0x41, 0x42];
    }

    strict.throws(
      () => encodeExecute(new Serialized()),
      unsupported('Serialized')
    );
  });

  it('rejects an instance shaped like an ArrayBufferView', () => {
    class FakeView {
      buffer = new ArrayBuffer(8);
      byteLength = 8;
      byteOffset = 0;
    }

    strict.throws(() => encodeExecute(new FakeView()), unsupported('FakeView'));
  });

  it('rejects instances that convert to a primitive', () => {
    class Boxed {
      valueOf() {
        return 'boxed';
      }
    }

    class Primitive {
      [Symbol.toPrimitive]() {
        return 'primitive';
      }
    }

    strict.throws(() => encodeExecute(new Boxed()), unsupported('Boxed'));
    strict.throws(
      () => encodeExecute(new Primitive()),
      unsupported('Primitive')
    );
  });

  it('rejects boxed primitives', () => {
    strict.throws(() => encodeExecute(Object('boxed')), unsupported('String'));
    strict.throws(() => encodeExecute(Object(1)), unsupported('Number'));
  });
});

describe('Bind parameters with no encoding', () => {
  class Point {
    x = 1;
  }

  const anonymous = new (class {})();

  const cases: [string, unknown][] = [
    ['Map', new Map([['a', 1]])],
    ['Set', new Set([1])],
    ['RegExp', /a/],
    ['Error', new Error('boom')],
    ['TypeError', new TypeError('boom')],
    ['WeakMap', new WeakMap()],
    ['Promise', Promise.resolve()],
    ['Point', new Point()],
    ['object', anonymous],
  ];

  for (const [received, value] of cases) {
    it(`rejects ${received} in an Execute packet`, () => {
      strict.throws(() => encodeExecute(value), unsupported(received));
      strict.throws(
        () => encodeExecute(value, CP1251, true),
        unsupported(received)
      );
    });

    it(`rejects ${received} as a query attribute`, () => {
      strict.throws(() => encodeAttribute(value), unsupported(received));
    });
  }

  it('does not run a getter to name the constructor', () => {
    let read = false;

    class Hidden {
      static get name() {
        read = true;
        return 'Hidden';
      }
    }

    strict.throws(() => encodeExecute(new Hidden()), unsupported('object'));
    strict.equal(read, false);
  });

  it('rejects an object whose toJSON() serializes to nothing', () => {
    strict.throws(
      () => encodeExecute({ toJSON: () => undefined }),
      unsupported('a value that converts to undefined')
    );
  });
});

describe('Bind parameters that encode', () => {
  const VAR_STRING = Types.VAR_STRING;

  const cases: [string, unknown, number, string, number?][] = [
    ['number', 1.5, Types.DOUBLE, '000000000000f83f'],
    ['integer', 42, Types.DOUBLE, '0000000000004540'],
    ['boolean', true, Types.TINY, '01'],
    [
      'bigint',
      9007199254740993n,
      VAR_STRING,
      '1039303037313939323534373430393933',
    ],
    ['string', 'héllo', VAR_STRING, '0668c3a96c6c6f'],
    [
      'Date',
      new Date(Date.UTC(2024, 1, 29, 13, 45, 30, 123)),
      Types.DATETIME,
      '0be807021d0d2d1e78e00100',
    ],
    ['Buffer', Buffer.from([0x00, 0x80, 0xff]), Types.BLOB, '030080ff'],
    [
      'Uint8Array',
      new Uint8Array([1, 2, 3, 4]).subarray(1, 3),
      Types.BLOB,
      '020203',
    ],
    [
      'DataView',
      new DataView(new Uint8Array([9, 8, 7]).buffer, 1, 2),
      Types.BLOB,
      '020807',
    ],
    [
      'ArrayBuffer',
      new Uint8Array([0x41, 0x80, 0xff]).buffer,
      VAR_STRING,
      '034180ff',
    ],
    [
      'SharedArrayBuffer',
      new Uint8Array(new SharedArrayBuffer(2)).fill(0x43).buffer,
      VAR_STRING,
      '024343',
    ],
    [
      'plain object',
      { a: [1, 'x'], b: null },
      Types.JSON,
      '167b2261223a5b312c2278225d2c2262223a6e756c6c7d',
      VAR_STRING,
    ],
    [
      'array',
      [1, 'two', { three: 3 }],
      Types.JSON,
      '155b312c2274776f222c7b227468726565223a337d5d',
      VAR_STRING,
    ],
    [
      'object with toJSON()',
      { toJSON: () => ({ wrapped: true }) },
      Types.JSON,
      '107b2277726170706564223a747275657d',
      VAR_STRING,
    ],
    [
      'class instance with toJSON()',
      new (class Money {
        toJSON() {
          return '12.50';
        }
      })(),
      Types.JSON,
      '072231322e353022',
      VAR_STRING,
    ],
  ];

  for (const [name, value, type, bytes, typeAsString = type] of cases) {
    it(`encodes ${name}`, () => {
      strict.deepEqual(encodeExecute(value), { type, bytes });
      strict.deepEqual(encodeExecute(value, UTF8MB4, true), {
        type: typeAsString,
        bytes,
      });
    });

    if (name !== 'Date') {
      it(`encodes ${name} as a query attribute`, () => {
        strict.deepEqual(encodeAttribute(value), { type, bytes });
      });
    }
  }

  it('encodes null', () => {
    const buffer = new Execute(1, [null], UTF8MB4, 'Z').toPacket().buffer;
    strict.equal(buffer[14], 1);
    strict.equal(buffer[16], Types.NULL);
    strict.equal(buffer.length, 18);
    strict.equal(encodeAttribute(null).type, Types.NULL);
  });

  it('encodes a string in a non-UTF-8 charset', () => {
    strict.deepEqual(encodeExecute('héllo', LATIN1), {
      type: VAR_STRING,
      bytes: '0568e96c6c6f',
    });
    strict.deepEqual(encodeExecute('héllo', CP1251), {
      type: VAR_STRING,
      bytes: '05683f6c6c6f',
    });
  });

  it('encodes an ArrayBuffer in a non-UTF-8 charset', () => {
    strict.deepEqual(
      encodeExecute(new Uint8Array([0x41, 0x80, 0xff]).buffer, CP1251),
      { type: VAR_STRING, bytes: '034180ff' }
    );
  });

  it('encodes a JSON object in a non-UTF-8 charset', () => {
    strict.deepEqual(encodeExecute({ a: 1 }, CP1251), {
      type: Types.JSON,
      bytes: '077b2261223a317d',
    });
  });
});
