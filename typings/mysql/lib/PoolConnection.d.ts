
import Connection = require('./Connection');
import PoolConnectionBase = require('./PoolConnectionBase');

declare class PoolConnection extends Connection implements PoolConnectionBase {
    connection: Connection;
    release(): void;
}

export = PoolConnection;
