var LRU = require('lru-cache');

var parserCache = new LRU({
  max: 15000
});

function keyFromFields(type, fields, options) {
  var res =
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
  for (var i = 0; i < fields.length; ++i) {
    res +=
      '/' + fields[i].name + ':' + fields[i].columnType + ':' + fields[i].flags;
  }
  return res;
}

function getParser(type, fields, options, config, compiler) {
  var key = keyFromFields(type, fields, options);
  var parser = parserCache.get(key);

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
