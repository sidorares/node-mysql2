'use strict';

const LRU = require('lru-cache').default;
const helpers = require('../helpers');

const parserCache = new LRU({
  max: 15000,
});

function keyFromFields(type, fields, options, config) {
  let res =
    `${helpers.sanitizeKey(type, '/')}` +
    `/${typeof options.nestTables}` +
    `/${helpers.sanitizeKey(options.nestTables, '/')}` +
    `/${Boolean(options.rowsAsArray)}` +
    `/${Boolean(options.supportBigNumbers || config.supportBigNumbers)}` +
    `/${Boolean(options.bigNumberStrings || config.bigNumberStrings)}` +
    `/${typeof options.typeCast}` +
    `/${helpers.sanitizeKey(options.timezone || config.timezone, '/')}` +
    `/${Boolean(options.decimalNumbers)}` +
    `/${helpers.sanitizeKey(options.dateStrings, '/')}`;

  for (let i = 0; i < fields.length; ++i) {
    const field = fields[i];
    res += `/${helpers.sanitizeKey(field.name)}:${helpers.sanitizeKey(
      field.columnType,
    )}:${helpers.sanitizeKey(field.length)}:${helpers.sanitizeKey(
      field.schema,
    )}:${helpers.sanitizeKey(field.table)}:${helpers.sanitizeKey(
      field.flags,
    )}:${helpers.sanitizeKey(field.characterSet)}`;
  }

  return res;
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
  parserCache.max = max;
}

function clearCache() {
  parserCache.clear();
}

module.exports = {
  getParser: getParser,
  setMaxCache: setMaxCache,
  clearCache: clearCache,
};
