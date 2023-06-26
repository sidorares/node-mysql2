import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
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
    >(
      sql: string
    ): Promise<[T, FieldPacket[]]>;
    execute<
      T_1 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      sql: string,
      values: any
    ): Promise<[T_1, FieldPacket[]]>;
    execute<
      T_2 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      options: QueryOptions
    ): Promise<[T_2, FieldPacket[]]>;
    execute<
      T_3 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      options: QueryOptions,
      values: any
    ): Promise<[T_3, FieldPacket[]]>;
  };
} & T;
