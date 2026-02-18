// import { assert, describe, it } from 'poku';
// import { createConnection } from '../../common.test.mjs';

// await describe('Then on Query', async () => {
//   await it('should not have .then on query object', async () => {
//     const connection = createConnection();

//     let error = true;

//     const q = connection.query('SELECT 1');
//     try {
//       // @ts-expect-error: testing that .then does not exist on Query
//       if (q.then) q.then();
//     } catch {
//       error = false;
//     }

//     await new Promise<void>((resolve) => {
//       q.on('end', () => {
//         connection.end();
//         resolve();
//       });
//     });

//     assert.equal(error, false);
//   });
// });
