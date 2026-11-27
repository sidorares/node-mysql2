import { EventEmitter } from 'node:events';
import { describe, it, strict } from 'poku';
import { createConnection, createPool } from '../../../index.js';

const value = "it's C:\\";
const escapedForBothModes = "REPLACE('it''s C:\\%', '\\%', LEFT('\\%', 1))";

await describe('the noBackslashEscapes option', async () => {
  const connection = createConnection({
    stream: new EventEmitter(),
    isServer: true,
    connectTimeout: 0,
    noBackslashEscapes: true,
  });
  const pool = createPool({ noBackslashEscapes: true });
  const writers = [
    { name: 'connection.escape()', write: () => connection.escape(value) },
    {
      name: 'connection.format()',
      write: () => connection.format('?', [value]),
    },
    { name: 'pool.escape()', write: () => pool.escape(value) },
    { name: 'pool.format()', write: () => pool.format('?', [value]) },
  ];

  for (const { name, write } of writers) {
    it(`should escape for both SQL modes through ${name}`, () => {
      strict.equal(write(), escapedForBothModes);
    });
  }

  await pool.promise().end();
});
