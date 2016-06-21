var util = require('util');
var mysql = require('../../index.js');
var Command = require('../../lib/commands/command.js');
var Packets = require('../../lib/packets/index.js');

var assert = require('assert');

function TestAuthSwitchHandshake (args)
{
  Command.call(this);
  this.args = args;
}
util.inherits(TestAuthSwitchHandshake, Command);

var connectAttributes = {foo: 'bar', baz: 'foo'};

TestAuthSwitchHandshake.prototype.start = function (packet, connection) {
  var serverHelloPacket = new Packets.Handshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff
  });
  this.serverHello = serverHelloPacket;
  serverHelloPacket.setScrambleData(function (err) {
    connection.writePacket(serverHelloPacket.toPacket(0));
  });
  return TestAuthSwitchHandshake.prototype.readClientReply;
};

TestAuthSwitchHandshake.prototype.readClientReply = function (packet, connection) {
  var clientHelloReply = new Packets.HandshakeResponse.fromPacket(packet);

  assert.equal(clientHelloReply.user, 'test_user');
  assert.equal(clientHelloReply.database, 'test_database');
  assert.equal(clientHelloReply.authPluginName, 'mysql_native_password');
  assert.deepEqual(clientHelloReply.connectAttributes, connectAttributes);

  var asr = new Packets.AuthSwitchRequest(this.args);
  connection.writePacket(asr.toPacket());
  return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
};

var count = 0;

TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse = function (packet, connection) {
  var authSwitchResponse = new Packets.AuthSwitchResponse.fromPacket(packet);

  count++;
  if (count < 10) {
    var asrmd = new Packets.AuthSwitchRequestMoreData(Buffer('hahaha ' + count));
    connection.writePacket(asrmd.toPacket());
    return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
  } else {
    connection.writeOk();
    return TestAuthSwitchHandshake.prototype.dispatchCommands;
  }
};

TestAuthSwitchHandshake.prototype.dispatchCommands = function (packet, connection) {
  // Quit command here
  // TODO: assert it's actually Quit
  connection.end();
  return TestAuthSwitchHandshake.prototype.dispatchCommands;
};

var server = mysql.createServer(function (conn) {
  conn.addCommand(new TestAuthSwitchHandshake({
    pluginName: 'auth_test_plugin',
    pluginData: Buffer('f\{tU-{K@BhfHt/-4^Z,')
  }));
});

var fullAuthExchangeDone = false;

var portfinder = require('portfinder');
portfinder.getPort(function (err, port) {

  var makeSwitchHandler = function () {
    var count = 0;
    return function (data, cb) {
      if (count == 0) {
        assert.equal(data.pluginName, 'auth_test_plugin');
      } else {
        assert.equal(data.pluginData.toString(), 'hahaha ' + count);
      }

      if (count == 9) {
        fullAuthExchangeDone = true;
      }
      count++;
      cb(null, 'some data back' + count);
    };
  };

  server.listen(port);
  var conn = mysql.createConnection({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port,
    authSwitchHandler: makeSwitchHandler(),
    connectAttributes: connectAttributes
  });

  conn.on('connect', function (data) {
    assert.equal(data.serverVersion, 'node.js rocks');
    assert.equal(data.connectionId, 1234);

    conn.end();
    server.close();
  });

});
