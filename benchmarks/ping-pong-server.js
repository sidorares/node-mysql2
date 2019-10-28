'use strict';

const net = require('net');

const byte = Buffer.from([0x33]);
function pong(conn) {
  conn.write(byte);
}

net
  .createServer(s => {
    s.setNoDelay(true);
    s.ondata = () => pong(s);
  })
  .listen(3334);
