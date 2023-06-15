export * from './index.js';

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
import { EventEmitter } from 'events';
import { ExecutableBase as ExecutableBaseClass } from './typings/mysql/lib/protocol/sequences/promise/ExecutableBase.js';
import { QueryableBase as QueryableBaseClass } from './typings/mysql/lib/protocol/sequences/promise/QueryableBase.js';

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

// Expose class interfaces
declare class QueryableAndExecutableBase extends QueryableBaseClass(
  ExecutableBaseClass(EventEmitter)
) {}

export interface Connection extends QueryableAndExecutableBase {
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
