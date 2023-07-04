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

export declare function ExecutableBase<T extends QueryableConstructor>(
  Base?: T
): {
  new (...args: any[]): {
    execute<
      T extends
        | OkPacket
        | ResultSetHeader
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
    execute<
      T extends
        | OkPacket
        | ResultSetHeader
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
    execute<
      T extends
        | OkPacket
        | ResultSetHeader
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
    execute<
      T extends
        | OkPacket
        | ResultSetHeader
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
