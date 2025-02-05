import { test, assert, describe } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const common = require('../../../common.test.cjs');

const sql = `SELECT TO_VECTOR("[1.05, -17.8, 32, 123.456]") as test`;
const expectedArray = [1.05, -17.8, 32, 123.456];
const epsilon = 1e-6;

const compareFloat = (a, b) => Math.abs((a - b) / a) < epsilon;
const compareFLoatsArray = (a, b) => a.every((v, i) => compareFloat(v, b[i]));

(async () => {
  const connection = common.createConnection().promise();

  const mySqlVersion = await common.getMysqlVersion(connection);

  if (mySqlVersion.major < 9) {
    console.log(
      `Skipping the test, required mysql version is 9 and above, actual version is ${mySqlVersion.major}`,
    );
    await connection.end();
    return;
  }

  await test(async () => {
    describe(
      'Execute PS with vector response is parsed correctly',
      common.describeOptions,
    );

    const [_rows] = await connection.execute(sql);
    assert.equal(
      compareFLoatsArray(_rows[0].test, expectedArray),
      true,
      `${_rows[0].test} should be equal to ${expectedArray}`,
    );
  });

  await test(async () => {
    describe(
      'Select returning vector is parsed correctly',
      common.describeOptions,
    );

    const [_rows] = await connection.query(sql);
    assert.equal(
      compareFLoatsArray(_rows[0].test, expectedArray),
      true,
      `${_rows[0].test}  should be equal to  ${expectedArray}`,
    );
  });

  await connection.end();
})();
