import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import common from '../../../common.js';

describe('Simple execute with parameters should return expected values', { timeout: 1000 }, () => {
  let connection;

  before((t, done) => {
    connection = common.createConnection();
    connection.on('error', (err) => {
      done(err);
    });
    connection.on('connect', () => {
      done(null);
    });
  });

  after((t, done) => {
    connection.end(done);
  });

  it('should execute simple SELECT 1 statement', (t, done) => {
    connection.execute('SELECT 1 as test', [], (err, _rows, _fields) => {
      if (err) {
        return done(err);
      }
      assert.deepEqual(_rows, [{ test: 1 }]);
      assert.equal(_fields[0].name, 'test');
      done(null);
    });
  });

  it('should execute simple SELECT 1+? statement', (t, done) => {
    connection.execute('SELECT 1+? as test', [123], (err, _rows, _fields) => {
      if (err) {
        return done(err);
      }
      assert.deepEqual(_rows, [{ test: 124 }]);
      assert.equal(_fields[0].name, 'test');
      done(null);
    });
  });

  it('should execute simple INSERT + SELECT statements', (t, done) => {
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
          done(err);
        }
      }
    );

    connection.execute(
      'INSERT INTO announcements(title, text) VALUES(?, ?)',
      ['Есть место, где заканчивается тротуар', 'Расти борода, расти'],
      (err) => {
        if (err) {
          done(err);
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
          done(err);
        }
      }
    );

    connection.execute('SELECT * FROM announcements', (err, _rows) => {
      if (err) {
        done(err);
      }
      assert.equal(_rows.length, 2);
      assert.equal(_rows[0].title, 'Есть место, где заканчивается тротуар');
      assert.equal(_rows[0].text, 'Расти борода, расти');
      assert.equal(
        _rows[1].title,
        'Граждане Российской Федерации имеют право собираться мирно без оружия'
      );
      assert.equal(
        _rows[1].text,
        'проводить собрания, митинги и демонстрации, шествия и пикетирование'
      );
      
      done(null);
    });
  });
});
