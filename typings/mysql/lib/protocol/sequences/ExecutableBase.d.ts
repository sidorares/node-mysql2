import {
  FieldPacket,
  ExecuteOrQueryResultPackets,
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
    execute<T extends ExecuteOrQueryResultPackets>(
      sql: string,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
    execute<T extends ExecuteOrQueryResultPackets>(
      sql: string,
      values: any,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
    execute<T extends ExecuteOrQueryResultPackets>(
      options: QueryOptions,
      callback?:
        | ((err: QueryError | null, result: T, fields?: FieldPacket[]) => any)
        | undefined
    ): Query;
    execute<T extends ExecuteOrQueryResultPackets>(
      options: QueryOptions,
      values: any,
      callback?:
        | ((err: QueryError | null, result: T, fields: FieldPacket[]) => any)
        | undefined
    ): Query;
  };
} & T;
