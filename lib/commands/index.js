"handshake query execute".split(' ').forEach(function(name) {
  var ctor = require('./' + name);
  module.exports[ctor.name] = ctor;
});
