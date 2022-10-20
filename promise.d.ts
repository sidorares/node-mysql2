import {
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  FieldPacket,
  QueryOptions,
  ConnectionOptions,
  PoolOptions,
  Pool as CorePool
} from './index';

import { EventEmitter } from 'events';
export * from './index';

type QueryOrExecuteResult = RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader;

export interface Connection extends EventEmitter {
  config: ConnectionOptions;
  threadId: number;

  connect(): Promise<void>;
  ping(): Promise<void>;

  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;

  changeUser(options: ConnectionOptions): Promise<void>;

  query<T extends QueryOrExecuteResult = any[]>(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  query<T extends QueryOrExecuteResult = any[]>(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  query<T extends QueryOrExecuteResult = any[]>(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  query<T extends QueryOrExecuteResult = any[]>(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  prepare(options: string | QueryOptions): Promise<PreparedStatementInfo>;
  unprepare(sql: string | QueryOptions): void;

  end(options?: any): Promise<void>;

  destroy(): void;

  pause(): void;

  resume(): void;

  escape(value: any): string;

  escapeId(value: string): string;
  escapeId(values: string[]): string;

  format(sql: string, values?: any | any[] | { [param: string]: any }): string;
}

export interface PoolConnection extends Connection {
  connection: Connection;
  release(): void;
}

export interface Pool extends EventEmitter {
  query<T extends QueryOrExecuteResult = any[]>(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  query<T extends QueryOrExecuteResult = any[]>(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  query<T extends QueryOrExecuteResult = any[]>(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  query<T extends QueryOrExecuteResult = any[]>(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends QueryOrExecuteResult = any[]
  >(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  getConnection(): Promise<PoolConnection>;
  on(event: 'connection', listener: (connection: PoolConnection) => any): this;
  on(event: 'acquire', listener: (connection: PoolConnection) => any): this;
  on(event: 'release', listener: (connection: PoolConnection) => any): this;
  on(event: 'enqueue', listener: () => any): this;
  end(): Promise<void>;

  escape(value: any): string;
  escapeId(value: string): string;
  escapeId(values: string[]): string;
  format(sql: string, values?: any | any[] | { [param: string]: any }): string;

  pool: CorePool;
}

export function createConnection(connectionUri: string): Promise<Connection>;
export function createConnection(
  config: ConnectionOptions
): Promise<Connection>;
export function createPool(config: PoolOptions): Pool;

export interface PreparedStatementInfo {
  close(): Promise<void>;
  execute(parameters: any[]): Promise<[QueryOrExecuteResult, FieldPacket[]]>;
}

export interface PromisePoolConnection extends Connection {
  destroy(): any;
} 
