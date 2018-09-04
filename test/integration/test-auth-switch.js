const mysql = require('../../index.js');
const Command = require('../../lib/commands/command.js');
const Packets = require('../../lib/packets/index.js');

const assert = require('assert');

class TestAuthSwitchHandshake extends Command {
  constructor(args) {
    super();
    this.args = args;
  }

  start(packet, connection) {
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
  }

  readClientReply(packet, connection) {
    var clientHelloReply = Packets.HandshakeResponse.fromPacket(packet);
    assert.equal(clientHelloReply.user, 'test_user');
    assert.equal(clientHelloReply.database, 'test_database');
    assert.equal(clientHelloReply.authPluginName, 'mysql_native_password');
    assert.deepEqual(clientHelloReply.connectAttributes, connectAttributes);
    var asr = new Packets.AuthSwitchRequest(this.args);
    connection.writePacket(asr.toPacket());
    return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
  }

  readClientAuthSwitchResponse(packet, connection) {
    var authSwitchResponse = Packets.AuthSwitchResponse.fromPacket(packet);
    count++;
    if (count < 10) {
      var asrmd = new Packets.AuthSwitchRequestMoreData(Buffer.from('hahaha ' + count));
      connection.writePacket(asrmd.toPacket());
      return TestAuthSwitchHandshake.prototype.readClientAuthSwitchResponse;
    }
    else {
      connection.writeOk();
      return TestAuthSwitchHandshake.prototype.dispatchCommands;
    }
  }

  dispatchCommands(packet, connection) {
    // Quit command here
    // TODO: assert it's actually Quit
    connection.end();
    return TestAuthSwitchHandshake.prototype.dispatchCommands;
  }
}

var connectAttributes = { foo: 'bar', baz: 'foo' };



var count = 0;



var server = mysql.createServer(function(conn) {
  conn.serverConfig = {};
  conn.serverConfig.encoding = 'cesu8';
  conn.addCommand(
    new TestAuthSwitchHandshake({
      pluginName: 'auth_test_plugin',
      pluginData: Buffer.from('f\{tU-{K@BhfHt/-4^Z,')
    })
  );
});

var fullAuthExchangeDone = false;

var portfinder = require('portfinder');
portfinder.getPort(function(err, port) {
  var makeSwitchHandler = function() {
    var count = 0;
    return function(data, cb) {
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

  conn.on('connect', function(data) {
    assert.equal(data.serverVersion, 'node.js rocks');
    assert.equal(data.connectionId, 1234);

    conn.end();
    server.close();
  });
});
