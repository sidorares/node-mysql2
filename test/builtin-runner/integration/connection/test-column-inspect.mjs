import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import util from 'node:util';
import common from '../../../common.js';

describe(
  'custom inspect for column definition',
  { timeout: 1000 },
  async () => {
    let connection;

    before(async () => {
      connection = await common.createConnection().promise();
      connection.query(`DROP TABLE IF EXISTS test_fields`);
    });

    after(async () => {
      await connection.end();
    });

    it('should map fields to a schema-like description when depth is > 1', async () => {
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
        `CREATE TEMPORARY TABLE test_fields (${schema} PRIMARY KEY (id))`
      );
      const [_, columns] = await connection.query('select * from test_fields');
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
        .map(line => line.split('PRIMARY KEY ').join(''));

      for (let l = 0; l < normalizedInspectResults.length; l++) {
        const inspectLine = normalizedInspectResults[l];
        const schemaLine = schemaArray[l];
        assert.equal(inspectLine, schemaLine);
      }
    });

    it.only('should show detailed description when depth is < 1', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_fields2 (
            id INT,
            decimal13_10 DECIMAL(13,10) UNSIGNED NOT NULL,
            PRIMARY KEY (id)
        )
      `);
      const [_, columns] = await connection.query('select * from test_fields2');
      const inspectResults = util.inspect(columns[1]);
      assert.deepEqual(inspectResults, util.inspect({
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
        flags: [ 'NOT NULL' ],
        decimals: 10,
        typeName: 'NEWDECIMAL'
      }));
    });
  }
);
