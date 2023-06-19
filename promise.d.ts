import { EventEmitter } from 'events';

import {
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  FieldPacket,
  QueryOptions,
  ConnectionOptions,
  PoolOptions,
  Pool as CorePool,
} from './index.js';

export * from './index.js';

export interface PreparedStatementInfo {
  close(): Promise<void>;
  execute(
    parameters: any[]
  ): Promise<
    [
      (
        | RowDataPacket[][]
        | RowDataPacket[]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
      ),
      FieldPacket[]
    ]
  >;
}

export interface Connection extends EventEmitter {
  query<
    T extends
      | RowDataPacket[][]
      | RowDataPacket[]
      | OkPacket
      | OkPacket[]
      | ResultSetHeader
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
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
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
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

  execute<
    T extends
      | RowDataPacket[][]
      | RowDataPacket[]
      | OkPacket
      | OkPacket[]
      | ResultSetHeader
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  execute<
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
  execute<
    T extends
      | RowDataPacket[][]
      | RowDataPacket[]
      | OkPacket
      | OkPacket[]
      | ResultSetHeader
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  execute<
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

  config: ConnectionOptions;

  threadId: number;

  connect(): Promise<void>;

  ping(): Promise<void>;

  beginTransaction(): Promise<void>;

  commit(): Promise<void>;

  rollback(): Promise<void>;

  changeUser(options: ConnectionOptions): Promise<void>;

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
  release(): void;
  connection: Connection;
}

export interface Pool extends EventEmitter, Connection {
  query<
    T extends
      | RowDataPacket[][]
      | RowDataPacket[]
      | OkPacket
      | OkPacket[]
      | ResultSetHeader
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
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
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
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

  execute<
    T extends
      | RowDataPacket[][]
      | RowDataPacket[]
      | OkPacket
      | OkPacket[]
      | ResultSetHeader
  >(
    sql: string
  ): Promise<[T, FieldPacket[]]>;
  execute<
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
  execute<
    T extends
      | RowDataPacket[][]
      | RowDataPacket[]
      | OkPacket
      | OkPacket[]
      | ResultSetHeader
  >(
    options: QueryOptions
  ): Promise<[T, FieldPacket[]]>;
  execute<
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

  getConnection(): Promise<PoolConnection>;

  releaseConnection(connection: PoolConnection): void;

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

export function createPool(connectionUri: string): Pool;
export function createPool(config: PoolOptions): Pool;
