'use strict';

let count = 0;
const byte = Buffer.from([0x33]);

function noop() {}
function pong(sock) {
  const writeReq = sock.writeBuffer(byte);
  writeReq.oncomplete = noop;
}

function ping(conn) {
  count++;
  pong(conn);
}

const port = 3334;
const TCP = process.binding('tcp_wrap').TCP;
const client = new TCP();
const req = client.connect(
  '127.0.0.1',
  port
);
req.oncomplete = function() {
  console.log('connected');
  pong(client);
};
client.onread = () => ping(client);
client.readStart();

setInterval(() => {
  console.log(count);
  count = 0;
}, 1000);
