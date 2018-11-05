'use strict';

const net = require('net');

const byte = Buffer.from([0x33]);
function pong() {
  this.write(byte);
}

net
  .createServer(s => {
    s.setNoDelay(true);
    s.ondata = pong;
  })
  .listen(3334);
