import type { RowDataPacket } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe(async () => {
  const connection = createConnection().promise();

  await it('Simple execute should return expected values', async () => {
    const [_rows, _fields] = await connection.execute('SELECT 1 as test');

    strict.deepEqual(
      _rows,
      [{ test: 1 }],
      'should execute simple SELECT 1 statement'
    );
    strict.equal(_fields[0].name, 'test', 'should field name test');
  });

  await it('Simple execute with parameters should return expected values', async () => {
    const [_rows, _fields] = await connection.execute(
      'SELECT 1+? as test',
      [123]
    );

    strict.deepEqual(
      _rows,
      [{ test: 124 }],
      'should execute simple SELECT 1+? statement'
    );
    strict.equal(_fields[0].name, 'test', 'should field name test');
  });

  await it('should execute simple INSERT + SELECT statements', async () => {
    await connection.query(
      [
        'CREATE TEMPORARY TABLE `announcements` (',
        '`id` int(11) NOT NULL AUTO_INCREMENT,',
        '`title` varchar(255) DEFAULT NULL,',
        '`text` varchar(255) DEFAULT NULL,',
        'PRIMARY KEY (`id`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
      ].join('\n')
    );

    await connection.execute(
      'INSERT INTO announcements(title, text) VALUES(?, ?)',
      ['Есть место, где заканчивается тротуар', 'Расти борода, расти']
    );
    connection.execute('INSERT INTO announcements(title, text) VALUES(?, ?)', [
      'Граждане Российской Федерации имеют право собираться мирно без оружия',
      'проводить собрания, митинги и демонстрации, шествия и пикетирование',
    ]);

    const [_rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM announcements'
    );

    strict.equal(_rows.length, 2, 'rows length needs to be 2');
    strict.equal(
      _rows[0].title,
      'Есть место, где заканчивается тротуар',
      'first row title'
    );
    strict.equal(_rows[0].text, 'Расти борода, расти', 'first row text');
    strict.equal(
      _rows[1].title,
      'Граждане Российской Федерации имеют право собираться мирно без оружия',
      'second row title'
    );
    strict.equal(
      _rows[1].text,
      'проводить собрания, митинги и демонстрации, шествия и пикетирование',
      'second row text'
    );
  });

  await connection.end();
});
