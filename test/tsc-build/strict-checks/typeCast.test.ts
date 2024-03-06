import { QueryOptions, ConnectionOptions } from '../../../index.js';
import {
  QueryOptions as QueryOptionsP,
  ConnectionOptions as ConnectionOptionsP,
} from '../../../promise.js';
import { access, sql } from '../promise/baseConnection.test.js';

// Callback: QueryOptions
{
  const options1: QueryOptions = {
    sql,
    typeCast: true,
  };

  const options2: QueryOptions = {
    sql,
    typeCast: false,
  };

  const options3: QueryOptions = {
    sql,
    typeCast: (field, next) => {
      const db: string = field.db;
      const length: number = field.length;
      const name: string = field.name;
      const table: string = field.table;
      const type: string = field.type;
      const buffer: Buffer | null = field.buffer();
      const string: string | null = field.string();
      const stringWithEncoding: string | null = field.string('utf-8');
      const geometry:
        | { x: number; y: number }
        | { x: number; y: number }[]
        | null = field.geometry();

      console.log(db, length, name, table, type);
      console.log(buffer, string, stringWithEncoding, geometry);

      return next();
    },
  };

  console.log(options1, options2, options3);
}

// Callback: ConnectionOptions
{
  const options1: ConnectionOptions = {
    ...access,
    typeCast: true,
  };

  const options2: ConnectionOptions = {
    ...access,
    typeCast: false,
  };

  const options3: ConnectionOptions = {
    ...access,
    typeCast: (field, next) => {
      const db: string = field.db;
      const length: number = field.length;
      const name: string = field.name;
      const table: string = field.table;
      const type: string = field.type;
      const buffer: Buffer | null = field.buffer();
      const string: string | null = field.string();
      const stringWithEncoding: string | null = field.string('utf-8');
      const geometry:
        | { x: number; y: number }
        | { x: number; y: number }[]
        | null = field.geometry();

      console.log(db, length, name, table, type);
      console.log(buffer, string, stringWithEncoding, geometry);

      return next();
    },
  };

  console.log(options1, options2, options3);
}

// Promise: QueryOptions
{
  const options1: QueryOptionsP = {
    sql,
    typeCast: true,
  };

  const options2: QueryOptionsP = {
    sql,
    typeCast: false,
  };

  const options3: QueryOptionsP = {
    sql,
    typeCast: (field, next) => {
      const db: string = field.db;
      const length: number = field.length;
      const name: string = field.name;
      const table: string = field.table;
      const type: string = field.type;
      const buffer: Buffer | null = field.buffer();
      const string: string | null = field.string();
      const stringWithEncoding: string | null = field.string('utf-8');
      const geometry:
        | { x: number; y: number }
        | { x: number; y: number }[]
        | null = field.geometry();

      console.log(db, length, name, table, type);
      console.log(buffer, string, stringWithEncoding, geometry);

      return next();
    },
  };

  console.log(options1, options2, options3);
}

// Promise: ConnectionOptions
{
  const options1: ConnectionOptionsP = {
    ...access,
    typeCast: true,
  };

  const options2: ConnectionOptionsP = {
    ...access,
    typeCast: false,
  };

  const options3: ConnectionOptionsP = {
    ...access,
    typeCast: (field, next) => {
      const db: string = field.db;
      const length: number = field.length;
      const name: string = field.name;
      const table: string = field.table;
      const type: string = field.type;
      const buffer: Buffer | null = field.buffer();
      const string: string | null = field.string();
      const stringWithEncoding: string | null = field.string('utf-8');
      const geometry:
        | { x: number; y: number }
        | { x: number; y: number }[]
        | null = field.geometry();

      console.log(db, length, name, table, type);
      console.log(buffer, string, stringWithEncoding, geometry);

      return next();
    },
  };

  console.log(options1, options2, options3);
}
