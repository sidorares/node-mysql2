var net = require('net');

var byte = new Buffer([0x33]);
function pong()
{
  this.write(byte);
}

net.createServer(function(s) {
  s.setNoDelay(true);
  s.ondata = pong;
}).listen(3334);
