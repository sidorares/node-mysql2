import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
  ProcedureCallPacket,
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
        | ResultSetHeader[]
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket
    >(
      sql: string,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | ResultSetHeader[]
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket
    >(
      sql: string,
      values: any,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | ResultSetHeader[]
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket
    >(
      options: QueryOptions,
      callback?:
        | ((err: QueryError | null, result: T, fields?: FieldPacket[]) => any)
        | undefined
    ): Query;
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | ResultSetHeader[]
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket
    >(
      options: QueryOptions,
      values: any,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
  };
} & T;
