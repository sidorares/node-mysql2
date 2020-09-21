import {
  Connection as PromiseConnection,
  Pool as PromisePool,
  PoolConnection as PromisePoolConnection
} from './promise';

import * as mysql from './typings/mysql';
export * from './typings/mysql';

export interface Connection extends mysql.Connection {
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    sql: string,
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    sql: string,
    values: any | any[] | { [param: string]: any },
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    options: mysql.QueryOptions,
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields?: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    options: mysql.QueryOptions,
    values: any | any[] | { [param: string]: any },
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  ping(callback?: (err: mysql.QueryError | null) => any): void;
  promise(promiseImpl?: PromiseConstructor): PromiseConnection;
}

export interface PoolConnection extends mysql.PoolConnection, Connection {
  promise(promiseImpl?: PromiseConstructor): PromisePoolConnection;
}

export interface Pool extends mysql.Connection {
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    sql: string,
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    sql: string,
    values: any | any[] | { [param: string]: any },
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    options: mysql.QueryOptions,
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields?: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  execute<
    T extends
      | mysql.RowDataPacket[][]
      | mysql.RowDataPacket[]
      | mysql.OkPacket
      | mysql.OkPacket[]
      | mysql.ResultSetHeader
  >(
    options: mysql.QueryOptions,
    values: any | any[] | { [param: string]: any },
    callback?: (
      err: mysql.QueryError | null,
      result: T,
      fields: mysql.FieldPacket[]
    ) => any
  ): mysql.Query;
  getConnection(
    callback: (err: NodeJS.ErrnoException, connection: PoolConnection) => any
  ): void;
  on(event: 'connection', listener: (connection: PoolConnection) => any): this;
  on(event: 'acquire', listener: (connection: PoolConnection) => any): this;
  on(event: 'release', listener: (connection: PoolConnection) => any): this;
  on(event: 'enqueue', listener: () => any): this;
  promise(promiseImpl?: PromiseConstructor): PromisePool;
}

type authPlugins =
    (pluginMetadata: { connection: Connection; command: string }) =>
        (pluginData: Buffer) => Promise<string>;

export interface ConnectionOptions extends mysql.ConnectionOptions {
  charsetNumber?: number;
  compress?: boolean;
  authSwitchHandler?: (data: any, callback: () => void) => any;
  connectAttributes?: { [param: string]: any };
  decimalNumbers?: boolean;
  isServer?: boolean;
  maxPreparedStatements?: number;
  namedPlaceholders?: boolean;
  nestTables?: boolean | string;
  passwordSha1?: string;
  pool?: any;
  rowsAsArray?: boolean;
  stream?: any;
  uri?: string;
  connectionLimit?: number;
  Promise?: any;
  queueLimit?: number;
  waitForConnections?: boolean;
  authPlugins?: {
      [key: string]: authPlugins;
  };
}

export interface PoolOptions extends mysql.PoolOptions, ConnectionOptions {}

export function createConnection(connectionUri: string): Connection;
export function createConnection(config: ConnectionOptions): Connection;
export function createPool(config: PoolOptions): Pool;
