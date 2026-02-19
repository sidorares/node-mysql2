import type { PrepareStatementInfo, QueryError } from '../../index.js';
import { Buffer } from 'node:buffer';
import { assert, describe, it } from 'poku';
import PrepareCommand from '../../lib/commands/prepare.js';
import packets from '../../lib/packets/index.js';
import { createConnection, getMysqlVersion } from '../common.test.mjs';

await describe(async () => {
  await it('Unit Test - Prepare result with number of parameters incorrectly reported by the server', async () => {
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
      writePacket: (packet: InstanceType<typeof packets.Packet>) => {
        // client -> server COM_PREPARE
        packet.writeHeader(1);
        assert.equal(
          packet.buffer.toString('hex'),
          '1f0000011673656c656374202a2066726f6d207573657273206f72646572206279203f',
          'should report 0 actual parameters when 1 placeholder is used in ORDER BY ?'
        );
      },
    };

    await new Promise((resolve, reject) => {
      const prepareCommand = new PrepareCommand(
        { sql: 'select * from users order by ?' },
        (err: QueryError | null, result: PrepareStatementInfo) => {
          try {
            assert.equal(err, null, 'expect no error');

            // @ts-expect-error: TODO: implement typings
            assert.equal(result.parameters.length, 0, 'parameters');
            // @ts-expect-error: TODO: implement typings
            assert.equal(result.columns.length, 51, 'columns');
            // @ts-expect-error: TODO: implement typings
            assert.equal(result.id, 1, 'id');

            resolve(null);
          } catch (error) {
            reject(error);
          }
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
      const paramsEofPacket = new packets.Packet(
        0,
        Buffer.from('00000000fe000002002b000004', 'hex'),
        0,
        11
      );
      prepareCommand.execute(paramsEofPacket, connection);
      for (let i = 0; i < 51; ++i) {
        const columnDefinitionPacket = new packets.Packet(
          0,
          Buffer.from(
            '0000000003646566056d7973716c0475736572047573657204486f737404486f73740ce000fc030000fe034000000005000005',
            'hex'
          ),
          0,
          47
        );
        prepareCommand.execute(columnDefinitionPacket, connection);
      }
      const columnsEofPacket = new packets.Packet(
        0,
        Buffer.from('00000000fe000002002b000004', 'hex'),
        0,
        11
      );
      prepareCommand.execute(columnsEofPacket, connection);
    });
  });

  const connection = createConnection({
    database: 'mysql',
  });

  const mySqlVersion = await getMysqlVersion(connection);

  const hasIncorrectPrepareParameter = (() => {
    const incorrectVersions = ['8.1.0', '8.2.0', '8.3.0', '8.4.0'];
    const { major, minor, patch } = mySqlVersion;
    const verString = `${major}.${minor}.${patch}`;
    return incorrectVersions.includes(verString);
  })();

  await it('E2E Prepare result with number of parameters incorrectly reported by the server', async () => {
    const stmt = await new Promise<PrepareStatementInfo>((resolve, reject) => {
      connection.prepare(
        'select * from user order by ?',
        (err: QueryError | null, _stmt: PrepareStatementInfo) => {
          if (err) return reject(err);
          resolve(_stmt);
        }
      );
    });

    if (hasIncorrectPrepareParameter) {
      assert.equal(
        // @ts-expect-error: TODO: implement typings
        stmt.parameters.length,
        0,
        'should report 0 actual parameters when 1 placeholder is used in ORDER BY ?'
      );
    } else {
      assert.equal(
        // @ts-expect-error: TODO: implement typings
        stmt.parameters.length,
        1,
        'parameters length needs to be 1'
      );
    }
  });

  await it(async () => {
    const stmt = await new Promise<PrepareStatementInfo>((resolve, reject) => {
      connection.prepare(
        'select * from user where user.User like ? order by ?',
        (err: QueryError | null, _stmt: PrepareStatementInfo) => {
          if (err) return reject(err);
          resolve(_stmt);
        }
      );
    });

    if (hasIncorrectPrepareParameter) {
      assert.equal(
        // @ts-expect-error: TODO: implement typings
        stmt.parameters.length,
        1,
        'should report 1 actual parameters when 2 placeholders used in ORDER BY?'
      );
    } else {
      assert.equal(
        // @ts-expect-error: TODO: implement typings
        stmt.parameters.length,
        2,
        'parameters length needs to be 2'
      );
    }
  });

  connection.end();
});
