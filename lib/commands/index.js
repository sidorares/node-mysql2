'client_handshake server_handshake query prepare close_statement execute ping register_slave binlog_dump change_user quit'
  .split(' ')
  .forEach(function(name) {
    var ctor = require('./' + name + '.js');
    module.exports[ctor.name] = ctor;
  });
