'use strict';

const fs = require('fs');

const Readable = require('stream').Readable;

const Command = require('./command.js');
const Packets = require('../packets/index.js');
const getTextParser = require('../parsers/text_parser.js');
const ServerStatus = require('../constants/server_status.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');

const EmptyPacket = new Packets.Packet(0, Buffer.allocUnsafe(4), 0, 4);

// http://dev.mysql.com/doc/internals/en/com-query.html
class Query extends Command {
  constructor(options, callback) {
    super();
    this.sql = options.sql;
    this.values = options.values;
    this._queryOptions = options;
    this.namedPlaceholders = options.namedPlaceholders || false;
    this.onResult = callback;
    this._fieldCount = 0;
    this._rowParser = null;
    this._fields = [];
    this._rows = [];
    this._receivedFieldsCount = 0;
    this._resultIndex = 0;
    this._localStream = null;
    this._unpipeStream = function() {};
    this._streamFactory = options.infileStreamFactory;
    this._connection = null;
  }

  then() {
    const err =
      "You have tried to call .then(), .catch(), or invoked await on the result of query that is not a promise, which is a programming error. Try calling con.promise().query(), or require('mysql2/promise') instead of 'mysql2' for a promise-compatible version of the query interface. To learn how to use async/await or Promises check out documentation at https://www.npmjs.com/package/mysql2#using-promise-wrapper, or the mysql2 documentation at https://github.com/sidorares/node-mysql2/tree/master/documentation/Promise-Wrapper.md";
    // eslint-disable-next-line
    console.log(err);
    throw new Error(err);
  }

  start(packet, connection) {
    if (connection.config.debug) {
      // eslint-disable-next-line
      console.log('        Sending query command: %s', this.sql);
    }
    this._connection = connection;
    this.options = Object.assign({}, connection.config, this._queryOptions);
    const cmdPacket = new Packets.Query(
      this.sql,
      connection.config.charsetNumber
    );
    connection.writePacket(cmdPacket.toPacket(1));
    return Query.prototype.resultsetHeader;
  }

  done() {
    this._unpipeStream();
    if (this.onResult) {
      let rows, fields;
      if (this._resultIndex === 0) {
        rows = this._rows[0];
        fields = this._fields[0];
      } else {
        rows = this._rows;
        fields = this._fields;
      }
      if (fields) {
        process.nextTick(() => {
          this.onResult(null, rows, fields);
        });
      } else {
        process.nextTick(() => {
          this.onResult(null, rows);
        });
      }
    }
    return null;
  }

  doneInsert(rs) {
    if (this._localStreamError) {
      if (this.onResult) {
        this.onResult(this._localStreamError, rs);
      } else {
        this.emit('error', this._localStreamError);
      }
      return null;
    }
    this._rows.push(rs);
    this._fields.push(void 0);
    this.emit('fields', void 0);
    this.emit('result', rs);
    if (rs.serverStatus & ServerStatus.SERVER_MORE_RESULTS_EXISTS) {
      this._resultIndex++;
      return this.resultsetHeader;
    }
    return this.done();
  }

  resultsetHeader(packet, connection) {
    const rs = new Packets.ResultSetHeader(packet, connection);
    this._fieldCount = rs.fieldCount;
    if (connection.config.debug) {
      // eslint-disable-next-line
      console.log(
        `        Resultset header received, expecting ${rs.fieldCount} column definition packets`
      );
    }
    if (this._fieldCount === 0) {
      return this.doneInsert(rs);
    }
    if (this._fieldCount === null) {
      this._localStream = this._findOrCreateReadStream(rs.infileName);
      // start streaming, after last packet expect OK
      // http://dev.mysql.com/doc/internals/en/com-query-response.html#local-infile-data
      this._streamLocalInfile(connection);
      return this.infileOk;
    }
    this._receivedFieldsCount = 0;
    this._rows.push([]);
    this._fields.push([]);
    return this.readField;
  }

  // some code taken from https://github.com/mysqljs/mysql/pull/668
  _findOrCreateReadStream(path) {
    if (this._streamFactory) {
      return this._streamFactory(path);
    }
    return fs.createReadStream(path, {
      flag: 'r',
      encoding: null,
      autoClose: true
    });
  }

  _streamLocalInfile(connection) {
    const onConnectionError = () => {
      this._unpipeStream();
    };
    const onDrain = () => {
      this._localStream.resume();
    };
    const onPause = () => {
      this._localStream.pause();
    };
    const onData = function(data) {
      const dataWithHeader = Buffer.allocUnsafe(data.length + 4);
      data.copy(dataWithHeader, 4);
      connection.writePacket(
        new Packets.Packet(0, dataWithHeader, 0, dataWithHeader.length)
      );
    };
    const onEnd = () => {
      connection.removeListener('error', onConnectionError);
      connection.writePacket(EmptyPacket);
    };
    const onError = err => {
      this._localStreamError = err;
      connection.removeListener('error', onConnectionError);
      connection.writePacket(EmptyPacket);
    };
    this._unpipeStream = () => {
      connection.stream.removeListener('pause', onPause);
      connection.stream.removeListener('drain', onDrain);
      this._localStream.removeListener('data', onData);
      this._localStream.removeListener('end', onEnd);
      this._localStream.removeListener('error', onError);
    };
    connection.stream.on('pause', onPause);
    connection.stream.on('drain', onDrain);
    this._localStream.on('data', onData);
    this._localStream.on('end', onEnd);
    this._localStream.on('error', onError);
    connection.once('error', onConnectionError);
  }

  readField(packet, connection) {
    this._receivedFieldsCount++;
    // Often there is much more data in the column definition than in the row itself
    // If you set manually _fields[0] to array of ColumnDefinition's (from previous call)
    // you can 'cache' result of parsing. Field packets still received, but ignored in that case
    // this is the reason _receivedFieldsCount exist (otherwise we could just use current length of fields array)
    if (this._fields[this._resultIndex].length !== this._fieldCount) {
      const field = new Packets.ColumnDefinition(
        packet,
        connection.clientEncoding
      );
      this._fields[this._resultIndex].push(field);
      if (connection.config.debug) {
        /* eslint-disable no-console */
        console.log('        Column definition:');
        console.log(`          name: ${field.name}`);
        console.log(`          type: ${field.columnType}`);
        console.log(`         flags: ${field.flags}`);
        /* eslint-enable no-console */
      }
    }
    // last field received
    if (this._receivedFieldsCount === this._fieldCount) {
      const fields = this._fields[this._resultIndex];
      this.emit('fields', fields);
      this._rowParser = getTextParser(fields, this.options, connection.config);
      return Query.prototype.fieldsEOF;
    }
    return Query.prototype.readField;
  }

  fieldsEOF(packet, connection) {
    // check EOF
    if (!packet.isEOF()) {
      return connection.protocolError('Expected EOF packet');
    }
    return this.row;
  }

  row(packet) {
    if (packet.isEOF()) {
      const status = packet.eofStatusFlags();
      const moreResults = status & ServerStatus.SERVER_MORE_RESULTS_EXISTS;
      if (moreResults) {
        this._resultIndex++;
        return Query.prototype.resultsetHeader;
      }
      return this.done();
    }
    const row = new this._rowParser(
      packet,
      this._fields[this._resultIndex],
      this.options,
      CharsetToEncoding
    );
    if (this.onResult) {
      this._rows[this._resultIndex].push(row);
    } else {
      this.emit('result', row);
    }
    return Query.prototype.row;
  }

  infileOk(packet, connection) {
    const rs = new Packets.ResultSetHeader(packet, connection);
    return this.doneInsert(rs);
  }

  stream(options) {
    options = options || {};
    options.objectMode = true;
    const stream = new Readable(options);
    stream._read = () => {
      this._connection && this._connection.resume();
    };
    this.on('result', row => {
      if (!stream.push(row)) {
        this._connection.pause();
      }
      stream.emit('result', row); // replicate old emitter
    });
    this.on('error', err => {
      stream.emit('error', err); // Pass on any errors
    });
    this.on('end', () => {
      stream.push(null); // pushing null, indicating EOF
      stream.emit('close'); // notify readers that query has completed
    });
    this.on('fields', fields => {
      stream.emit('fields', fields); // replicate old emitter
    });
    return stream;
  }
}

Query.prototype.catch = Query.prototype.then;

module.exports = Query;
