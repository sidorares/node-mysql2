
import Connection = require('./Connection');

declare class PoolConnection extends Connection {
    release(): void;
}

export = PoolConnection;
