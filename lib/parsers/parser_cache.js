'use strict';

const LRU = require('lru-cache');

const parserCache = new LRU({
  max: 15000
});

function keyFromFields(type, fields, options) {
  let res =
    type +
    '/' +
    typeof options.nestTables +
    '/' +
    options.nestTables +
    '/' +
    options.rowsAsArray +
    options.supportBigNumbers +
    '/' +
    options.bigNumberStrings +
    '/' +
    typeof options.typeCast;
  for (let i = 0; i < fields.length; ++i) {
    res +=
      '/' + fields[i].name + ':' + fields[i].columnType + ':' + fields[i].flags;
  }
  return res;
}

function getParser(type, fields, options, config, compiler) {
  const key = keyFromFields(type, fields, options);
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
  parserCache.reset();
}

module.exports = {
  getParser: getParser,
  setMaxCache: setMaxCache,
  clearCache: clearCache
};
