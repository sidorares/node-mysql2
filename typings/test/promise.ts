import type { Connection } from '../../promise'
import * as mysql from '../../promise'
import { expect } from 'chai'

describe('promise Connection', () => {
  it('execute', async(done) => {
    // create the connection to database
    const connection: Connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'test'
    });

    const [ rows ] = await connection.execute('select 1 as qqq');

    expect(
      0 in rows
      && 'qqq' in rows[0]
      && rows[0].qqq
    ).to.equal(1);


    // Regression test for #1329
    const myCustomExecute = (
      ...args: Parameters<Connection['execute']>
    ) => connection.execute(...args);

    const [ rows2 ] = await myCustomExecute('select 1 as qqq');

    expect(
      0 in rows2
      && 'qqq' in rows2[0]
      && rows2[0].qqq
    ).to.equal(1);

    done();
  })
})
