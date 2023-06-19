import {
  OkPacket,
  FieldPacket,
  RowDataPacket,
  ResultSetHeader,
} from '../../packets/index.js';
import { Query, QueryOptions, QueryableConstructor } from '../Query.js';

export function QueryableBase<T extends QueryableConstructor>(
  Base: T = {} as T
) {
  return class extends Base {
    query<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(sql: string): Promise<[T, FieldPacket[]]>;
    query<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      sql: string,
      values: any | any[] | { [param: string]: any }
    ): Promise<[T, FieldPacket[]]>;
    query<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(options: QueryOptions): Promise<[T, FieldPacket[]]>;
    query<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      options: QueryOptions,
      values: any | any[] | { [param: string]: any }
    ): Promise<[T, FieldPacket[]]>;

    // Implementing all overload variations
    /* eslint-disable @typescript-eslint/no-unused-vars */
    query<
      T extends
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
    >(
      sql: string | QueryOptions,
      values?: any | any[] | { [param: string]: any }
    ): Promise<[T, FieldPacket[]]> {
      return new Promise(() => new Query());
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
  };
}
