import { Connection } from './Connection';
import { Pool as PromisePool } from '../../../promise';

declare class PoolConnection extends Connection {
  connection: Connection;
  release(): void;
  promise(promiseImpl?: PromiseConstructor): PromisePool;
}

export default PoolConnection;
