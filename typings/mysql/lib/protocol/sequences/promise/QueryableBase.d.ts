import { FieldPacket, QueryResult } from '../../packets/index.js';
import { QueryOptions, QueryValues, QueryableConstructor } from '../Query.js';

export declare function QueryableBase<T extends QueryableConstructor>(
  Base?: T
): {
  new (...args: any[]): {
    query<T extends QueryResult>(
      sql: string,
      values?: QueryValues
    ): Promise<[T, FieldPacket[]]>;

    query<T extends QueryResult>(
      options: QueryOptions,
      values?: QueryValues
    ): Promise<[T, FieldPacket[]]>;
  };
} & T;
