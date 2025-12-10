import { Connection, BaseConnection } from './Connection.js';
import { Pool as PromisePool } from '../../../promise.js';

declare class PoolConnection extends BaseConnection {
  connection: Connection;
  release(): void;
  promise(promiseImpl?: PromiseConstructor): PromisePool;
}

export { PoolConnection };
