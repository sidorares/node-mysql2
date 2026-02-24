import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Stream', async () => {
  await it('should stream query and execute results correctly', async () => {
    const connection = createConnection();

    let rows: RowDataPacket[];
    const rows1: RowDataPacket[] = [];
    const rows2: RowDataPacket[] = [];
    const rows3: RowDataPacket[] = [];
    const rows4: RowDataPacket[] = [];

    connection.query(
      [
        'CREATE TEMPORARY TABLE `announcements` (',
        '`id` int(11) NOT NULL AUTO_INCREMENT,',
        '`title` varchar(255) DEFAULT NULL,',
        '`text` varchar(255) DEFAULT NULL,',
        'PRIMARY KEY (`id`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
      ].join('\n'),
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    connection.execute(
      'INSERT INTO announcements(title, text) VALUES(?, ?)',
      ['Есть место, где заканчивается тротуар', 'Расти борода, расти'],
      (err) => {
        if (err) {
          throw err;
        }
      }
    );
    connection.execute(
      'INSERT INTO announcements(title, text) VALUES(?, ?)',
      [
        'Граждане Российской Федерации имеют право собираться мирно без оружия',
        'проводить собрания, митинги и демонстрации, шествия и пикетирование',
      ],
      (err) => {
        if (err) {
          throw err;
        }
      }
    );

    await new Promise<void>((resolve, reject) => {
      connection.execute('SELECT * FROM announcements', async (_err, _rows) => {
        try {
          if (_err) return reject(_err);
          rows = _rows as RowDataPacket[];
          const s1 = connection.query('SELECT * FROM announcements').stream();
          s1.on('data', (row: RowDataPacket) => {
            rows1.push(row);
          });
          s1.on('end', () => {
            const s2 = connection
              .execute('SELECT * FROM announcements')
              .stream();
            s2.on('data', (row: RowDataPacket) => {
              rows2.push(row);
            });
            s2.on('end', () => {
              connection.end();
            });
          });
          const s3 = connection.query('SELECT * FROM announcements').stream();
          for await (const row of s3) {
            rows3.push(row as RowDataPacket);
          }
          const s4 = connection.query('SELECT * FROM announcements').stream();
          for await (const row of s4) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            rows4.push(row as RowDataPacket);
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    strict.deepEqual(rows!.length, 2);
    strict.deepEqual(rows!, rows1);
    strict.deepEqual(rows!, rows2);
    strict.deepEqual(rows!, rows3);
    strict.deepEqual(rows!, rows4);
  });
});
