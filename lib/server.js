var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Connection = require('./connection');
var ConnectionConfig = require('./connection_config');

// TODO: inherit Server from net.Server
function Server ()
{
  EventEmitter.call(this);
  this.connections = [];
  this._server = net.createServer(this._handleConnection.bind(this));
}
util.inherits(Server, EventEmitter);

Server.prototype._handleConnection = function (socket) {
  var connectionConfig = new ConnectionConfig({stream: socket, isServer: true});
  var connection = new Connection({config: connectionConfig});
  this.emit('connection', connection);
};

Server.prototype.listen = function (port, host, backlog, callback) {
  this._port = port;
  this._server.listen.apply(this._server, arguments);
  return this;
};

Server.prototype.close = function (cb) {
  this._server.close(cb);
};

module.exports = Server;
