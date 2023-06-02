
import PoolConnection = require('./PoolConnection');
import {EventEmitter} from 'events';
import {PoolOptions} from './Pool';
import {OkPacket, RowDataPacket, FieldPacket, ResultSetHeader} from './protocol/packets/index';
import Query = require('./protocol/sequences/Query');

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
    
    export interface PoolNamespace {
        getConnection(callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => any): void;
    
        query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(sql: string, callback?: (err: Query.QueryError | null, result: T, fields: FieldPacket[]) => any): Query;
        query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(sql: string, values: any | any[] | { [param: string]: any }, callback?: (err: Query.QueryError | null, result: T, fields: FieldPacket[]) => any): Query;
        query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(options: Query.QueryOptions, callback?: (err: Query.QueryError | null, result: T, fields?: FieldPacket[]) => any): Query;
        query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(options: Query.QueryOptions, values: any | any[] | { [param: string]: any }, callback?: (err: Query.QueryError | null, result: T, fields: FieldPacket[]) => any): Query;
    
        execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(sql: string, callback?: (err: Query.QueryError | null, result: T, fields: FieldPacket[]) => any): Query;
        execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(sql: string, values: any | any[] | { [param: string]: any }, callback?: (err: Query.QueryError | null, result: T, fields: FieldPacket[]) => any): Query;
        execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(options: Query.QueryOptions, callback?: (err: Query.QueryError | null, result: T, fields?: FieldPacket[]) => any): Query;
        execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(options: Query.QueryOptions, values: any | any[] | { [param: string]: any }, callback?: (err: Query.QueryError | null, result: T, fields: FieldPacket[]) => any): Query;
    }
}

declare class PoolCluster extends EventEmitter {

    config: PoolCluster.PoolClusterOptions;

    add(config: PoolOptions): void;
    add(group: string, config: PoolOptions): void;

    end(): void;

    getConnection(callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => void): void;
    getConnection(group: string, callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => void): void;
    getConnection(group: string, selector: string, callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => void): void;

    of(pattern: string, selector?: string): PoolCluster.PoolNamespace;

    on(event: string, listener: Function): this;
    on(event: 'remove', listener: (nodeId: number) => void): this;
    on(event: 'connection', listener: (connection: PoolConnection) => void): this;
}

export = PoolCluster
