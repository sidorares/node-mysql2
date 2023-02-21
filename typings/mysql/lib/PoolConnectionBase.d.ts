
import Connection = require('./Connection');

declare interface PoolConnectionBase {
  connection: Connection;
  release(): void;
}

export = PoolConnectionBase;
