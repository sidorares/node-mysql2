import type { QueryOptions } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type Variant = Omit<QueryOptions, 'sql'>;

const queryBoth = async (
  connection: ReturnType<ReturnType<typeof createConnection>['promise']>,
  sql: string,
  options: Variant = {}
) => {
  const [compiled] = await connection.query({
    sql,
    ...options,
    // @ts-expect-error: TODO: implement typings
    disableEval: false,
  });
  const [interpreted] = await connection.query({
    sql,
    ...options,
    // @ts-expect-error: TODO: implement typings
    disableEval: true,
  });
  return { compiled, interpreted };
};

await describe('Static text parser parity', async () => {
  const connection = createConnection().promise();

  await connection.query(`
    CREATE TEMPORARY TABLE static_parity (
      id INT PRIMARY KEY,
      tiny TINYINT(1),
      small SMALLINT,
      big BIGINT,
      ubig BIGINT UNSIGNED,
      dec_v DECIMAL(23,4),
      flt FLOAT,
      dbl DOUBLE,
      d DATE,
      dt DATETIME(3),
      ts TIMESTAMP NULL,
      tm TIME,
      yr YEAR,
      vc VARCHAR(64),
      txt TEXT,
      bin VARBINARY(8),
      blb BLOB,
      js JSON,
      en ENUM('a', 'b'),
      nul VARCHAR(8)
    ) CHARACTER SET utf8mb4
  `);
  await connection.query(`
    INSERT INTO static_parity VALUES
      (1, 1, -32768, 9007199254740993, 18446744073709551615, 1234567890123456789.1234, 1.5, 0.1,
       '2026-10-24', '2026-10-24 06:30:00.123', '2026-10-24 06:30:00', '-838:59:59', 2026,
       'Ōtautahi 🏕️', 'long text', x'00ff', x'deadbeef', '{"a": [1, "x"], "n": 9007199254740993}', 'b', NULL),
      (2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
  `);

  const sql =
    'SELECT p.*, NULL AS null_literal, 1 + 1 AS two FROM static_parity p ORDER BY id';

  const variants: Record<string, Variant> = {
    default: {},
    rowsAsArray: { rowsAsArray: true },
    nestTablesTrue: { nestTables: true },
    nestTablesString: { nestTables: '_' },
    typeCastFalse: { typeCast: false },
    typeCastFunction: {
      typeCast: (field, next) =>
        field.type === 'TINY' && field.length === 1
          ? field.string() === '1'
          : next(),
    },
    bigNumbers: { supportBigNumbers: true },
    bigNumberStrings: { supportBigNumbers: true, bigNumberStrings: true },
    dateStringsTrue: { dateStrings: true },
    dateStringsDate: { dateStrings: ['DATE'] },
    timezoneUtc: { timezone: 'Z' },
    timezoneOffset: { timezone: '+05:30' },
    combined: {
      timezone: 'Z',
      dateStrings: ['DATE'],
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
  };

  for (const [name, options] of Object.entries(variants)) {
    await it(`matches the compiled parser: ${name}`, async () => {
      const { compiled, interpreted } = await queryBoth(
        connection,
        sql,
        options
      );
      strict.deepStrictEqual(interpreted, compiled);
    });
  }

  await connection.end();
});

await describe('Static text parser parity: decimalNumbers and jsonStrings', async () => {
  const connection = createConnection({
    decimalNumbers: true,
    jsonStrings: true,
  }).promise();

  await connection.query(
    'CREATE TEMPORARY TABLE static_parity_config (dec_v DECIMAL(10,2), js JSON)'
  );
  await connection.query(
    `INSERT INTO static_parity_config VALUES (12.34, '{"a": 1}'), (NULL, NULL)`
  );

  await it('matches the compiled parser', async () => {
    const { compiled, interpreted } = await queryBoth(
      connection,
      'SELECT * FROM static_parity_config'
    );
    strict.deepStrictEqual(interpreted, compiled);
  });

  await connection.end();
});
