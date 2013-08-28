"client_handshake server_handshake query execute ping".split(' ').forEach(function(name) {
  var ctor = require('./' + name);
  module.exports[ctor.name] = ctor;
});
