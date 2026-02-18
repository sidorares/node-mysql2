// import type { RowDataPacket } from '../../../../index.js';
// import { assert, describe, it } from 'poku';
// import { createConnection } from '../../common.test.mjs';

// await describe('Select Negative', async () => {
//   await it('should select negative values via execute and query', async () => {
//     const connection = createConnection();

//     let rows: RowDataPacket[];
//     let rows1: RowDataPacket[];

//     await new Promise<void>((resolve, reject) => {
//       connection.execute<RowDataPacket[]>('SELECT -1 v', [], (err, _rows) => {
//         if (err) return reject(err);
//         rows = _rows;
//       });

//       connection.query<RowDataPacket[]>('SELECT -1 v', (err, _rows) => {
//         if (err) return reject(err);
//         rows1 = _rows;
//         connection.end();
//         resolve();
//       });
//     });

//     assert.deepEqual(rows!, [{ v: -1 }]);
//     assert.deepEqual(rows1!, [{ v: -1 }]);
//   });
// });
