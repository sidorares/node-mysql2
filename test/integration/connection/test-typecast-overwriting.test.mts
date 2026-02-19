import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TypecastRow = RowDataPacket & { foo: string };

await describe('Typecast Overwriting', async () => {
  const connection = createConnection({
    typeCast: function (field, next) {
      assert.equal('number', typeof field.length);
      if (field.type === 'VAR_STRING') {
        const value = field.string();
        if (value === null) {
          return value;
        }
        return value.toUpperCase();
      }
      return next();
    },
  });

  await it('should use connection-level typeCast', async () => {
    const res = await new Promise<TypecastRow[]>((resolve, reject) => {
      connection.query<TypecastRow[]>(
        {
          sql: 'select "foo uppercase" as foo',
        },
        (err, _res) => (err ? reject(err) : resolve(_res))
      );
    });

    assert.equal(res[0].foo, 'FOO UPPERCASE');
  });

  await it('should override with query-level typeCast', async () => {
    const res = await new Promise<TypecastRow[]>((resolve, reject) => {
      connection.query<TypecastRow[]>(
        {
          sql: 'select "foo lowercase" as foo',
          typeCast: function (field, next) {
            assert.equal('number', typeof field.length);
            if (field.type === 'VAR_STRING') {
              const value = field.string();
              if (value === null) {
                return value;
              }
              return value.toLowerCase();
            }
            return next();
          },
        },
        (err, _res) => (err ? reject(err) : resolve(_res))
      );
    });

    assert.equal(res[0].foo, 'foo lowercase');
  });

  connection.end();
});
