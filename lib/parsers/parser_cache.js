'use strict';

const { createLRU } = require('lru.min');

const parserCache = createLRU({
  max: 15000,
});

// A compiled row parser depends on the parsing options and, per column, on
// exactly the metadata the code generators bake into the function: type,
// charset, flags, decimals, name, MariaDB extended metadata, and the table
// name when rows are nested by table. The cache is keyed by an integer hash
// of that data and every hit is confirmed against the full metadata kept in
// the entry, so a hash collision can never hand out a parser compiled for
// different columns or options.

const TYPE_CAST_FALSE = 1;
const TYPE_CAST_FUNCTION = 2;
const TYPE_CAST_DEFAULT = 3;

function typeCastKind(typeCast) {
  if (typeCast === false) {
    return TYPE_CAST_FALSE;
  }
  if (typeof typeCast === 'function') {
    return TYPE_CAST_FUNCTION;
  }
  return TYPE_CAST_DEFAULT;
}

// helpers.typeMatch reads an array by the type names it lists and anything
// else by truthiness
function dateStringsKey(dateStrings) {
  if (Array.isArray(dateStrings)) {
    return dateStrings.map(String);
  }
  return Boolean(dateStrings);
}

function nestTablesKey(nestTables) {
  if (typeof nestTables === 'string') {
    return nestTables;
  }
  return Boolean(nestTables);
}

function optionBits(type, options, config, nestTables, dateStrings) {
  return (
    (type === 'binary' ? 1 : 0) |
    (options.rowsAsArray ? 2 : 0) |
    (options.supportBigNumbers || config.supportBigNumbers ? 4 : 0) |
    (options.bigNumberStrings || config.bigNumberStrings ? 8 : 0) |
    (typeCastKind(options.typeCast) << 4) |
    (options.decimalNumbers ? 64 : 0) |
    (config.jsonStrings ? 128 : 0) |
    (nestTables === true ? 256 : 0) |
    (typeof nestTables === 'string' ? 512 : 0) |
    (dateStrings === true ? 1024 : 0) |
    (Array.isArray(dateStrings) ? 2048 : 0)
  );
}

function mixNumber(hash, value) {
  return Math.imul(hash ^ (value | 0), 0x9e3779b1) | 0;
}

function mixString(hash, string) {
  if (typeof string !== 'string') {
    return mixNumber(hash, string === undefined ? -1 : -2);
  }
  hash = mixNumber(hash, string.length);
  for (let i = 0; i < string.length; ++i) {
    hash = (Math.imul(hash, 31) + string.charCodeAt(i)) | 0;
  }
  return hash;
}

function hashKey(type, fields, options, config) {
  const nestTables = nestTablesKey(options.nestTables);
  const dateStrings = dateStringsKey(options.dateStrings || config.dateStrings);
  const includeTable = nestTables !== false;
  let hash = mixNumber(
    0x811c9dc5,
    optionBits(type, options, config, nestTables, dateStrings)
  );
  hash = mixString(hash, String(options.timezone || config.timezone));
  if (typeof nestTables === 'string') {
    hash = mixString(hash, nestTables);
  }
  if (Array.isArray(dateStrings)) {
    for (let i = 0; i < dateStrings.length; ++i) {
      hash = mixString(hash, dateStrings[i]);
    }
  }
  hash = mixNumber(hash, fields.length);
  for (let i = 0; i < fields.length; ++i) {
    const field = fields[i];
    hash = mixNumber(
      hash,
      field.columnType | (field.characterSet << 8) | (field.decimals << 24)
    );
    hash = mixNumber(hash, field.flags);
    hash = mixString(hash, field.name);
    if (field.extendedTypeName !== undefined) {
      hash = mixString(hash, field.extendedTypeName);
    }
    if (field.extendedFormat !== undefined) {
      hash = mixString(hash, field.extendedFormat);
    }
    if (includeTable) {
      hash = mixString(hash, field.table);
    }
  }
  // small non-negative integers keep the Map keys as Smis
  return hash & 0x3fffffff;
}

function sameList(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

class Entry {
  constructor(parser, type, fields, options, config) {
    this.parser = parser;
    this.nestTables = nestTablesKey(options.nestTables);
    this.dateStrings = dateStringsKey(
      options.dateStrings || config.dateStrings
    );
    this.optionBits = optionBits(
      type,
      options,
      config,
      this.nestTables,
      this.dateStrings
    );
    this.timezone = String(options.timezone || config.timezone);
    const count = fields.length;
    this.columnTypes = new Array(count);
    this.characterSets = new Array(count);
    this.flags = new Array(count);
    this.decimals = new Array(count);
    this.names = new Array(count);
    this.extendedTypeNames = new Array(count);
    this.extendedFormats = new Array(count);
    this.tables = this.nestTables === false ? null : new Array(count);
    for (let i = 0; i < count; ++i) {
      const field = fields[i];
      this.columnTypes[i] = field.columnType;
      this.characterSets[i] = field.characterSet;
      this.flags[i] = field.flags;
      this.decimals[i] = field.decimals;
      this.names[i] = field.name;
      this.extendedTypeNames[i] = field.extendedTypeName;
      this.extendedFormats[i] = field.extendedFormat;
      if (this.tables !== null) {
        this.tables[i] = field.table;
      }
    }
  }

  matches(type, fields, options, config) {
    const nestTables = nestTablesKey(options.nestTables);
    const dateStrings = dateStringsKey(
      options.dateStrings || config.dateStrings
    );
    if (
      this.optionBits !==
        optionBits(type, options, config, nestTables, dateStrings) ||
      this.nestTables !== nestTables ||
      this.timezone !== String(options.timezone || config.timezone) ||
      this.names.length !== fields.length
    ) {
      return false;
    }
    if (Array.isArray(dateStrings)) {
      if (!Array.isArray(this.dateStrings)) {
        return false;
      }
      if (!sameList(this.dateStrings, dateStrings)) {
        return false;
      }
    } else if (this.dateStrings !== dateStrings) {
      return false;
    }
    for (let i = 0; i < fields.length; ++i) {
      const field = fields[i];
      if (
        this.columnTypes[i] !== field.columnType ||
        this.characterSets[i] !== field.characterSet ||
        this.flags[i] !== field.flags ||
        this.decimals[i] !== field.decimals ||
        this.names[i] !== field.name ||
        this.extendedTypeNames[i] !== field.extendedTypeName ||
        this.extendedFormats[i] !== field.extendedFormat ||
        (this.tables !== null && this.tables[i] !== field.table)
      ) {
        return false;
      }
    }
    return true;
  }
}

function getParser(type, fields, options, config, compiler) {
  const hash = hashKey(type, fields, options, config);
  let entries = parserCache.get(hash);
  if (entries !== undefined) {
    for (let i = 0; i < entries.length; ++i) {
      if (entries[i].matches(type, fields, options, config)) {
        return entries[i].parser;
      }
    }
  }
  const parser = compiler(fields, options, config);
  if (entries === undefined) {
    entries = [];
    parserCache.set(hash, entries);
  }
  entries.push(new Entry(parser, type, fields, options, config));
  return parser;
}

function setMaxCache(max) {
  parserCache.resize(max);
}

function clearCache() {
  parserCache.clear();
}

module.exports = {
  getParser: getParser,
  setMaxCache: setMaxCache,
  clearCache: clearCache,
  _hashKey: hashKey,
};
