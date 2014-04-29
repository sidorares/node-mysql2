var common     = require('../../common');
var assert     = require('assert');

var conns = [];

function spawn() {
  var c = common.createConnection();
  c.ping(spawn);
  conns.push(c);

  c.on('error', function(err) {
    conns.forEach(function(c) { if (c) c.end(); })
  });
}

spawn();

process.on('uncaughtException', function(e) {
  assert(false, 'should not have uncaught exceptions');
});

process.on('exit', function() {
  assert(conns.length > 0);
});
