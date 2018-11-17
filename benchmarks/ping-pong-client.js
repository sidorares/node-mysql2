'use strict';

const net = require('net');
let count = 0;
const byte = Buffer.from([0x33]);
function pong(connection) {
  count++;
  connection.write(byte);
}

const c = net.connect(3334);
c.setNoDelay(true);
c.ondata = () => pong(c);
pong(c);

setInterval(() => {
  console.log(count);
  count = 0;
}, 1000);
