import { describe, it, strict } from 'poku';
import ServerStatus from '../../../lib/constants/server_status.js';
import Pipelining from '../../../lib/pipelining.js';

describe('pipelining policy: session-neutral statements', () => {
  for (const sql of [
    'SELECT 1',
    '  select * from t',
    'INSERT INTO t VALUES (1)',
    'UPDATE t SET a = 1',
    'DELETE FROM t',
    'REPLACE INTO t VALUES (1)',
    'WITH x AS (SELECT 1) SELECT * FROM x',
    'VALUES ROW(1)',
    'TABLE t',
    'SHOW TABLES',
    'DESCRIBE t',
    'EXPLAIN SELECT 1',
  ]) {
    it(`pipelines ${JSON.stringify(sql)}`, () => {
      strict.equal(Pipelining.isSessionNeutral(sql, false), true);
    });
  }

  for (const sql of [
    'SET NAMES latin1',
    "SET sql_mode = 'NO_BACKSLASH_ESCAPES'",
    'SET autocommit = 0',
    'BEGIN',
    'START TRANSACTION',
    'COMMIT',
    'CALL proc()',
    'USE other_db',
    'LOCK TABLES t WRITE',
    '/*!40101 SET NAMES utf8 */',
    '(SELECT 1) UNION (SELECT 2)',
    'SELECTED',
  ]) {
    it(`holds ${JSON.stringify(sql)} as a barrier`, () => {
      strict.equal(Pipelining.isSessionNeutral(sql, false), false);
    });
  }

  it('holds any statement with a semicolon when multipleStatements is on', () => {
    strict.equal(
      Pipelining.isSessionNeutral('SELECT 1; SET NAMES latin1', true),
      false
    );
    strict.equal(
      Pipelining.isSessionNeutral('SELECT 1; SET NAMES latin1', false),
      true
    );
  });

  it('rejects anything that is not SQL text', () => {
    strict.equal(Pipelining.isSessionNeutral(undefined, false), false);
  });
});

describe('pipelining policy: charset-independent text', () => {
  it('accepts ASCII, including control characters', () => {
    strict.equal(
      Pipelining.isCharsetIndependent("SELECT 'a\\n\x00\x7f'"),
      true
    );
  });

  it('rejects any character outside ASCII', () => {
    strict.equal(Pipelining.isCharsetIndependent("SELECT 'é'"), false);
    strict.equal(Pipelining.isCharsetIndependent("SELECT '中'"), false);
    strict.equal(Pipelining.isCharsetIndependent('SELECT \ud83d'), false);
  });
});

describe('pipelining policy: transactions', () => {
  const { SERVER_STATUS_AUTOCOMMIT, SERVER_STATUS_IN_TRANS } = ServerStatus;

  it('pipelines only in autocommit mode outside a transaction', () => {
    strict.equal(Pipelining.isTransactionOpen(SERVER_STATUS_AUTOCOMMIT), false);
    strict.equal(
      Pipelining.isTransactionOpen(
        SERVER_STATUS_AUTOCOMMIT | SERVER_STATUS_IN_TRANS
      ),
      true
    );
    strict.equal(Pipelining.isTransactionOpen(0), true);
  });
});
