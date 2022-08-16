'use strict';

// get the client
import * as mysql from 'mysql2';
import ConnectionType = require('../mysql/lib/Connection');
import { expect } from 'chai'

// create the connection to database
const connection: ConnectionType = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

describe('Connection', () => {
    it('execute', (done) => {
        connection.execute(
        'select ?+1 as qqq, ? as rrr, ? as yyy',
        [1, null, 3],
        (err, rows, fields) => {
            expect(rows[0].qqq).to.equal(2);
            expect(err).to.be.null;

            connection.execute(
            'select ?+1 as qqq, ? as rrr, ? as yyy',
            [3, null, 3],
            (err, rows, fields) => {
                expect(rows[0].qqq).to.equal(4);
                expect(err).to.be.null;
                connection.unprepare('select ?+1 as qqq, ? as rrr, ? as yyy');
                connection.execute(
                'select ?+1 as qqq, ? as rrr, ? as yyy',
                [3, null, 3],
                (err, rows, fields) => {
                    expect(rows[0].qqq).to.equal(4);
                    expect(err).to.be.null;
                    done();
                }
                );
            }
            );
        }
        );
    })
})