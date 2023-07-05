import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
  ProcedureCallPacket,
} from '../../packets/index.js';
import { QueryOptions, QueryableConstructor } from '../Query.js';

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
      sql: string
    ): Promise<[T, FieldPacket[]]>;
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
      values: any
    ): Promise<[T, FieldPacket[]]>;
    execute<
      T extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
        | ProcedureCallPacket
    >(
      options: QueryOptions
    ): Promise<[T, FieldPacket[]]>;
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
      values: any
    ): Promise<[T, FieldPacket[]]>;
  };
} & T;
