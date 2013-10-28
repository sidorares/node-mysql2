var net          = require('net');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;

var PacketParser = require('./packet_parser');
var Packet       = require('./packets/packet');
var Commands     = require('./commands/index.js');
var Connection   = require('./connection');
var ConnectionConfig = require('./connection_config');

// TODO: inherit Server from net.Server
function Server()
{
  EventEmitter.call(this);
  this.connections = [];
  this._server = net.createServer(this._handleConnection.bind(this));
}
util.inherits(Server, EventEmitter);

Server.prototype._handleConnection = function(socket) {
  var connectionConfig = new ConnectionConfig({ stream: socket, isServer: true});
  var connection = new Connection({ config: connectionConfig});
  this.emit('connection', connection);
  this.connections.push(connection);
};

Server.prototype.listen = function(port, host, backlog, callback) {
  this._server.listen(port, host, backlog, callback);
};

module.exports = Server;
