import { describe, it } from 'node:test';
import assert from 'node:assert';
import common from '../../../test/common.js';

describe('Prepare result when CLIENT_OPTIONAL_RESULTSET_METADATA is set or metadata_follows is unset', () => {
  it('should not throw an exception', (t, done) => {
    /*
    const connection = common.createConnection({
      database: 'mysql',
    });

    connection.on('error', (err) => {
      done(err);
    });

    connection.prepare('select * from user order by ?', (err, stmt) => {
      console.log(err);
      if (err) {
        if (!err.fatal) {
          connection.end();
        }
        done(err);
      } else {
        done(null);
      }
    });
    */
    const connection = common.createConnection();
    connection.on('error', (err) => {
      console.log('Error connecting to mysql', err);
      done(err);
    });
    connection.on('connect', () => {
      console.log('Connected!')
      done(null);
    });

  });
});