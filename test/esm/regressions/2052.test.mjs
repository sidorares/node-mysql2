import { assert, describe, test } from 'poku';
import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';

const require = createRequire(import.meta.url);
const common = require('../../common.test.cjs');
const packets = require('../../../lib/packets/index.js');
const PrepareCommand = require('../../../lib/commands/prepare.js');

test(async () => {
  await test(async () => {
    describe(
      'Unit Test - Prepare result with number of parameters incorrectly reported by the server',
      common.describeOptions,
    );

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
          '1f0000011673656c656374202a2066726f6d207573657273206f72646572206279203f',
          'should report 0 actual parameters when 1 placeholder is used in ORDER BY ?',
        );
      },
    };

    await new Promise((resolve, reject) => {
      const prepareCommand = new PrepareCommand(
        { sql: 'select * from users order by ?' },
        (err, result) => {
          try {
            assert.equal(err, null, 'expect no error');

            assert.equal(result.parameters.length, 0, 'parameters');
            assert.equal(result.columns.length, 51, 'columns');
            assert.equal(result.id, 1, 'id');

            resolve(null);
          } catch (error) {
            reject(error);
          }
        },
      );

      prepareCommand.execute(null, connection);
      const headerPacket = new packets.Packet(
        0,
        Buffer.from('0000000000010000003300010000000005000002', 'hex'),
        0,
        20,
      );
      prepareCommand.execute(headerPacket, connection);
      const paramsEofPacket = new packets.Packet(
        0,
        Buffer.from('00000000fe000002002b000004', 'hex'),
        0,
        11,
      );
      prepareCommand.execute(paramsEofPacket, connection);
      for (let i = 0; i < 51; ++i) {
        const columnDefinitionPacket = new packets.Packet(
          0,
          Buffer.from(
            '0000000003646566056d7973716c0475736572047573657204486f737404486f73740ce000fc030000fe034000000005000005',
            'hex',
          ),
          0,
          47,
        );
        prepareCommand.execute(columnDefinitionPacket, connection);
      }
      const columnsEofPacket = new packets.Packet(
        0,
        Buffer.from('00000000fe000002002b000004', 'hex'),
        0,
        11,
      );
      prepareCommand.execute(columnsEofPacket, connection);
    });
  });

  const connection = common.createConnection({
    database: 'mysql',
  });

  const mySqlVersion = await common.getMysqlVersion(connection);

  const hasIncorrectPrepareParameter = (() => {
    const { major, minor, patch } = mySqlVersion;

    if (major === 9) return false;
    if (major === 8 && minor === 4 && patch === 1) return false;
    if (major === 8 && minor === 0 && patch >= 38) return false;

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
  })();

  await test(
    async () =>
      new Promise((resolve, reject) => {
        describe(
          `E2E Prepare result with number of parameters incorrectly reported by the server`,
          common.describeOptions,
        );

        connection.prepare(
          'select * from user order by ?',
          async (err, stmt) => {
            if (err) {
              connection.end();
              reject(err);

              return;
            }

            if (hasIncorrectPrepareParameter) {
              assert.equal(
                stmt.parameters.length,
                0,
                'parameters length needs to be 0',
                'should report 0 actual parameters when 1 placeholder is used in ORDER BY ?',
              );
            } else {
              assert.equal(
                stmt.parameters.length,
                1,
                'parameters length needs to be 1',
              );
            }

            resolve(null);
          },
        );
      }),
  );

  await test(
    async () =>
      new Promise((resolve, reject) => {
        connection.prepare(
          'select * from user where user.User like ? order by ?',
          async (err, stmt) => {
            if (err) {
              connection.end();
              reject(err);

              return;
            }

            if (hasIncorrectPrepareParameter) {
              assert.equal(
                stmt.parameters.length,
                1,
                'parameters length needs to be 1',
                'should report 1 actual parameters when 2 placeholders used in ORDER BY?',
              );
            } else {
              assert.equal(
                stmt.parameters.length,
                2,
                'parameters length needs to be 2',
              );
            }

            resolve(null);
          },
        );
      }),
  );

  connection.end((err) => {
    assert.ifError(err);
  });
});
