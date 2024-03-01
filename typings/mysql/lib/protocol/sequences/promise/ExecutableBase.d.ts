import {
  FieldPacket,
  ExecuteOrQueryResultPackets,
} from '../../packets/index.js';
import { QueryOptions, QueryableConstructor } from '../Query.js';

export declare function ExecutableBase<T extends QueryableConstructor>(
  Base?: T
): {
  new (...args: any[]): {
    execute<T extends ExecuteOrQueryResultPackets>(
      sql: string
    ): Promise<[T, FieldPacket[]]>;
    execute<T extends ExecuteOrQueryResultPackets>(
      sql: string,
      values: any
    ): Promise<[T, FieldPacket[]]>;
    execute<T extends ExecuteOrQueryResultPackets>(
      options: QueryOptions
    ): Promise<[T, FieldPacket[]]>;
    execute<T extends ExecuteOrQueryResultPackets>(
      options: QueryOptions,
      values: any
    ): Promise<[T, FieldPacket[]]>;
  };
} & T;
