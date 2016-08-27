var Iconv = require('iconv-lite');
var ParserCache = {};

function StringParser (encoding, options) {
  options = options || {};
  this.encoding = encoding;
  this.encoder = Iconv.getEncoder(encoding, options);
  this.decoder = Iconv.getDecoder(encoding, options);
}

var prepareParser = function (encoding, options) {
  // if available use existing parser
  if (ParserCache[encoding]) {
    return ParserCache[encoding];
  }

  // other wise prepare, cache and return
  ParserCache[encoding] = new StringParser(encoding, options);
  return ParserCache[encoding];
};

exports.decode = function (buffer, encoding) {
  var parser = prepareParser(encoding);

  var res = parser.decoder.write(buffer);
  var trail = parser.decoder.end();

  return trail ? (res + trail) : res;
};

exports.encode = function (string, encoding) {
  var parser = prepareParser(encoding);

  var res = parser.encoder.write(string);
  var trail = parser.encoder.end();

  return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
};
