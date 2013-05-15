var net = require('net');
var count = 0;
var byte = new Buffer([0x33]);
function pong()
{
  count++;
  this.write(byte);
}

var c = net.connect(3334);
c.setNoDelay(true);
c.ondata = pong;
pong.apply(c);

setInterval(function() {
  console.log(count);
  count = 0;
}, 1000);
