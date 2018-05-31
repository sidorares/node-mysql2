var net = require('net');

var byte = Buffer.from([0x33]);
function pong()
{
  this.write(byte);
}

net.createServer(function(s) {
  s.setNoDelay(true);
  s.ondata = pong;
}).listen(3334);
