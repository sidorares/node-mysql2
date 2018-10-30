'use strict';

const Net = require('net');
const Tls = require('tls');
const Timers = require('timers');
const { EventEmitter } = require('events');
const { Readable } = require('stream');
const Queue = require('denque');
const SqlString = require('sqlstring');
const LRU = require('lru-cache');

const PacketParser = require('./packet_parser.js');
const Packets = require('./packets/index.js');
const Commands = require('./commands/index.js');
const ConnectionConfig = require('./connection_config.js');
const CharsetToEncoding = require('./constants/charset_encodings.js');

let _connectionId = 0;

let convertNamedPlaceholders = null;

class Connection extends EventEmitter {
  constructor(opts) {
    super();
    this.config = opts.config;
    // TODO: fill defaults
    // if no params, connect to /var/lib/mysql/mysql.sock ( /tmp/mysql.sock on OSX )
    // if host is given, connect to host:3306
    // TODO: use `/usr/local/mysql/bin/mysql_config --socket` output? as default socketPath
    // if there is no host/port and no socketPath parameters?
    if (!opts.config.stream) {
      if (opts.config.socketPath) {
        this.stream = Net.connect(opts.config.socketPath);
      } else {
        this.stream = Net.connect(
          opts.config.port,
          opts.config.host
        );
      }
    } else {
      // if stream is a function, treat it as "stream agent / factory"
      if (typeof opts.config.stream == 'function') {
        this.stream = opts.config.stream(opts);
      } else {
        this.stream = opts.config.stream;
      }
    }
    this._internalId = _connectionId++;
    this._commands = new Queue();
    this._command = null;
    this._paused = false;
    this._paused_packets = new Queue();
    this._statements = LRU({
      max: this.config.maxPreparedStatements,
      dispose: function(key, statement) {
        statement.close();
      }
    });
    this.serverCapabilityFlags = 0;
    this.authorized = false;
    const connection = this;
    this.sequenceId = 0;
    this.compressedSequenceId = 0;
    this.threadId = null;
    this._handshakePacket = null;
    this._fatalError = null;
    this._protocolError = null;
    this._outOfOrderPackets = [];
    this.clientEncoding = CharsetToEncoding[this.config.charsetNumber];
    this.stream.on('error', connection._handleNetworkError.bind(this));
    // see https://gist.github.com/khoomeister/4985691#use-that-instead-of-bind
    this.packetParser = new PacketParser(function(p) {
      connection.handlePacket(p);
    });
    this.stream.on('data', function(data) {
      if (connection.connectTimeout) {
        Timers.clearTimeout(connection.connectTimeout);
        connection.connectTimeout = null;
      }
      connection.packetParser.execute(data);
    });
    this.stream.on('close', function() {
      // we need to set this flag everywhere where we want connection to close
      if (connection._closing) {
        return;
      }
      if (!connection._protocolError) {
        // no particular error message before disconnect
        connection._protocolError = new Error(
          'Connection lost: The server closed the connection.'
        );
        connection._protocolError.fatal = true;
        connection._protocolError.code = 'PROTOCOL_CONNECTION_LOST';
      }
      connection._notifyError(connection._protocolError);
    });
    let handshakeCommand;
    if (!this.config.isServer) {
      handshakeCommand = new Commands.ClientHandshake(this.config.clientFlags);
      handshakeCommand.on('end', function() {
        // this happens when handshake finishes early and first packet is error
        // and not server hello ( for example, 'Too many connactions' error)
        if (!handshakeCommand.handshake) {
          return;
        }
        connection._handshakePacket = handshakeCommand.handshake;
        connection.threadId = handshakeCommand.handshake.connectionId;
        connection.emit('connect', handshakeCommand.handshake);
      });
      handshakeCommand.on('error', function(err) {
        connection._closing = true;
        connection._notifyError(err);
      });
      this.addCommand(handshakeCommand);
    }
    // in case there was no initiall handshake but we need to read sting, assume it utf-8
    // most common example: "Too many connections" error ( packet is sent immediately on connection attempt, we don't know server encoding yet)
    // will be overwrittedn with actial encoding value as soon as server handshake packet is received
    this.serverEncoding = 'utf8';
    if (this.config.connectTimeout) {
      const timeoutHandler = this._handleTimeoutError.bind(this);
      this.connectTimeout = Timers.setTimeout(
        timeoutHandler,
        this.config.connectTimeout
      );
    }
  }

  promise(promiseImpl) {
    const PromiseConnection = require('../promise').PromiseConnection;
    return new PromiseConnection(this, promiseImpl);
  }

  _addCommandClosedState(cmd) {
    const err = new Error(
      "Can't add new command when connection is in closed state"
    );
    err.fatal = true;
    if (cmd.onResult) {
      cmd.onResult(err);
    } else {
      this.emit('error', err);
    }
  }

  _handleFatalError(err) {
    const connection = this;
    err.fatal = true;
    // stop receiving packets
    connection.stream.removeAllListeners('data');
    connection.addCommand = connection._addCommandClosedState;
    connection.write = function() {
      connection.emit('error', new Error("Can't write in closed state"));
    };
    connection._notifyError(err);
    connection._fatalError = err;
  }

  _handleNetworkError(err) {
    // Do not throw an error when a connection ends with a RST,ACK packet
    if (err.errno === 'ECONNRESET' && this._closing) {
      return;
    }
    this._handleFatalError(err);
  }

  _handleTimeoutError() {
    if (this.connectTimeout) {
      Timers.clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    this.stream.destroy && this.stream.destroy();
    const err = new Error('connect ETIMEDOUT');
    err.errorno = 'ETIMEDOUT';
    err.code = 'ETIMEDOUT';
    err.syscall = 'connect';
    this._handleNetworkError(err);
  }

  // notify all commands in the queue and bubble error as connection "error"
  // called on stream error or unexpected termination
  _notifyError(err) {
    const connection = this;
    // prevent from emitting 'PROTOCOL_CONNECTION_LOST' after EPIPE or ECONNRESET
    if (connection._fatalError) {
      return;
    }
    let command;
    // if there is no active command, notify connection
    // if there are commands and all of them have callbacks, pass error via callback
    let bubbleErrorToConnection = !connection._command;
    if (connection._command && connection._command.onResult) {
      connection._command.onResult(err);
      connection._command = null;
    } else {
      // connection handshake is special because we allow it to be implicit
      // if error happened during handshake, but there are others commands in queue
      // then bubble error to other commands and not to connection
      if (
        !(
          connection._command &&
          connection._command.constructor == Commands.ClientHandshake &&
          connection._commands.length > 0
        )
      ) {
        bubbleErrorToConnection = true;
      }
    }
    while ((command = connection._commands.shift())) {
      if (command.onResult) {
        command.onResult(err);
      } else {
        bubbleErrorToConnection = true;
      }
    }
    // notify connection if some comands in the queue did not have callbacks
    // or if this is pool connection ( so it can be removed from pool )
    if (bubbleErrorToConnection || connection._pool) {
      connection.emit('error', err);
    }
  }

  write(buffer) {
    const connection = this;
    this.stream.write(buffer, function(err) {
      if (err) {
        connection._handleNetworkError(err);
      }
    });
  }

  // http://dev.mysql.com/doc/internals/en/sequence-id.html
  //
  // The sequence-id is incremented with each packet and may wrap around.
  // It starts at 0 and is reset to 0 when a new command
  // begins in the Command Phase.
  // http://dev.mysql.com/doc/internals/en/example-several-mysql-packets.html
  _resetSequenceId() {
    this.sequenceId = 0;
    this.compressedSequenceId = 0;
  }

  _bumpCompressedSequenceId(numPackets) {
    this.compressedSequenceId += numPackets;
    this.compressedSequenceId %= 256;
  }

  _bumpSequenceId(numPackets) {
    this.sequenceId += numPackets;
    this.sequenceId %= 256;
  }

  writePacket(packet) {
    const MAX_PACKET_LENGTH = 16777215;
    const length = packet.length();
    let chunk, offset, header;
    if (length < MAX_PACKET_LENGTH) {
      packet.writeHeader(this.sequenceId);
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log(
          this._internalId +
            ' ' +
            this.connectionId +
            ' <== ' +
            this._command._commandName +
            '#' +
            this._command.stateName() +
            '(' +
            [this.sequenceId, packet._name, packet.length()].join(',') +
            ')'
        );
        // eslint-disable-next-line no-console
        console.log(
          this._internalId +
            ' ' +
            this.connectionId +
            ' <== ' +
            packet.buffer.toString('hex')
        );
      }
      this._bumpSequenceId(1);
      this.write(packet.buffer);
    } else {
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log(
          this._internalId +
            ' ' +
            this.connectionId +
            ' <== Writing large packet, raw content not written:'
        );
        // eslint-disable-next-line no-console
        console.log(
          this._internalId +
            ' ' +
            this.connectionId +
            ' <== ' +
            this._command._commandName +
            '#' +
            this._command.stateName() +
            '(' +
            [this.sequenceId, packet._name, packet.length()].join(',') +
            ')'
        );
      }
      for (offset = 4; offset < 4 + length; offset += MAX_PACKET_LENGTH) {
        chunk = packet.buffer.slice(offset, offset + MAX_PACKET_LENGTH);
        if (chunk.length === MAX_PACKET_LENGTH) {
          header = Buffer.from([0xff, 0xff, 0xff, this.sequenceId]);
        } else {
          header = Buffer.from([
            chunk.length & 0xff,
            (chunk.length >> 8) & 0xff,
            (chunk.length >> 16) & 0xff,
            this.sequenceId
          ]);
        }
        this._bumpSequenceId(1);
        this.write(header);
        this.write(chunk);
      }
    }
  }

  // 0.11+ environment
  startTLS(onSecure) {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('Upgrading connection to TLS');
    }
    const connection = this;
    const secureContext = Tls.createSecureContext({
      ca: this.config.ssl.ca,
      cert: this.config.ssl.cert,
      ciphers: this.config.ssl.ciphers,
      key: this.config.ssl.key,
      passphrase: this.config.ssl.passphrase
    });
    const rejectUnauthorized = this.config.ssl.rejectUnauthorized;
    let secureEstablished = false;
    const secureSocket = new Tls.TLSSocket(connection.stream, {
      rejectUnauthorized: rejectUnauthorized,
      requestCert: true,
      secureContext: secureContext,
      isServer: false
    });
    // error handler for secure socket
    secureSocket.on('_tlsError', function(err) {
      if (secureEstablished) {
        connection._handleNetworkError(err);
      } else {
        onSecure(err);
      }
    });
    secureSocket.on('secure', function() {
      secureEstablished = true;
      onSecure(rejectUnauthorized ? this.ssl.verifyError() : null);
    });
    secureSocket.on('data', function(data) {
      connection.packetParser.execute(data);
    });
    connection.write = function(buffer) {
      secureSocket.write(buffer);
    };
    // start TLS communications
    secureSocket._start();
  }

  pipe() {
    const connection = this;
    if (this.stream instanceof Net.Stream) {
      this.stream.ondata = function(data, start, end) {
        connection.packetParser.execute(data, start, end);
      };
    } else {
      this.stream.on('data', function(data) {
        connection.packetParser.execute(
          data.parent,
          data.offset,
          data.offset + data.length
        );
      });
    }
  }

  protocolError(message, code) {
    const err = new Error(message);
    err.fatal = true;
    err.code = code || 'PROTOCOL_ERROR';
    this.emit('error', err);
  }

  handlePacket(packet) {
    if (this._paused) {
      this._paused_packets.push(packet);
      return;
    }
    if (packet) {
      if (this.sequenceId !== packet.sequenceId) {
        const err = new Error(
          'Warning: got packets out of order. Expected ' +
            this.sequenceId +
            ' but received ' +
            packet.sequenceId
        );
        err.expected = this.sequenceId;
        err.received = packet.sequenceId;
        this.emit('warn', err); // REVIEW
        // eslint-disable-next-line no-console
        console.error(err.message);
      }
      this._bumpSequenceId(packet.numPackets);
    }
    if (this.config.debug) {
      if (packet) {
        // eslint-disable-next-line no-console
        console.log(
          ' raw: ' +
            packet.buffer
              .slice(packet.offset, packet.offset + packet.length())
              .toString('hex')
        );
        // eslint-disable-next-line no-console
        console.trace();
        const commandName = this._command
          ? this._command._commandName
          : '(no command)';
        const stateName = this._command
          ? this._command.stateName()
          : '(no command)';
        // eslint-disable-next-line no-console
        console.log(
          this._internalId +
            ' ' +
            this.connectionId +
            ' ==> ' +
            commandName +
            '#' +
            stateName +
            '(' +
            [packet.sequenceId, packet.type(), packet.length()].join(',') +
            ')'
        );
      }
    }
    if (!this._command) {
      this.protocolError(
        'Unexpected packet while no commands in the queue',
        'PROTOCOL_UNEXPECTED_PACKET'
      );
      this.close();
      return;
    }
    const done = this._command.execute(packet, this);
    if (done) {
      this._command = this._commands.shift();
      if (this._command) {
        this.sequenceId = 0;
        this.compressedSequenceId = 0;
        this.handlePacket();
      }
    }
  }

  addCommand(cmd) {
    // this.compressedSequenceId = 0;
    // this.sequenceId = 0;
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('Add command: ' + arguments.callee.caller.name);
      cmd._commandName = arguments.callee.caller.name;
    }
    if (!this._command) {
      this._command = cmd;
      this.handlePacket();
    } else {
      this._commands.push(cmd);
    }
    return cmd;
  }

  format(sql, values) {
    if (typeof this.config.queryFormat == 'function') {
      return this.config.queryFormat.call(
        this,
        sql,
        values,
        this.config.timezone
      );
    }
    const opts = {
      sql: sql,
      values: values
    };
    this._resolveNamedPlaceholders(opts);
    return SqlString.format(
      opts.sql,
      opts.values,
      this.config.stringifyObjects,
      this.config.timezone
    );
  }

  escape(value) {
    return SqlString.escape(value, false, this.config.timezone);
  }

  escapeId(value) {
    return SqlString.escapeId(value, false);
  }

  raw(sql) {
    return SqlString.raw(sql);
  }

  _resolveNamedPlaceholders(options) {
    let unnamed;
    if (this.config.namedPlaceholders || options.namedPlaceholders) {
      if (convertNamedPlaceholders === null) {
        convertNamedPlaceholders = require('named-placeholders')();
      }
      unnamed = convertNamedPlaceholders(options.sql, options.values);
      options.sql = unnamed[0];
      options.values = unnamed[1];
    }
  }

  query(sql, values, cb) {
    let cmdQuery;
    if (sql.constructor == Commands.Query) {
      cmdQuery = sql;
    } else {
      cmdQuery = Connection.createQuery(sql, values, cb, this.config);
    }
    this._resolveNamedPlaceholders(cmdQuery);
    const rawSql = this.format(cmdQuery.sql, cmdQuery.values || []);
    cmdQuery.sql = rawSql;
    return this.addCommand(cmdQuery);
  }

  pause() {
    this._paused = true;
    this.stream.pause();
  }

  resume() {
    let packet;
    this._paused = false;
    while ((packet = this._paused_packets.shift())) {
      this.handlePacket(packet);
      // don't resume if packet hander paused connection
      if (this._paused) {
        return;
      }
    }
    this.stream.resume();
  }

  // TODO: named placeholders support
  prepare(options, cb) {
    if (typeof options == 'string') {
      options = { sql: options };
    }
    return this.addCommand(new Commands.Prepare(options, cb));
  }

  unprepare(sql) {
    let options = {};
    if (typeof sql === 'object') {
      options = sql;
    } else {
      options.sql = sql;
    }
    const key = Connection.statementKey(options);
    const stmt = this._statements.get(key);
    if (stmt) {
      this._statements.del(key);
      stmt.close();
    }
    return stmt;
  }

  execute(sql, values, cb) {
    let options = {};
    if (typeof sql === 'object') {
      // execute(options, cb)
      options = sql;
      if (typeof values === 'function') {
        cb = values;
      } else {
        options.values = options.values || values;
      }
    } else if (typeof values === 'function') {
      // execute(sql, cb)
      cb = values;
      options.sql = sql;
      options.values = undefined;
    } else {
      // execute(sql, values, cb)
      options.sql = sql;
      options.values = values;
    }
    this._resolveNamedPlaceholders(options);
    // check for values containing undefined
    if (options.values) {
      options.values.forEach(function(val) {
        if (val === undefined) {
          throw new TypeError(
            'Bind parameters must not contain undefined. To pass SQL NULL specify JS null'
          );
        }
        if (typeof val === 'function') {
          throw new TypeError(
            'Bind parameters must not contain function(s). To pass the body of a function as a string call .toString() first'
          );
        }
      });
    }
    const executeCommand = new Commands.Execute(options, cb);
    const prepareCommand = new Commands.Prepare(options, function(err, stmt) {
      if (err) {
        // skip execute command if prepare failed, we have main
        // combined callback here
        executeCommand.start = function() {
          return null;
        };
        if (cb) {
          cb(err);
        } else {
          executeCommand.emit('error', err);
        }
        executeCommand.emit('end');
        return;
      }
      executeCommand.statement = stmt;
    });
    this.addCommand(prepareCommand);
    this.addCommand(executeCommand);
    return executeCommand;
  }

  changeUser(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }
    const charsetNumber = options.charset
      ? ConnectionConfig.getCharsetNumber(options.charset)
      : this.config.charsetNumber;
    return this.addCommand(
      new Commands.ChangeUser(
        {
          user: options.user || this.config.user,
          password: options.password || this.config.password,
          passwordSha1: options.passwordSha1 || this.config.passwordSha1,
          database: options.database || this.config.database,
          timeout: options.timeout,
          charsetNumber: charsetNumber,
          currentConfig: this.config
        },
        function(err) {
          if (err) {
            err.fatal = true;
          }
          if (callback) {
            callback(err);
          }
        }
      )
    );
  }

  // transaction helpers
  beginTransaction(cb) {
    return this.query('START TRANSACTION', cb);
  }

  commit(cb) {
    return this.query('COMMIT', cb);
  }

  rollback(cb) {
    return this.query('ROLLBACK', cb);
  }

  ping(cb) {
    return this.addCommand(new Commands.Ping(cb));
  }

  _registerSlave(opts, cb) {
    return this.addCommand(new Commands.RegisterSlave(opts, cb));
  }

  _binlogDump(opts, cb) {
    return this.addCommand(new Commands.BinlogDump(opts, cb));
  }

  // currently just alias to close
  destroy() {
    this.close();
  }

  close() {
    if (this.connectTimeout) {
      Timers.clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    this._closing = true;
    this.stream.end();
    const connection = this;
    connection.addCommand = connection._addCommandClosedState;
  }

  createBinlogStream(opts) {
    // TODO: create proper stream class
    // TODO: use through2
    let test = 1;
    const stream = new Readable({ objectMode: true });
    stream._read = function() {
      return {
        data: test++
      };
    };
    this._registerSlave(opts, () => {
      const dumpCmd = this._binlogDump(opts);
      dumpCmd.on('event', ev => {
        stream.push(ev);
      });
      dumpCmd.on('eof', () => {
        stream.push(null);
        // if non-blocking, then close stream to prevent errors
        if (opts.flags && opts.flags & 0x01) {
          this.close();
        }
      });
      // TODO: pipe errors as well
    });
    return stream;
  }

  connect(cb) {
    if (!cb) {
      return;
    }
    let connectCalled = 0;
    function callbackOnce(isErrorHandler) {
      return function(param) {
        if (!connectCalled) {
          if (isErrorHandler) {
            cb(param);
          } else {
            cb(null, param);
          }
        }
        connectCalled = 1;
      };
    }
    this.once('error', callbackOnce(true));
    this.once('connect', callbackOnce(false));
  }

  // ===================================
  // outgoing server connection methods
  // ===================================
  writeColumns(columns) {
    const connection = this;
    this.writePacket(Packets.ResultSetHeader.toPacket(columns.length));
    columns.forEach(function(column) {
      connection.writePacket(
        Packets.ColumnDefinition.toPacket(
          column,
          connection.serverConfig.encoding
        )
      );
    });
    this.writeEof();
  }

  // row is array of columns, not hash
  writeTextRow(column) {
    this.writePacket(
      Packets.TextRow.toPacket(column, this.serverConfig.encoding)
    );
  }

  writeTextResult(rows, columns) {
    const connection = this;
    connection.writeColumns(columns);
    rows.forEach(function(row) {
      const arrayRow = new Array(columns.length);
      columns.forEach(function(column) {
        arrayRow.push(row[column.name]);
      });
      connection.writeTextRow(arrayRow);
    });
    connection.writeEof();
  }

  writeEof(warnings, statusFlags) {
    this.writePacket(Packets.EOF.toPacket(warnings, statusFlags));
  }

  writeOk(args) {
    if (!args) {
      args = { affectedRows: 0 };
    }
    this.writePacket(Packets.OK.toPacket(args, this.serverConfig.encoding));
  }

  writeError(args) {
    // if we want to send error before initial hello was sent, use default encoding
    const encoding = this.serverConfig ? this.serverConfig.encoding : 'cesu8';
    this.writePacket(Packets.Error.toPacket(args, encoding));
  }

  serverHandshake(args) {
    this.serverConfig = args;
    this.serverConfig.encoding =
      CharsetToEncoding[this.serverConfig.characterSet];
    return this.addCommand(new Commands.ServerHandshake(args));
  }

  // ===============================================================
  end(callback) {
    if (this.config.isServer) {
      this._closing = true;
      const quitCmd = new EventEmitter();
      setImmediate(() => {
        this.stream.end();
        quitCmd.emit('end');
      });
      return quitCmd;
    }
    // trigger error if more commands enqueued after end command
    const quitCmd = this.addCommand(new Commands.Quit(callback));
    this.addCommand = this._addCommandClosedState;
    return quitCmd;
  }

  static createQuery(sql, values, cb, config) {
    let options = {
      rowsAsArray: config.rowsAsArray
    };
    if (typeof sql === 'object') {
      // query(options, cb)
      options = sql;
      if (typeof values === 'function') {
        cb = values;
      } else if (values !== undefined) {
        options.values = values;
      }
    } else if (typeof values === 'function') {
      // query(sql, cb)
      cb = values;
      options.sql = sql;
      options.values = undefined;
    } else {
      // query(sql, values, cb)
      options.sql = sql;
      options.values = values;
    }
    return new Commands.Query(options, cb);
  }

  static statementKey(options) {
    return (
      typeof options.nestTables +
      '/' +
      options.nestTables +
      '/' +
      options.rowsAsArray +
      options.sql
    );
  }
}

if (Tls.TLSSocket) {
  // not supported
} else {
  Connection.prototype.startTLS = function _startTLS(onSecure) {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('Upgrading connection to TLS');
    }
    const connection = this;
    const crypto = require('crypto');
    const config = this.config;
    const stream = this.stream;
    const rejectUnauthorized = this.config.ssl.rejectUnauthorized;
    const credentials = crypto.createCredentials({
      key: config.ssl.key,
      cert: config.ssl.cert,
      passphrase: config.ssl.passphrase,
      ca: config.ssl.ca,
      ciphers: config.ssl.ciphers
    });
    const securePair = Tls.createSecurePair(
      credentials,
      false,
      true,
      rejectUnauthorized
    );

    if (stream.ondata) {
      stream.ondata = null;
    }
    stream.removeAllListeners('data');
    stream.pipe(securePair.encrypted);
    securePair.encrypted.pipe(stream);
    securePair.cleartext.on('data', function(data) {
      connection.packetParser.execute(data);
    });
    connection.write = function(buffer) {
      securePair.cleartext.write(buffer);
    };
    securePair.on('secure', function() {
      onSecure(rejectUnauthorized ? this.ssl.verifyError() : null);
    });
  };
}

module.exports = Connection;
