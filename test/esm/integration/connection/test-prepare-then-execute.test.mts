import type {
  FieldPacket,
  PrepareStatementInfo,
  RowDataPacket,
} from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let _stmt: PrepareStatementInfo | null = null;
let _columns: FieldPacket[] | null = null;
let _rows: RowDataPacket[] | null = null;

connection.prepare('select 1 + ? + ? as test', (err, stmt) => {
  if (err) {
    throw err;
  }
  _stmt = stmt;
  stmt.execute<RowDataPacket[]>([111, 123], (err, rows, columns) => {
    if (err) {
      throw err;
    }
    _columns = columns;
    _rows = rows;
    connection.end();
  });
});

process.on('exit', () => {
  assert(_stmt, 'Expected prepared statement');
  assert(_columns, 'Expected statement metadata');
  if (!_stmt || !_columns) {
    return;
  }
  // @ts-expect-error: TODO: implement typings
  assert.equal(_stmt.columns.length, 1);
  // @ts-expect-error: TODO: implement typings
  assert.equal(_stmt.parameters.length, 2);
  assert.deepEqual(_rows, [{ test: 235 }]);
  assert.equal(_columns[0].name, 'test');
});
