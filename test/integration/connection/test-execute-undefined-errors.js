'use strict';

const createConnection = require('../../common.js').createConnection;
const test = require('utest');
const assert = require('assert');

test('Test error messages for undefined parameters are correctly reported ', {
  'Error message lists named parameter that was undefined': () => {
    const conn = createConnection({namedPlaceholders: true});
    try {
      conn.execute({sql: 'select id, email from test_table where id = :id and email = :email and name = :name'}, {email: 'test@email.com'}, err => {
        assert.fail(`Expected error to be thrown, but got ${err}`);
      });
    } catch (err) {
      if (err.message.indexOf("(parameters :id, :name)") === -1) {
        assert.fail(
          `Expected error message to list undefined named parameter (:id):\n ${err}`
        );
      } 
    } finally {
      conn.end();
    }
  },
  'Error message lists undefined named parameter once if it appears multiple times in the query': () => {
    const conn = createConnection({namedPlaceholders: true});
    try {
      conn.execute({sql: 'select id, email from test_table where id = :id and created < :day and created >  :day - interval 7 day'}, {}, err => {
        assert.fail(`Expected error to be thrown, but got ${err}`);
      });
    } catch (err) {
      if (err.message.indexOf("(parameters :id, :day)") === -1) {
        assert.fail(
          `Expected error message to list undefined named parameter (:id):\n ${err}`
        );
      } 
    } finally {
      conn.end();
    }
  },
  'Error message lists parameter indexes that were undefined': () => {
    const conn = createConnection({namedPlaceholders: true});
    try {
      conn.execute({sql: 'select id, email from test_table where id = ?, email = ?, name = ?'}, [undefined, 'test@test.com', undefined], err => {
        assert.fail(`Expected error to be thrown, but got ${err}`);
      });
    } catch (err) {
      if (err.message.indexOf("(indexes 0, 2)") === -1) {
        assert.fail(
          `Expected error message to list undefined parameter indexes (0,2):\n ${err}`
        );
      } 
    } finally {
      conn.end();
    }
  }
});