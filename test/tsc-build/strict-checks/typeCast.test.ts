import { QueryOptions } from '../../../index.js';
import { QueryOptions as QueryOptionsP } from '../../../promise.js';

const sql = 'SELECT 1';

// Callback: field.db and field.string(encoding) are not covered by .mts tests
{
  const options: QueryOptions = {
    sql,
    typeCast: (field, next) => {
      const db: string = field.db;
      const stringWithEncoding: string | null = field.string('utf-8');

      return next();
    },
  };
}

// Promise: field.db and field.string(encoding) are not covered by .mts tests
{
  const options: QueryOptionsP = {
    sql,
    typeCast: (field, next) => {
      const db: string = field.db;
      const stringWithEncoding: string | null = field.string('utf-8');

      return next();
    },
  };
}
