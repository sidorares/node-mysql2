'use strict';

const { createLRU } = require('lru.min');

const parserCache = createLRU({
  max: 15000,
});

// the fixed-size options head keeps JSON.stringify (cheap for a flat array,
// and it normalizes exotic values the same way as before); the per-field part
// is built by hand with length-prefixed strings, so no delimiter collision is
// possible and no throwaway nested arrays are allocated per query
function appendString(key, value) {
  if (value === undefined || value === null) {
    return `${key}u/`;
  }
  return `${key}${value.length}#${value}/`;
}

function keyFromFields(type, fields, options, config) {
  let key = JSON.stringify([
    type,
    typeof options.nestTables,
    options.nestTables,
    Boolean(options.rowsAsArray),
    Boolean(options.supportBigNumbers || config.supportBigNumbers),
    Boolean(options.bigNumberStrings || config.bigNumberStrings),
    typeof options.typeCast === 'boolean'
      ? options.typeCast
      : typeof options.typeCast,
    options.timezone || config.timezone,
    Boolean(options.decimalNumbers),
    options.dateStrings,
    Boolean(config.jsonStrings),
  ]);

  for (let i = 0; i < fields.length; ++i) {
    const field = fields[i];
    key = appendString(key, field.name);
    key += `${field.columnType}/${field.length}/`;
    key = appendString(key, field.schema);
    key = appendString(key, field.table);
    key += `${field.flags}/${field.characterSet}/`;
    key = appendString(key, field.extendedTypeName);
    key = appendString(key, field.extendedFormat);
  }

  return key;
}

function getParser(type, fields, options, config, compiler) {
  const key = keyFromFields(type, fields, options, config);
  let parser = parserCache.get(key);

  if (parser) {
    return parser;
  }

  parser = compiler(fields, options, config);
  parserCache.set(key, parser);
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
  _keyFromFields: keyFromFields,
};
