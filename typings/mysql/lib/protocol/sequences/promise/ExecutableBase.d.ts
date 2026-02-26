import { FieldPacket, QueryResult } from '../../packets/index.js';
import { QueryOptions, QueryableConstructor, ExecuteValues } from '../Query.js';

export declare function ExecutableBase<T extends QueryableConstructor>(
  Base?: T
): {
  new (...args: any[]): {
    execute<T extends QueryResult>(
      sql: string,
      values?: ExecuteValues
    ): Promise<[T, FieldPacket[]]>;
    execute<T extends QueryResult>(
      options: QueryOptions,
      values?: ExecuteValues
    ): Promise<[T, FieldPacket[]]>;
  };
} & T;
