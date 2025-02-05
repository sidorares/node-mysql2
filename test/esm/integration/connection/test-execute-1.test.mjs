import { test, assert, describe } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const common = require('../../../common.test.cjs');

(async () => {
  const connection = common.createConnection().promise();

  await test(async () => {
    describe(
      'Simple execute should return expected values',
      common.describeOptions,
    );

    const [_rows, _fields] = await connection.execute('SELECT 1 as test');

    assert.deepEqual(
      _rows,
      [{ test: 1 }],
      'should execute simple SELECT 1 statement',
    );
    assert.equal(_fields[0].name, 'test', 'should field name test');
  });

  await test(async () => {
    describe(
      'Simple execute with parameters should return expected values',
      common.describeOptions,
    );

    const [_rows, _fields] = await connection.execute('SELECT 1+? as test', [
      123,
    ]);

    assert.deepEqual(
      _rows,
      [{ test: 124 }],
      'should execute simple SELECT 1+? statement',
    );
    assert.equal(_fields[0].name, 'test', 'should field name test');
  });

  await test(async () => {
    describe(
      'should execute simple INSERT + SELECT statements',
      common.describeOptions,
    );

    await connection.query(
      [
        'CREATE TEMPORARY TABLE `announcements` (',
        '`id` int(11) NOT NULL AUTO_INCREMENT,',
        '`title` varchar(255) DEFAULT NULL,',
        '`text` varchar(255) DEFAULT NULL,',
        'PRIMARY KEY (`id`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
      ].join('\n'),
    );

    await connection.execute(
      'INSERT INTO announcements(title, text) VALUES(?, ?)',
      ['Есть место, где заканчивается тротуар', 'Расти борода, расти'],
    );
    connection.execute('INSERT INTO announcements(title, text) VALUES(?, ?)', [
      'Граждане Российской Федерации имеют право собираться мирно без оружия',
      'проводить собрания, митинги и демонстрации, шествия и пикетирование',
    ]);

    const [_rows] = await connection.execute('SELECT * FROM announcements');

    assert.equal(_rows.length, 2, 'rows length needs to be 2');
    assert.equal(
      _rows[0].title,
      'Есть место, где заканчивается тротуар',
      'first row title',
    );
    assert.equal(_rows[0].text, 'Расти борода, расти', 'first row text');
    assert.equal(
      _rows[1].title,
      'Граждане Российской Федерации имеют право собираться мирно без оружия',
      'second row title',
    );
    assert.equal(
      _rows[1].text,
      'проводить собрания, митинги и демонстрации, шествия и пикетирование',
      'second row text',
    );
  });

  await connection.end();
})();
