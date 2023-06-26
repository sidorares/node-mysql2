import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
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
    >(
      sql: string
    ): Promise<[T, FieldPacket[]]>;
    query<
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
    query<
      T_2 extends
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
    >(
      options: QueryOptions
    ): Promise<[T_2, FieldPacket[]]>;
    query<
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
