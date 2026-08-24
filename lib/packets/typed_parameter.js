'use strict';

const Types = require('../constants/types.js');
const Packet = require('./packet.js');
const StringParser = require('../parsers/string.js');

const INTEGER_BYTES = {
  [Types.TINY]: 1,
  [Types.SHORT]: 2,
  [Types.YEAR]: 2,
  [Types.INT24]: 4,
  [Types.LONG]: 4,
  [Types.LONGLONG]: 8,
};

const TEMPORAL = [Types.DATE, Types.DATETIME, Types.TIMESTAMP];

// MySQL rejects INT24, YEAR, ENUM, SET, BIT and GEOMETRY as bind types, and
// MariaDB rejects JSON and VECTOR. Each is transmitted as the narrowest type
// both servers accept, which carries the same value.
const WIRE_TYPE = {
  [Types.INT24]: Types.LONG,
  [Types.YEAR]: Types.SHORT,
  [Types.ENUM]: Types.STRING,
  [Types.SET]: Types.STRING,
  [Types.VECTOR]: Types.BLOB,
};

// Only these may be adopted from a server hint: they are valid bind types on
// every server, so upgrading can never make a working statement fail.
const HINT_UPGRADABLE = new Set([
  Types.TINY,
  Types.SHORT,
  Types.LONG,
  Types.LONGLONG,
]);

const LENGTH_CODED = [
  Types.DECIMAL,
  Types.NEWDECIMAL,
  Types.VARCHAR,
  Types.VAR_STRING,
  Types.STRING,
  Types.ENUM,
  Types.SET,
  Types.JSON,
  Types.VECTOR,
  Types.TINY_BLOB,
  Types.MEDIUM_BLOB,
  Types.LONG_BLOB,
  Types.BLOB,
];

function writeNothing() {}

const TIME_PATTERN = /^(-)?(\d+):([0-5]?\d):([0-5]?\d)(?:\.(\d{1,6}))?$/;

class TypedParameter {
  constructor(type, value, unsigned) {
    this.type = type;
    this.value = value;
    this.unsigned = unsigned;
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    const name = Types[this.type] || `0x${this.type.toString(16)}`;
    return `${name}${this.unsigned ? ' UNSIGNED' : ''}(${String(this.value)})`;
  }
}

function toInteger(value, name) {
  switch (typeof value) {
    case 'bigint':
      return value;
    case 'boolean':
      return value ? 1n : 0n;
    case 'number':
      if (!Number.isInteger(value)) {
        throw new TypeError(
          `${name} parameter must be an integer, got ${value}`
        );
      }
      if (!Number.isSafeInteger(value)) {
        throw new RangeError(
          `${name} parameter ${value} exceeds Number.MAX_SAFE_INTEGER and has already lost precision; pass a string or BigInt instead`
        );
      }
      return BigInt(value);
    case 'string':
      try {
        return BigInt(value.trim());
      } catch (cause) {
        throw new TypeError(
          `${name} parameter must be an integer, got ${JSON.stringify(value)}`,
          { cause }
        );
      }
    default:
      throw new TypeError(
        `${name} parameter must be an integer, got ${typeof value}`
      );
  }
}

function checkedInteger(value, type, bytes, unsigned) {
  const name = Types[type];
  const bits = BigInt(bytes * 8);
  const n = toInteger(value, name);
  const min = unsigned ? 0n : -(1n << (bits - 1n));
  const max = unsigned ? (1n << bits) - 1n : (1n << (bits - 1n)) - 1n;
  if (n < min || n > max) {
    throw new RangeError(
      `${name}${unsigned ? ' UNSIGNED' : ''} parameter out of range: ${n} is not within ${min}..${max}`
    );
  }
  return n;
}

// The server reports an integer type whenever it knows a placeholder holds one,
// and MySQL rejects a DOUBLE in some of those positions. Adopting the hint is
// only safe when the value is already an integer that fits, so every other case
// returns null and keeps the type inferred from JavaScript.
function integerHint(value, type, unsigned) {
  const bytes = INTEGER_BYTES[type];
  if (!bytes || !HINT_UPGRADABLE.has(type)) {
    return null;
  }
  let n;
  if (typeof value === 'bigint') {
    n = value;
  } else if (typeof value === 'boolean') {
    n = value ? 1n : 0n;
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    n = BigInt(value);
  } else {
    return null;
  }
  const bits = BigInt(bytes * 8);
  const min = unsigned ? 0n : -(1n << (bits - 1n));
  const max = unsigned ? (1n << bits) - 1n : (1n << (bits - 1n)) - 1n;
  if (n < min || n > max) {
    return null;
  }
  return new TypedParameter(type, n, unsigned);
}

function wireType(type, jsonAsString) {
  if (type === Types.JSON && jsonAsString) {
    return Types.VAR_STRING;
  }
  return WIRE_TYPE[type] || type;
}

function integerEncoder(type, bytes) {
  return (value, unsigned) => {
    const wire = BigInt.asUintN(
      bytes * 8,
      checkedInteger(value, type, bytes, unsigned)
    );
    return {
      value: bytes === 8 ? wire : Number(wire),
      length: bytes,
      writer(v) {
        this.writeUIntLE(v, bytes);
      },
    };
  };
}

function toDate(value, name) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `${name} parameter must be a valid Date, got ${String(value)}`
    );
  }
  return date;
}

function temporalEncoder(type, timezone) {
  const name = Types[type];
  return (value) => ({
    value: toDate(value, name),
    length: 12,
    writer(v) {
      this.writeDate(v, timezone);
    },
  });
}

function toTimeParts(value) {
  if (typeof value === 'number') {
    const negative = value < 0;
    let rest = Math.abs(value);
    const microseconds = Math.round((rest % 1000) * 1000);
    rest = Math.floor(rest / 1000);
    const seconds = rest % 60;
    const minutes = Math.floor(rest / 60) % 60;
    const totalHours = Math.floor(rest / 3600);
    return {
      negative,
      days: Math.floor(totalHours / 24),
      hours: totalHours % 24,
      minutes,
      seconds,
      microseconds,
    };
  }
  const match = TIME_PATTERN.exec(String(value));
  if (!match) {
    throw new TypeError(
      `TIME parameter must be 'HH:MM:SS[.ffffff]' or milliseconds, got ${JSON.stringify(String(value))}`
    );
  }
  const hours = Number(match[2]);
  return {
    negative: Boolean(match[1]),
    days: Math.floor(hours / 24),
    hours: hours % 24,
    minutes: Number(match[3]),
    seconds: Number(match[4]),
    microseconds: match[5] ? Number(match[5].padEnd(6, '0')) : 0,
  };
}

function timeEncoder() {
  return (value) => {
    const parts = toTimeParts(value);
    return {
      value: parts,
      length: Packet.timeLength(parts),
      writer(v) {
        this.writeTime(v);
      },
    };
  };
}

function lengthCodedEncoder(encoding) {
  return (value) => {
    if (!Buffer.isBuffer(value)) {
      const string = typeof value === 'string' ? value : String(value);
      if (
        StringParser.hasFastUtf8Write &&
        (encoding === 'utf8' || encoding === 'utf-8')
      ) {
        const byteLength = Buffer.byteLength(string, 'utf8');
        return {
          value: string,
          length: Packet.lengthCodedNumberLength(byteLength) + byteLength,
          byteLength,
          writer: Packet.prototype.writeLengthCodedUtf8String,
        };
      }
      value = StringParser.encode(string, encoding);
    }
    return {
      value,
      length: Packet.lengthCodedNumberLength(value.length) + value.length,
      writer: Packet.prototype.writeLengthCodedBuffer,
    };
  };
}

function jsonEncoder(encoding) {
  const encodeText = lengthCodedEncoder(encoding);
  return (value) =>
    encodeText(
      typeof value === 'string' || Buffer.isBuffer(value)
        ? value
        : JSON.stringify(value)
    );
}

function encoderFor(type, encoding, timezone) {
  if (INTEGER_BYTES[type]) {
    return integerEncoder(type, INTEGER_BYTES[type]);
  }
  if (type === Types.DOUBLE) {
    return (value) => ({
      value: Number(value),
      length: 8,
      writer: Packet.prototype.writeDouble,
    });
  }
  if (type === Types.FLOAT) {
    return (value) => ({
      value: Number(value),
      length: 4,
      writer: Packet.prototype.writeFloat,
    });
  }
  if (TEMPORAL.includes(type)) {
    return temporalEncoder(type, timezone);
  }
  if (type === Types.TIME) {
    return timeEncoder();
  }
  if (type === Types.JSON) {
    return jsonEncoder(encoding);
  }
  if (LENGTH_CODED.includes(type)) {
    return lengthCodedEncoder(encoding);
  }
  throw new TypeError(
    `No parameter encoder for MySQL type 0x${type.toString(16)}`
  );
}

function encodeTypedParameter(parameter, encoding, timezone, jsonAsString) {
  if (parameter.value === null || parameter.type === Types.NULL) {
    return {
      value: '',
      type: wireType(parameter.type, jsonAsString),
      length: 0,
      writer: writeNothing,
      unsigned: parameter.unsigned,
      isNull: true,
    };
  }
  const encoded = encoderFor(
    parameter.type,
    encoding,
    timezone
  )(parameter.value, parameter.unsigned);
  return {
    ...encoded,
    type: wireType(parameter.type, jsonAsString),
    unsigned: parameter.unsigned,
  };
}

const ALIASES = {
  MEDIUMTEXT: 'MEDIUM_BLOB',
  LONGTEXT: 'LONG_BLOB',
  TINYINT: 'TINY',
  SMALLINT: 'SHORT',
  MEDIUMINT: 'INT24',
  INT: 'LONG',
  INTEGER: 'LONG',
  BIGINT: 'LONGLONG',
  REAL: 'DOUBLE',
  CHAR: 'STRING',
  VARBINARY: 'VAR_STRING',
  BINARY: 'STRING',
  TEXT: 'BLOB',
};

const SUPPORTED = [
  ...Object.keys(INTEGER_BYTES),
  Types.FLOAT,
  Types.DOUBLE,
  Types.TIME,
  ...TEMPORAL,
  ...LENGTH_CODED,
].map(Number);

const types = Object.create(null);

for (const type of SUPPORTED) {
  const name = Types[type];
  const bytes = INTEGER_BYTES[type];
  const build = bytes
    ? (value, unsigned) =>
        new TypedParameter(
          type,
          value === null ? null : checkedInteger(value, type, bytes, unsigned),
          unsigned
        )
    : (value, unsigned) => new TypedParameter(type, value, unsigned);
  const factory = (value) => build(value, false);
  if (bytes) {
    factory.unsigned = (value) => build(value, true);
  }
  types[name] = factory;
}

types.NULL = () => new TypedParameter(Types.NULL, null, false);

for (const [alias, target] of Object.entries(ALIASES)) {
  if (types[target] && !types[alias]) {
    types[alias] = types[target];
  }
}

module.exports = {
  TypedParameter,
  encodeTypedParameter,
  integerHint,
  types,
};
