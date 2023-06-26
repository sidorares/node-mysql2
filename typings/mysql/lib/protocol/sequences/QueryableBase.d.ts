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
export declare function QueryableBase<T extends QueryableConstructor>(
  Base?: T
): {
  new (...args: any[]): {
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      sql: string,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
    query<
      T_1 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      sql: string,
      values: any,
      callback?:
        | ((err: QueryError | null, result: T_1, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
    query<
      T_2 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      options: QueryOptions,
      callback?:
        | ((err: QueryError | null, result: T_2, fields?: FieldPacket[]) => any)
        | undefined
    ): Query;
    query<
      T_3 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      options: QueryOptions,
      values: any,
      callback?:
        | ((err: QueryError | null, result: T_3, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
  };
} & T;
