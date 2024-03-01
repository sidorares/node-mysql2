import {
  FieldPacket,
  ExecuteOrQueryResultPackets,
} from '../../packets/index.js';
import { QueryOptions, QueryableConstructor } from '../Query.js';

export declare function QueryableBase<T extends QueryableConstructor>(
  Base?: T
): {
  new (...args: any[]): {
    query<T extends ExecuteOrQueryResultPackets>(
      sql: string
    ): Promise<[T, FieldPacket[]]>;
    query<T extends ExecuteOrQueryResultPackets>(
      sql: string,
      values: any
    ): Promise<[T, FieldPacket[]]>;
    query<T extends ExecuteOrQueryResultPackets>(
      options: QueryOptions
    ): Promise<[T, FieldPacket[]]>;
    query<T extends ExecuteOrQueryResultPackets>(
      options: QueryOptions,
      values: any
    ): Promise<[T, FieldPacket[]]>;
  };
} & T;
