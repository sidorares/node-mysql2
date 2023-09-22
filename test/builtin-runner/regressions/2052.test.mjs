import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import common from '../../common.js';
import PrepareCommand from '../../../lib/commands/prepare.js';
import packets from '../../../lib/packets/index.js';

describe(
  'Unit test - prepare result with number of parameters incorrectly reported by the server',
  { timeout: 1000 },
  () => {
    it('should report 0 actual parameters when 1 placeholder is used in ORDER BY ?', (t, done) => {
      const connection = {
        sequenceId: 1,
        constructor: {
          statementKey: () => 0,
        },
        _handshakePacket: {},
        _resetSequenceId: () => {},
        _statements: new Map(),
        serverEncoding: 'utf8',
        clientEncoding: 'utf8',
        config: {
          charsetNumber: 33,
        },
        writePacket: (packet) => {
          // client -> server COM_PREPARE
          packet.writeHeader(1);
          assert.equal(
            packet.buffer.toString('hex'),
            '1f0000011673656c656374202a2066726f6d207573657273206f72646572206279203f'
          );
        },
      };
      const prepareCommand = new PrepareCommand(
        { sql: 'select * from users order by ?' },
        (err, result) => {
          assert.equal(err, null);
          debugger;
          assert.equal(result.parameters.length, 0);
          assert.equal(result.columns.length, 51);
          assert.equal(result.id, 1);
          done(null);
        }
      );

      prepareCommand.execute(null, connection);
      const headerPacket = new packets.Packet(
        0,
        Buffer.from('0000000000010000003300010000000005000002', 'hex'),
        0,
        20
      );
      prepareCommand.execute(headerPacket, connection);
      const paramsEofPacket = new packets.Packet(0, Buffer.from('00000000fe000002002b000004', 'hex'), 0, 11);
      prepareCommand.execute(paramsEofPacket, connection);
      for (let i = 0; i < 51; ++i) {
        const columnDefinitionPacket = new packets.Packet(
          0,
          Buffer.from(
            '0000000003646566056d7973716c0475736572047573657204486f737404486f73740ce000fc030000fe034000000005000005', 'hex'
          ),
          0,
          47
        );
        prepareCommand.execute(columnDefinitionPacket, connection);
      }
      const columnsEofPacket = new packets.Packet(0, Buffer.from('00000000fe000002002b000004', 'hex'), 0, 11);
      prepareCommand.execute(columnsEofPacket, connection);
    });
  }
);

describe('E2E Prepare result with number of parameters incorrectly reported by the server', 
  { timeout: 1000 }, 
  () => {
  let connection;

  function isNewerThan8_0_22() {
    const { serverVersion } = connection._handshakePacket;
    const [major, minor, patch] = serverVersion.split('.').map((x) => parseInt(x, 10));
    if (major > 8) {
      return true;
    }
    if (major === 8 && minor > 0) {
      return true;
    }
    if (major === 8 && minor === 0 && patch >= 22) {
      return true;
    }
    return false;
  }

  beforeEach((t, done) => {
    connection = common.createConnection({
      database: 'mysql',
    });
    connection.on('error', (err) => {
      done(err);
    });
    connection.on('connect', () => {
      done(null);
    });
  });

  afterEach((t, done) => {
    connection.end(err => {
      done(null)
    });
  });

  // see https://github.com/sidorares/node-mysql2/issues/2052#issuecomment-1620318928
  it('should report 0 actual parameters when 1 placeholder is used in ORDER BY ?', (t, done) => {    
    connection.prepare('select * from user order by ?', (err, stmt) => {
      if (err) {
        if (!err.fatal) {
          connection.end();
        }
        done(err);
      } else {
        if(isNewerThan8_0_22()) {
          // mysql 8.0.22 and newer report 0 parameters
          assert.equal(stmt.parameters.length, 0);
        } else {
          // mariadb, mysql 8.0.21 and older report 1 parameter
          assert.equal(stmt.parameters.length, 1);
        }
        done(null);
      }
    });
  });

  it('should report 1 actual parameters when 2 placeholders used in ORDER BY?', (t, done) => {    
    connection.prepare('select * from user where user.User like ? order by ?', (err, stmt) => {
      if (err) {
        if (!err.fatal) {
          connection.end();
        }
        done(err);
      } else {
        if(isNewerThan8_0_22()) {
          // mysql 8.0.22 and newer report 1 parameter
          assert.equal(stmt.parameters.length, 1);
        } else {
          // mariadb, mysql 8.0.21 and older report 2 parameters
          assert.equal(stmt.parameters.length, 2);
        }
        done(null);
      }
    });
  });
});