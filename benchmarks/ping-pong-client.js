'use strict';

const net = require('net');
let count = 0;
const byte = Buffer.from([0x33]);
function pong() {
  count++;
  this.write(byte);
}

const c = net.connect(3334);
c.setNoDelay(true);
c.ondata = pong;
pong.apply(c);

setInterval(() => {
  console.log(count);
  count = 0;
}, 1000);
