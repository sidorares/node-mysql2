'use strict';

const CommandCode = require('../constants/commands.js');
const Errors = require('../constants/errors.js');

const Command = require('./command.js');
const Packets = require('../packets/index.js');
const Types = require('../constants/types');

class ServerHandshake extends Command {
  constructor(args) {
    super();
    this.args = args;
    /*
    this.protocolVersion = args.protocolVersion || 10;
    this.serverVersion   = args.serverVersion;
    this.connectionId    = args.connectionId,
    this.statusFlags     = args.statusFlags,
    this.characterSet    = args.characterSet,
    this.capabilityFlags = args.capabilityFlags || 512;
    */
  }

  start(packet, connection) {
    const serverHelloPacket = new Packets.Handshake(this.args);
    this.serverHello = serverHelloPacket;
    serverHelloPacket.setScrambleData(err => {
      if (err) {
        connection.emit('error', new Error('Error generating random bytes'));
        return;
      }
      connection.writePacket(serverHelloPacket.toPacket(0));
    });
    return ServerHandshake.prototype.readClientReply;
  }

  readClientReply(packet, connection) {
    // check auth here
    const clientHelloReply = Packets.HandshakeResponse.fromPacket(packet);
    // TODO check we don't have something similar already
    connection.clientHelloReply = clientHelloReply;
    if (this.args.authCallback) {
      this.args.authCallback(
        {
          user: clientHelloReply.user,
          database: clientHelloReply.database,
          address: connection.stream.remoteAddress,
          authPluginData1: this.serverHello.authPluginData1,
          authPluginData2: this.serverHello.authPluginData2,
          authToken: clientHelloReply.authToken
        },
        (err, mysqlError) => {
          // if (err)
          if (!mysqlError) {
            connection.writeOk();
          } else {
            // TODO create constants / errorToCode
            // 1045 = ER_ACCESS_DENIED_ERROR
            connection.writeError({
              message: mysqlError.message || '',
              code: mysqlError.code || 1045
            });
            connection.close();
          }
        }
      );
    } else {
      connection.writeOk();
    }
    return ServerHandshake.prototype.dispatchCommands;
  }

  dispatchCommands(packet, connection) {
    // command from client to server
    let knownCommand = true;
    const encoding = connection.clientHelloReply.encoding;
    const commandCode = packet.readInt8();
    switch (commandCode) {
      case CommandCode.STMT_PREPARE:
        if (connection.listeners('stmt_prepare').length) {
          const query = packet.readString(undefined, encoding);
          connection.emit('stmt_prepare', query);
        } else {
          connection.writeError({
            code: Errors.HA_ERR_INTERNAL_ERROR,
            message:
              'No query handler for prepared statements.'
          });
        }
        break;
      case CommandCode.STMT_EXECUTE:
        if (connection.listeners('stmt_execute').length) {
          console.log(packet)
          const stmtId = packet.readInt32();
          const flags = packet.readInt8();
          const iterationCount = packet.readInt32();

          let nullBitmaps = 0;
          let i = packet.offset;
          while (i < packet.end - 1) {
            if((packet.buffer[i+1] == Types.VAR_STRING 
              || packet.buffer[i+1] == Types.NULL 
              || packet.buffer[i+1] == Types.DOUBLE
              || packet.buffer[i+1] == Types.TINY
              || packet.buffer[i+1] == Types.DATETIME
              || packet.buffer[i+1] == Types.JSON) && packet.buffer[i] == 1 && packet.buffer[i+2] == 0) {
                break
            }
            else {
              nullBitmaps += packet.readInt8();
            }
            i++;
          }

          const types = [];

          for(let i = packet.offset + 1; i < packet.end - 1; i++) {
            if((packet.buffer[i] == Types.VAR_STRING 
              || packet.buffer[i] == Types.NULL 
              || packet.buffer[i] == Types.DOUBLE
              || packet.buffer[i] == Types.TINY
              || packet.buffer[i] == Types.DATETIME
              || packet.buffer[i] == Types.JSON) && packet.buffer[i + 1] == 0) {
                types.push(packet.buffer[i]);
                packet.skip(2);
            }
          }

          packet.skip(1);

          const values = [];
          for(let i = 0; i < types.length; i++) {
            if(types[i] == Types.VAR_STRING) {
              values.push(packet.readLengthCodedString(encoding))
            }
            else if(types[i] == Types.DOUBLE) {
              values.push(packet.readDouble())
            }
            else if(types[i] == Types.TINY) {
              values.push(packet.readInt8())
            }
            else if(types[i] == Types.DATETIME) {
              values.push(packet.readDateTime())
            }
            else if(types[i] == Types.JSON) {
              values.push(JSON.parse(packet.readLengthCodedString(encoding)))
            }
            if(types[i] == Types.NULL) {
              values.push(null)
            }
          }
          console.log(values)

          connection.emit('stmt_execute', stmtId, flags, iterationCount, values);
        } else {
          connection.writeError({
            code: Errors.HA_ERR_INTERNAL_ERROR,
            message:
              'No query handler for execute statements.'
          });
        }
        break;
      case CommandCode.QUIT:
        if (connection.listeners('quit').length) {
          connection.emit('quit');
        } else {
          connection.stream.end();
        }
        break;
      case CommandCode.INIT_DB:
        if (connection.listeners('init_db').length) {
          const schemaName = packet.readString(undefined, encoding);
          connection.emit('init_db', schemaName);
        } else {
          connection.writeOk();
        }
        break;
      case CommandCode.QUERY:
        if (connection.listeners('query').length) {
          const query = packet.readString(undefined, encoding);
          connection.emit('query', query);
        } else {
          connection.writeError({
            code: Errors.HA_ERR_INTERNAL_ERROR,
            message: 'No query handler'
          });
        }
        break;
      case CommandCode.FIELD_LIST:
        if (connection.listeners('field_list').length) {
          const table = packet.readNullTerminatedString();
          const fields = packet.readString(undefined, encoding);
          connection.emit('field_list', table, fields);
        } else {
          connection.writeError({
            code: Errors.ER_WARN_DEPRECATED_SYNTAX,
            message:
              'As of MySQL 5.7.11, COM_FIELD_LIST is deprecated and will be removed in a future version of MySQL.'
          });
        }
        break;
      case CommandCode.PING:
        if (connection.listeners('ping').length) {
          connection.emit('ping');
        } else {
          connection.writeOk();
        }
        break;
      default:
        knownCommand = false;
    }
    if (connection.listeners('packet').length) {
      connection.emit('packet', packet.clone(), knownCommand, commandCode);
    } else if (!knownCommand) {
      // eslint-disable-next-line no-console
      console.log('Unknown command:', commandCode);
    }
    return ServerHandshake.prototype.dispatchCommands;
  }
}

module.exports = ServerHandshake;

// TODO: implement server-side 4.1 authentication
/*
4.1 authentication: (http://bazaar.launchpad.net/~mysql/mysql-server/5.5/view/head:/sql/password.c)

  SERVER:  public_seed=create_random_string()
           send(public_seed)

  CLIENT:  recv(public_seed)
           hash_stage1=sha1("password")
           hash_stage2=sha1(hash_stage1)
           reply=xor(hash_stage1, sha1(public_seed,hash_stage2)

           // this three steps are done in scramble()

           send(reply)


  SERVER:  recv(reply)
           hash_stage1=xor(reply, sha1(public_seed,hash_stage2))
           candidate_hash2=sha1(hash_stage1)
           check(candidate_hash2==hash_stage2)

server stores sha1(sha1(password)) ( hash_stag2)
*/
