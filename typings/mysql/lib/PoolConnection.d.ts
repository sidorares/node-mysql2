import { Connection } from './Connection.js';
import { PoolConnection as PromisePoolConnection } from '../../../promise.js';

declare class PoolConnection extends Connection {
  connection: Connection;
  release(): void;
  [Symbol.dispose](): void;
  /**
   * Returns a promise-based wrapper around this pooled connection.
   *
   * Note: this resolves to a `PoolConnection` from `mysql2/promise`, not to a `Pool`.
   */
  promise(promiseImpl?: PromiseConstructor): PromisePoolConnection;
}

export { PoolConnection };
