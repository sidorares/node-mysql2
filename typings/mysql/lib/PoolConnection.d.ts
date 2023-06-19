import { Connection } from './Connection.js';

declare class PoolConnection extends Connection {
  connection: Connection;
  release(): void;
}

export { PoolConnection };
