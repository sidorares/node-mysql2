import { Connection } from './Connection.js';
import { Pool as PromisePool } from '../../../promise.js';

declare class PoolConnection extends Connection {
  connection: Connection;
  release(): void;
  [Symbol.dispose](): void;
  promise(promiseImpl?: PromiseConstructor): PromisePool;
}

export { PoolConnection };
