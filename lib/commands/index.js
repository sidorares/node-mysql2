"client_handshake server_handshake query execute ping register_slave binlog_dump".split(' ').forEach(function(name) {
  var ctor = require('./' + name);
  module.exports[ctor.name] = ctor;
});
