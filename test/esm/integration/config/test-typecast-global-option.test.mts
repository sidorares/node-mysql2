import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Typecast Global Option', async () => {
  type StringMethod = 'toUpperCase' | 'toLowerCase';

  const typeCastWrapper = function (stringMethod: StringMethod) {
    return function (field: TypeCastField, next: TypeCastNext) {
      if (field.type === 'VAR_STRING') {
        const value = field.string();
        return value?.[stringMethod]();
      }
      return next();
    };
  };

  const connection = createConnection({
    typeCast: typeCastWrapper('toUpperCase'),
  });

  // query option override global typeCast
  await it('should override global typeCast with query option', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'select "FOOBAR" as foo',
          typeCast: typeCastWrapper('toLowerCase'),
        },
        (err, res) => {
          if (err) return reject(err);
          assert.equal(res[0].foo, 'foobar');
          resolve();
        }
      );
    });
  });

  // global typecast works
  await it('should apply global typeCast', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'select "foobar" as foo',
        },
        (err, res) => {
          if (err) return reject(err);
          assert.equal(res[0].foo, 'FOOBAR');
          resolve();
        }
      );
    });
  });

  connection.end();
});
