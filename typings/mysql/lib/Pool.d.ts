import { QueryError } from './protocol/sequences/Query.js';
import * as Connection from './Connection.js';
import PoolConnection from './PoolConnection.js';
import { EventEmitter } from 'events';
import {
  Pool as PromisePool,
  PoolConnection as PromisePoolConnection,
} from '../../../promise.js';
import { Prepare, PrepareStatementInfo } from './protocol/sequences/Prepare.js';
import { QueryableBase } from './protocol/sequences/QueryableBase.js';
import { ExecutableBase } from './protocol/sequences/ExecutableBase.js';

export interface PoolOptions extends Connection.ConnectionOptions {
  /**
   * The milliseconds before a timeout occurs during the connection acquisition. This is slightly different from connectTimeout,
   * because acquiring a pool connection does not always involve making a connection. (Default: 10 seconds)
   */
  acquireTimeout?: number;

  /**
   * Determines the pool's action when no connections are available and the limit has been reached. If true, the pool will queue
   * the connection request and call it when one becomes available. If false, the pool will immediately call back with an error.
   * (Default: true)
   */
  waitForConnections?: boolean;

  /**
   * The maximum number of connections to create at once. (Default: 10)
   */
  connectionLimit?: number;

  /**
   * The maximum number of idle connections. (Default: same as `connectionLimit`)
   */
  maxIdle?: number;

  /**
   * The idle connections timeout, in milliseconds. (Default: 60000)
   */
  idleTimeout?: number;

  /**
   * The maximum number of connection requests the pool will queue before returning an error from getConnection. If set to 0, there
   * is no limit to the number of queued connection requests. (Default: 0)
   */
  queueLimit?: number;

  /**
   * Enable keep-alive on the socket. (Default: true)
   */
  enableKeepAlive?: boolean;

  /**
   * If keep-alive is enabled users can supply an initial delay. (Default: 0)
   */
  keepAliveInitialDelay?: number;
}

declare class Pool extends QueryableBase(ExecutableBase(EventEmitter)) {
  config: PoolOptions;

  getConnection(
    callback: (
      err: NodeJS.ErrnoException | null,
      connection: PoolConnection
    ) => any
  ): void;

  releaseConnection(connection: PoolConnection | PromisePoolConnection): void;

  end(
    callback?: (err: NodeJS.ErrnoException | null, ...args: any[]) => any
  ): void;

  on(event: string, listener: (...args: any[]) => void): this;
  on(event: 'connection', listener: (connection: PoolConnection) => any): this;
  on(event: 'acquire', listener: (connection: PoolConnection) => any): this;
  on(event: 'release', listener: (connection: PoolConnection) => any): this;
  on(event: 'enqueue', listener: () => any): this;

  promise(promiseImpl?: PromiseConstructor): PromisePool;

  unprepare(sql: string): PrepareStatementInfo;
  prepare(
    sql: string,
    callback?: (err: QueryError | null, statement: PrepareStatementInfo) => any
  ): Prepare;
}

export { Pool };
