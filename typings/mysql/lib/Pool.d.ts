import { EventEmitter } from 'events';
import { PrepareStatementInfo } from './protocol/sequences/Prepare.js';
import { ConnectionOptions } from './Connection.js';
import { PoolConnection } from './PoolConnection.js';
import {
  Pool as PromisePool,
  PoolConnection as PromisePoolConnection,
} from '../../../promise.js';
import { QueryableBase } from './protocol/sequences/QueryableBase.js';
import { ExecutableBase } from './protocol/sequences/ExecutableBase.js';

export interface PoolOptions extends ConnectionOptions {
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
}

/**
 * A snapshot of the pool's current state, useful for monitoring and diagnostics.
 */
export interface PoolStats {
  /** Total number of connections currently managed by the pool (active + idle). */
  all: number;

  /** Number of connections currently idle and available for use. */
  free: number;

  /** Number of `getConnection` requests waiting in the queue. */
  queued: number;

  /** The configured maximum number of connections (`connectionLimit`). */
  connectionLimit: number;

  /** The configured maximum queue length (`queueLimit`). 0 means unlimited. */
  queueLimit: number;

  /** Whether the pool has been closed via `pool.end()`. */
  closed: boolean;
}

declare class Pool extends QueryableBase(ExecutableBase(EventEmitter)) {
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

  /**
   * Returns a snapshot of the pool's current state for monitoring and diagnostics.
   *
   * @example
   * const stats = pool.getStats();
   * console.log(`${stats.free}/${stats.all} connections free, ${stats.queued} queued`);
   */
  getStats(): PoolStats;

  on(event: string, listener: (...args: any[]) => void): this;
  on(event: 'connection', listener: (connection: PoolConnection) => any): this;
  on(event: 'acquire', listener: (connection: PoolConnection) => any): this;
  on(event: 'release', listener: (connection: PoolConnection) => any): this;
  on(event: 'enqueue', listener: () => any): this;

  unprepare(sql: string): PrepareStatementInfo;

  promise(promiseImpl?: PromiseConstructor): PromisePool;

  config: PoolOptions;
}

export { Pool };
