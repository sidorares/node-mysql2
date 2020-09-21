import {
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  FieldPacket,
  QueryOptions,
  ConnectionOptions,
  PoolOptions
} from './index';

import { EventEmitter } from 'events';
export * from './index';

export interface Connection extends EventEmitter {
  config: ConnectionOptions;
  threadId: number;

  connect(): Promise<void>;
  ping(): Promise<void>;

  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;

  changeUser(options: ConnectionOptions): Promise<void>;

  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  unprepare(sql: string): void;

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
  release(): void;
}

export interface Pool extends EventEmitter {
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
    options: QueryOptions,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;

  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    sql: string,
    values: any | any[] | { [param: string]: any }
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  execute<
    T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader
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
}

export function createConnection(connectionUri: string): Promise<Connection>;
export function createConnection(
  config: ConnectionOptions
): Promise<Connection>;
export function createPool(config: PoolOptions): Pool;
