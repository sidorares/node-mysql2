import type {
  PrepareStatementInfo,
  ResultSetHeader,
  RowDataPacket,
} from '../../../index.js';
import { describe, it, strict } from 'poku';
import { expand as expandFromEsm } from 'sql-escaper';
import mysql from '../../../index.js';
import mysqlp from '../../../promise.js';
import { config, createConnection, createPool } from '../../common.test.mjs';

type DomainRow = RowDataPacket & { id: number; domain: string };
type DocRow = RowDataPacket & { id: number; foo: string; hasModified: number };
type AccountRow = RowDataPacket & { id: number };
type CountRow = RowDataPacket & { total: number };

await describe('Regression #4126 — object placeholders expand in SET assignment lists', async () => {
  await describe('client-side formatting', async () => {
    const connection = createConnection();

    it('should expand ?? and ? object inside SET STATEMENT ... FOR INSERT', () => {
      strict.equal(
        connection.format(
          'SET STATEMENT max_statement_time=15 FOR INSERT INTO ?? SET ?',
          ['domains', { id: 1, domain: 'test.com' }]
        ),
        "SET STATEMENT max_statement_time=15 FOR INSERT INTO `domains` SET `id` = 1, `domain` = 'test.com'"
      );
    });

    it('should expand ? object after UTC_TIMESTAMP() in an UPDATE SET list', () => {
      strict.equal(
        connection.format(
          'UPDATE docs SET modified = UTC_TIMESTAMP(), ? WHERE id = ?',
          [{ foo: 'bar' }, 123]
        ),
        "UPDATE docs SET modified = UTC_TIMESTAMP(), `foo` = 'bar' WHERE id = 123"
      );
    });

    await connection.promise().end();
  });

  await describe('end-to-end execution', async () => {
    const pool = createPool({ connectionLimit: 1 }).promise();

    await it('should insert via object-form query with ??, ? object and timeout', async () => {
      await pool.query(
        'CREATE TEMPORARY TABLE domains (id INT PRIMARY KEY, domain VARCHAR(255))'
      );

      const [result] = await pool.query<ResultSetHeader>({
        sql: 'INSERT INTO ?? SET ?',
        values: ['domains', { id: 1, domain: 'test.com' }],
        timeout: 16000,
      });
      const [rows] = await pool.query<DomainRow[]>(
        'SELECT id, domain FROM domains'
      );

      strict.equal(result.affectedRows, 1);
      strict.equal(rows.length, 1);
      strict.equal(rows[0].id, 1);
      strict.equal(rows[0].domain, 'test.com');
    });

    await it('should update via ? object mixed with UTC_TIMESTAMP()', async () => {
      await pool.query(
        'CREATE TEMPORARY TABLE docs (id INT PRIMARY KEY, foo VARCHAR(50), modified DATETIME)'
      );
      await pool.query('INSERT INTO docs (id, foo) VALUES (123, ?)', ['old']);

      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE docs SET modified = UTC_TIMESTAMP(), ? WHERE id = ?',
        [{ foo: 'bar' }, 123]
      );
      const [rows] = await pool.query<DocRow[]>(
        'SELECT id, foo, modified IS NOT NULL AS hasModified FROM docs'
      );

      strict.equal(result.affectedRows, 1);
      strict.equal(rows.length, 1);
      strict.equal(rows[0].foo, 'bar');
      strict.equal(rows[0].hasModified, 1);
    });

    await pool.end();
  });
});

await describe('Regression #4126: expand() marks one object to expand at any placeholder', async () => {
  await describe('client-side formatting', async () => {
    const stringifyingConnection = mysql.createConnection({
      ...config,
      stringifyObjects: true,
    });
    const namedConnection = createConnection({ namedPlaceholders: true });

    it('should expand a marked object at a lone ? through mysql2 and mysql2/promise', () => {
      const callbackStatement = mysql.format('?', [
        mysql.expand({ id: 1 }, ['id']),
      ]);
      const promiseStatement = mysqlp.format('?', [
        mysqlp.expand({ id: 1 }, ['id']),
      ]);

      strict.equal(callbackStatement, '`id` = 1');
      strict.equal(promiseStatement, '`id` = 1');
    });

    it('should render the reported JSON value as 3.16 did', () => {
      const statement = mysqlp.format('?', [
        mysqlp.expand({ foo: JSON.stringify([['bar', 123]]) }, ['foo']),
      ]);

      strict.equal(statement, '`foo` = \'[[\\"bar\\",123]]\'');
    });

    it('should honor a mark created by the ESM build of SQL Escaper', () => {
      const statement = mysql.format('SELECT * FROM users WHERE ?', [
        expandFromEsm({ id: 1 }),
      ]);

      strict.notEqual(expandFromEsm, mysql.expand);
      strict.equal(statement, 'SELECT * FROM users WHERE `id` = 1');
    });

    it('should keep an unmarked object inert in the same statement', () => {
      const statement = mysql.format('SELECT * FROM users WHERE ? AND id = ?', [
        mysql.expand({ role: 'admin' }, ['role']),
        { id: 1 },
      ]);

      strict.equal(
        statement,
        "SELECT * FROM users WHERE `role` = 'admin' AND id = '[object Object]'"
      );
    });

    it('should expand a mark on a connection with stringifyObjects', () => {
      const statement = stringifyingConnection.format(
        'SELECT * FROM users WHERE ?',
        [mysql.expand({ id: 1 }, ['id'])]
      );

      strict.equal(statement, 'SELECT * FROM users WHERE `id` = 1');
    });

    it('should expand a mark under a named placeholder', () => {
      const statement = namedConnection.format(
        'SELECT * FROM users WHERE :filter',
        { filter: mysql.expand({ id: 1 }, ['id']) }
      );

      strict.equal(statement, 'SELECT * FROM users WHERE `id` = 1');
    });

    await stringifyingConnection.promise().end();
    await namedConnection.promise().end();
  });

  describe('allowed columns', () => {
    const entryPoints = [
      { name: 'mysql2', expand: mysql.expand, format: mysql.format },
      { name: 'mysql2/promise', expand: mysqlp.expand, format: mysqlp.format },
    ];
    const invalidColumns: { name: string; columns: unknown }[] = [
      { name: 'a missing list', columns: undefined },
      { name: 'a string', columns: 'name' },
      { name: 'an array holding a number', columns: [1] },
      { name: 'null', columns: null },
      { name: 'a Set', columns: new Set(['name']) },
    ];
    const nonObjectBodies: { name: string; value: unknown }[] = [
      { name: 'an array', value: ['Ana'] },
      { name: 'a string', value: 'Ana' },
    ];

    for (const { name, expand, format } of entryPoints) {
      describe(`through ${name}`, () => {
        it('should leave every key outside the allowed columns out of the statement', () => {
          const statement = format('UPDATE users SET ? WHERE id = ?', [
            expand({ name: 'Ana', role: 'admin', is_admin: 1 }, ['name']),
            1,
          ]);

          strict.equal(
            statement,
            "UPDATE users SET `name` = 'Ana' WHERE id = 1"
          );
        });

        it('should leave an allowed column the object lacks out of the statement', () => {
          const statement = format('UPDATE users SET ? WHERE id = ?', [
            expand({ name: 'Ana' }, ['name', 'email']),
            1,
          ]);

          strict.equal(
            statement,
            "UPDATE users SET `name` = 'Ana' WHERE id = 1"
          );
        });

        it('should expand only the allowed keys of a Map', () => {
          const statement = format('?', [
            expand(
              new Map([
                ['name', 'Ana'],
                ['role', 'admin'],
              ]),
              ['name']
            ),
          ]);

          strict.equal(statement, "`name` = 'Ana'");
        });

        it('should never expand an allowed key the object only inherits', () => {
          const body: Record<string, unknown> = Object.setPrototypeOf(
            { name: 'Ana' },
            { role: 'admin' }
          );
          const statement = format('?', [expand(body, ['name', 'role'])]);

          strict.equal(statement, "`name` = 'Ana'");
        });

        for (const { name: kind, columns } of invalidColumns) {
          it(`should reject ${kind} as the allowed columns with a TypeError`, () => {
            // @ts-expect-error: testing runtime behavior when the allowed columns are not an array of strings
            strict.throws(() => expand({ name: 'Ana' }, columns), TypeError);
          });
        }

        for (const { name: kind, value } of nonObjectBodies) {
          it(`should still reject ${kind} as the value with a TypeError`, () => {
            // @ts-expect-error: testing runtime behavior when a request body is not an object
            strict.throws(() => expand(value, ['0']), TypeError);
          });
        }
      });
    }
  });

  await describe('end-to-end execution', async () => {
    const pool = createPool({ connectionLimit: 1 }).promise();

    await it('should select only the row a marked object matches in WHERE ?', async () => {
      await pool.query(
        'CREATE TEMPORARY TABLE accounts (id INT PRIMARY KEY, role VARCHAR(20))'
      );
      await pool.query(
        "INSERT INTO accounts (id, role) VALUES (1, 'admin'), (2, 'member')"
      );

      const [rows] = await pool.query<AccountRow[]>(
        'SELECT id FROM accounts WHERE ?',
        [mysql.expand({ role: 'admin' }, ['role'])]
      );

      strict.deepEqual(
        rows.map((row) => row.id),
        [1]
      );
    });

    await it('should match no row with the same object unmarked', async () => {
      const [rows] = await pool.query<AccountRow[]>(
        'SELECT id FROM accounts WHERE ?',
        [{ role: 'admin' }]
      );

      strict.equal(rows.length, 0);
    });

    await it('should reject a marked value in execute with a TypeError', async () => {
      await strict.rejects(
        pool.execute({
          sql: 'SELECT id FROM accounts WHERE id = ?',
          values: [mysql.expand({ id: 1 }, ['id'])],
        }),
        {
          name: 'TypeError',
          message:
            'Bind parameters must not contain expand() marks. Use query() instead',
        }
      );
    });

    await it('should keep the pooled session usable after the rejected execute', async () => {
      const [rows] = await pool.query<CountRow[]>(
        'SELECT COUNT(*) AS total FROM accounts'
      );

      strict.equal(rows[0].total, 2);
    });

    await pool.end();
  });

  await describe('pool-cluster namespaces', async () => {
    for (const reuseConnection of [false, true]) {
      await describe(
        reuseConnection ? 'with a reused connection' : 'with a new connection',
        async () => {
          const cluster = mysqlp.createPoolCluster();
          const namespace = cluster.of('primary');

          cluster.add('primary', { ...config, connectionLimit: 1 });

          if (reuseConnection) {
            const connection = await namespace.getConnection();
            connection.release();
          }

          await it('should reject a marked value with a TypeError', async () => {
            await strict.rejects(
              namespace.execute({
                sql: 'SELECT ? AS id',
                values: [mysql.expand({ id: 1 }, ['id'])],
              }),
              TypeError
            );
          });

          await it('should keep the namespace usable after the rejected execute', async () => {
            const [rows] = await namespace.execute('SELECT ? AS id', [123]);

            strict.deepEqual(rows, [{ id: 123 }]);
          });

          await cluster.end();
        }
      );
    }
  });

  await describe('explicitly prepared statements', async () => {
    const connection = createConnection().promise();
    const statement = await connection.prepare('SELECT ? AS id');
    const cases = [
      { name: 'CommonJS marks', values: [mysql.expand({ id: 1 }, ['id'])] },
      { name: 'ESM marks', values: [expandFromEsm({ id: 1 })] },
      {
        name: 'marks in an array-like parameter list',
        values: { 0: mysql.expand({ id: 1 }, ['id']), length: 1 },
      },
    ];

    for (const { name, values } of cases) {
      await it(`should reject ${name} in a prepared statement`, async () => {
        await strict.rejects(statement.execute(values), TypeError);
      });
    }

    await it('should keep the prepared statement usable after rejected executes', async () => {
      const [rows] = await statement.execute([123]);

      strict.deepEqual(rows, [{ id: 123 }]);
    });

    await statement.close();
    await connection.end();
  });

  await describe('callback prepared statements', async () => {
    const connection = createConnection();
    const statement = await new Promise<PrepareStatementInfo>(
      (resolve, reject) => {
        connection.prepare('SELECT ? AS id', (error, preparedStatement) => {
          if (error) return reject(error);
          resolve(preparedStatement);
        });
      }
    );

    it('should throw for a marked value before executing the statement', () => {
      strict.throws(
        () => statement.execute([mysql.expand({ id: 1 }, ['id'])]),
        TypeError
      );
    });

    statement.close();
    await connection.promise().end();
  });
});
