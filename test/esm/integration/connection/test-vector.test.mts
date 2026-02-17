import { it, assert, describe } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

const sql = `SELECT TO_VECTOR("[1.05, -17.8, 32, 123.456]") as test`;
const expectedArray: number[] = [1.05, -17.8, 32, 123.456];
const epsilon: number = 1e-6;

const compareFloat = (a: number, b: number): boolean =>
  Math.abs((a - b) / a) < epsilon;
const compareFLoatsArray = (a: number[], b: number[]): boolean =>
  a.every((v, i) => compareFloat(v, b[i]));

await describe(async () => {
  const connection = createConnection().promise();
  const mySqlVersion = await getMysqlVersion(connection);

  if (mySqlVersion.major < 9) {
    console.log(
      `Skipping the test, required mysql version is 9 and above, actual version is ${mySqlVersion.major}`
    );
    await connection.end();
    return;
  }

  await it('Execute PS with vector response is parsed correctly', async () => {
    const [_rows] = await connection.execute(sql);
    assert.equal(
      compareFLoatsArray(_rows[0].test, expectedArray),
      true,
      `${_rows[0].test} should be equal to ${expectedArray}`
    );
  });

  await it('Select returning vector is parsed correctly', async () => {
    const [_rows] = await connection.query(sql);
    assert.equal(
      compareFLoatsArray(_rows[0].test, expectedArray),
      true,
      `${_rows[0].test}  should be equal to  ${expectedArray}`
    );
  });

  await connection.end();
});
