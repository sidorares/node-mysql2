import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('Query Attributes', async () => {
  const connection = createConnection();
  const promiseConn = connection.promise();
  const mySqlVersion = await getMysqlVersion(promiseConn);

  if (mySqlVersion.major < 8) {
    console.log(
      `Skipping query attributes test: requires MySQL 8.0.25+, got ${mySqlVersion.major}.${mySqlVersion.minor}.${mySqlVersion.patch}`
    );
    connection.end();
    return;
  }

  // component_query_attributes ships with MySQL 8.0.25+
  try {
    await promiseConn.query(
      "INSTALL COMPONENT 'file://component_query_attributes'"
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already installed')) {
      console.log(
        `Skipping query attributes test: could not install component (${msg})`
      );
      connection.end();
      return;
    }
  }

  await it('should send string attributes via COM_QUERY', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: "SELECT mysql_query_attribute_string('trace_id') AS trace_id",
          attributes: { trace_id: 'abc-123' },
        },
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
    strict.strictEqual(rows[0].trace_id, 'abc-123');
  });

  await it('should send numeric attributes via COM_QUERY', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: "SELECT mysql_query_attribute_string('count') AS count_val",
          attributes: { count: 42 },
        },
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
    strict.strictEqual(rows[0].count_val, '42');
  });

  await it('should send multiple attributes via COM_QUERY', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: `SELECT
            mysql_query_attribute_string('a1') AS a1,
            mysql_query_attribute_string('a2') AS a2`,
          attributes: { a1: 'hello', a2: 'world' },
        },
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
    strict.strictEqual(rows[0].a1, 'hello');
    strict.strictEqual(rows[0].a2, 'world');
  });

  await it('should return NULL for attributes not sent', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: "SELECT mysql_query_attribute_string('missing') AS val",
          attributes: { other: 'present' },
        },
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
    strict.strictEqual(rows[0].val, null);
  });

  await it('should send attributes via COM_STMT_EXECUTE', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        {
          sql: "SELECT ? AS bind_val, mysql_query_attribute_string('tag') AS tag",
          values: [99],
          attributes: { tag: 'prepared' },
        },
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
    strict.strictEqual(rows[0].bind_val, 99);
    strict.strictEqual(rows[0].tag, 'prepared');
  });

  connection.end();
});
