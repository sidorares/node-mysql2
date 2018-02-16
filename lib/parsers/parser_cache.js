var LRU = require('lru-cache');

var parserCache = new LRU({
  max: 15000
});

function keyFromFields(type, fields, options, config) {
  var res =
    type +
    '/' +
    typeof options.nestTables +
    '/' +
    options.nestTables +
    '/' +
    options.rowsAsArray +
    (options.supportBigNumbers || config.supportBigNumbers) +
    '/' +
    (options.bigNumberStrings || config.bigNumberStrings) +
    '/' +
    typeof options.typeCast +
    '/' +
    options.timezone +
    '/' +
    options.decimalNumbers +
    '/' +
    options.dateStrings;
  for (var i = 0; i < fields.length; ++i) {
    var field = fields[i];
    res +=
      '/' + field.name + ':' + field.columnType + ':' + field.flags + ':' + field.characterSet;
  }
  return res;
}

function getParser(type, fields, options, config, compiler) {
  var key = keyFromFields(type, fields, options, config);
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
