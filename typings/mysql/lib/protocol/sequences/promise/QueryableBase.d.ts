import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
  ProcedureCallPacket,
} from '../../packets/index.js';
import { QueryOptions, QueryableConstructor } from '../Query.js';

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
        | ProcedureCallPacket<
            | OkPacket
            | ResultSetHeader
            | RowDataPacket[]
            | RowDataPacket[][]
            | OkPacket[]
          >
    >(
      sql: string
    ): Promise<[T, FieldPacket[]]>;
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket<
            | OkPacket
            | ResultSetHeader
            | RowDataPacket[]
            | RowDataPacket[][]
            | OkPacket[]
          >
    >(
      sql: string,
      values: any
    ): Promise<[T, FieldPacket[]]>;
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket<
            | OkPacket
            | ResultSetHeader
            | RowDataPacket[]
            | RowDataPacket[][]
            | OkPacket[]
          >
    >(
      options: QueryOptions
    ): Promise<[T, FieldPacket[]]>;
    query<
      T extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket<
            | OkPacket
            | ResultSetHeader
            | RowDataPacket[]
            | RowDataPacket[][]
            | OkPacket[]
          >
    >(
      options: QueryOptions,
      values: any
    ): Promise<[T, FieldPacket[]]>;
  };
} & T;
