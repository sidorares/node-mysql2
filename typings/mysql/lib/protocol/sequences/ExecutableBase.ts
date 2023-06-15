import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
} from '../packets/index.js';
import {
  Query,
  QueryError,
  QueryOptions,
  QueryableConstructor,
} from './Query.js';

export function ExecutableBase<T extends QueryableConstructor>(
  Base: T = {} as T
) {
  return class extends Base {
    execute<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      sql: string,
      callback?: (
        err: QueryError | null,
        result: T,
        fields: FieldPacket[]
      ) => any
    ): Query;
    execute<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      sql: string,
      values: any | any[] | { [param: string]: any },
      callback?: (
        err: QueryError | null,
        result: T,
        fields: FieldPacket[]
      ) => any
    ): Query;
    execute<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      options: QueryOptions,
      callback?: (
        err: QueryError | null,
        result: T,
        fields?: FieldPacket[]
      ) => any
    ): Query;
    execute<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      options: QueryOptions,
      values: any | any[] | { [param: string]: any },
      callback?: (
        err: QueryError | null,
        result: T,
        fields: FieldPacket[]
      ) => any
    ): Query;

    // Implementing all overload variations
    /* eslint-disable @typescript-eslint/no-unused-vars */
    execute(
      options: QueryOptions | string,
      values?:
        | any
        | any[]
        | { [param: string]: any }
        | ((
            err: QueryError | null,
            result: any,
            fields?: FieldPacket[]
          ) => any),
      callback?: (
        err: QueryError | null,
        result: any,
        fields: FieldPacket[]
      ) => any
    ): Query {
      return new Query();
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
  };
}
