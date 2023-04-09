"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// get the client
// @ts-ignore
const mysql = require("mysql2");
const chai_1 = require("chai");
// create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'test'
});
describe('Connection', () => {
    it('execute', (done) => {
        connection.execute('select ?+1 as qqq, ? as rrr, ? as yyy', [1, null, 3], (err, rows, fields) => {
            (0, chai_1.expect)(rows[0].qqq).to.equal(2);
            (0, chai_1.expect)(err).to.be.null;
            connection.execute('select ?+1 as qqq, ? as rrr, ? as yyy', [3, null, 3], (err, rows, fields) => {
                (0, chai_1.expect)(rows[0].qqq).to.equal(4);
                (0, chai_1.expect)(err).to.be.null;
                connection.unprepare('select ?+1 as qqq, ? as rrr, ? as yyy');
                connection.execute('select ?+1 as qqq, ? as rrr, ? as yyy', [3, null, 3], (err, rows, fields) => {
                    (0, chai_1.expect)(rows[0].qqq).to.equal(4);
                    (0, chai_1.expect)(err).to.be.null;
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=connection.js.map