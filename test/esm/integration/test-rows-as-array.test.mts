import type { QueryError, RowDataPacket } from '../../../index.js';
import { assert } from 'poku';
import { createConnection } from '../common.test.mjs';

// enabled in initial config, disable in some tets
const c = createConnection({ rowsAsArray: true });
c.query('select 1+1 as a', (err: QueryError | null, rows: RowDataPacket[]) => {
  assert.ifError(err);
  assert.equal(rows[0][0], 2);
});

c.query(
  { sql: 'select 1+2 as a', rowsAsArray: false },
  (err: QueryError | null, rows: RowDataPacket[]) => {
    assert.ifError(err);
    assert.equal(rows[0].a, 3);
  }
);

c.execute(
  'select 1+1 as a',
  (err: QueryError | null, rows: RowDataPacket[]) => {
    assert.ifError(err);
    assert.equal(rows[0][0], 2);
  }
);

c.execute(
  { sql: 'select 1+2 as a', rowsAsArray: false },
  (err: QueryError | null, rows: RowDataPacket[]) => {
    assert.ifError(err);
    assert.equal(rows[0].a, 3);
    c.end();
  }
);

// disabled in initial config, enable in some tets
const c1 = createConnection({ rowsAsArray: false });
c1.query('select 1+1 as a', (err: QueryError | null, rows: RowDataPacket[]) => {
  assert.ifError(err);
  assert.equal(rows[0].a, 2);
});

c1.query(
  { sql: 'select 1+2 as a', rowsAsArray: true },
  (err: QueryError | null, rows: RowDataPacket[]) => {
    assert.ifError(err);
    assert.equal(rows[0][0], 3);
  }
);

c1.execute(
  'select 1+1 as a',
  (err: QueryError | null, rows: RowDataPacket[]) => {
    assert.ifError(err);
    assert.equal(rows[0].a, 2);
  }
);

c1.execute(
  { sql: 'select 1+2 as a', rowsAsArray: true },
  (err: QueryError | null, rows: RowDataPacket[]) => {
    assert.ifError(err);
    assert.equal(rows[0][0], 3);
    c1.end();
  }
);
