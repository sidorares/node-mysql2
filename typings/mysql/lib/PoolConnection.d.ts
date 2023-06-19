import { Connection } from './Connection';

declare class PoolConnection extends Connection {
  connection: Connection;
  release(): void;
}

export = PoolConnection;
