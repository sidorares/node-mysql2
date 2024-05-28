import { test, assert, describe, beforeEach } from 'poku';
import util from 'node:util';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const common = require('../../../common.test.cjs');

(async () => {
  const connection = common.createConnection().promise();

  describe('Custom inspect for column definition', common.describeOptions);

  beforeEach(
    async () => await connection.query(`DROP TABLE IF EXISTS test_fields`),
    { assert: false },
  );

  await test(async () => {
    const schema = `
        id INT NOT NULL AUTO_INCREMENT,
        weight INT(2) UNSIGNED ZEROFILL,
        usignedInt INT UNSIGNED NOT NULL,
        signedInt INT NOT NULL,
        unsignedShort SMALLINT UNSIGNED NOT NULL,
        signedShort SMALLINT NOT NULL,
        tinyIntUnsigned TINYINT UNSIGNED NOT NULL,
        tinyIntSigned TINYINT NOT NULL,
        mediumIntUnsigned MEDIUMINT UNSIGNED NOT NULL,
        mediumIntSigned MEDIUMINT NOT NULL,
        bigIntSigned BIGINT NOT NULL,
        bigIntUnsigned BIGINT UNSIGNED NOT NULL,
        longText_ LONGTEXT NOT NULL,
        mediumText_ MEDIUMTEXT NOT NULL,
        text_ TEXT NOT NULL,
        tinyText_ TINYTEXT NOT NULL,
        varString_1000 VARCHAR(1000) NOT NULL,
        decimalDefault DECIMAL,
        decimal13_10 DECIMAL(13,10),
        floatDefault FLOAT,
        float11_7 FLOAT(11,7),
        dummyLastFieldToAllowForTrailingComma INT,
      `;

    await connection.query(
      `CREATE TEMPORARY TABLE test_fields (${schema} PRIMARY KEY (id))`,
    );

    const [, columns] = await connection.query('select * from test_fields');
    const inspectResults = util.inspect(columns);
    const schemaArray = schema
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const words = line.split(' ');
        const name = `\`${words[0]}\``;
        return [name, ...words.slice(1)].join(' ');
      });

    const normalizedInspectResults = inspectResults
      .split('\n')
      .slice(1, -2) // remove "[" and "]" lines and also last dummy field
      .map((line) => line.trim())
      // remove primary key - it's not in the schema explicitly but worth having in inspect
      .map((line) => line.split('PRIMARY KEY ').join(''));

    for (let l = 0; l < normalizedInspectResults.length; l++) {
      const inspectLine = normalizedInspectResults[l];
      const schemaLine = schemaArray[l];

      assert.equal(
        inspectLine,
        schemaLine,
        'Loop: Should map fields to a schema-like description when depth is > 1',
      );
    }
  });

  common.version >= 16 &&
    (await test(async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_fields2 (
            id INT,
            decimal13_10 DECIMAL(13,10) UNSIGNED NOT NULL,
            PRIMARY KEY (id)
        )
      `);

      const [, columns] = await connection.query('select * from test_fields2');
      const inspectResults = util.inspect(columns[1]);

      assert.deepEqual(
        inspectResults,
        util.inspect({
          catalog: 'def',
          schema: 'test',
          name: 'decimal13_10',
          orgName: 'decimal13_10',
          table: 'test_fields2',
          orgTable: 'test_fields2',
          characterSet: 63,
          encoding: 'binary',
          columnLength: 14,
          type: 246,
          flags: ['NOT NULL'],
          decimals: 10,
          typeName: 'NEWDECIMAL',
        }),
        'should show detailed description when depth is < 1',
      );
    }));

  await connection.end();
})();
