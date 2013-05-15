var count = 0;
var byte = new Buffer([0x33]);

function ping(buffer, offset, length) {
  count++;
  pong(this);
}

function noop() {}
function pong(sock)
{
  var writeReq = sock.writeBuffer(byte);
  writeReq.oncomplete = noop;
}

var port = 3334;
var TCP = process.binding('tcp_wrap').TCP;
var client = new TCP();
var req = client.connect('127.0.0.1', port);
req.oncomplete = function() {
  console.log('connected');
  pong(client);
};
client.onread = ping;
client.readStart();

setInterval(function() {
  console.log(count);
  count = 0;
}, 1000);
