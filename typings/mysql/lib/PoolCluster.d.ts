
import Connection = require('./Connection');
import PoolConnection = require('./PoolConnection');
import {EventEmitter} from 'events';

declare namespace PoolCluster {

    export interface PoolClusterOptions {
        /**
         * If true, PoolCluster will attempt to reconnect when connection fails. (Default: true)
         */
        canRetry?: boolean;

        /**
         * If connection fails, node's errorCount increases. When errorCount is greater than removeNodeErrorCount,
         * remove a node in the PoolCluster. (Default: 5)
         */
        removeNodeErrorCount?: number;

        /**
         * If connection fails, specifies the number of milliseconds before another connection attempt will be made.
         * If set to 0, then node will be removed instead and never re-used. (Default: 0)
         */
        restoreNodeTimeout?: number;

        /**
         * The default selector. (Default: RR)
         * RR: Select one alternately. (Round-Robin)
         * RANDOM: Select the node by random function.
         * ORDER: Select the first node available unconditionally.
         */
        defaultSelector?: string;
    }
}

declare class PoolCluster extends EventEmitter {

    config: PoolCluster.PoolClusterOptions;

    add(config: PoolCluster.PoolClusterOptions): void;
    add(group: string, config: PoolCluster.PoolClusterOptions): void;

    end(): void;

    getConnection(callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => void): void;
    getConnection(group: string, callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => void): void;
    getConnection(group: string, selector: string, callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => void): void;

    of(pattern: string, selector?: string): PoolCluster;

    on(event: string, listener: Function): this;
    on(event: 'remove', listener: (nodeId: number) => void): this;
    on(event: 'connection', listener: (connection: PoolConnection) => void): this;
}

export = PoolCluster;
