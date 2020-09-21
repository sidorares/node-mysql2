
import BaseConnection = require('./lib/Connection');
import {ConnectionOptions, SslOptions} from './lib/Connection';
import BasePoolConnection = require('./lib/PoolConnection');
import BasePool = require('./lib/Pool');
import {PoolOptions} from './lib/Pool';
import BasePoolCluster = require('./lib/PoolCluster');
import {PoolClusterOptions} from './lib/PoolCluster';
import BaseQuery = require('./lib/protocol/sequences/Query');
import {QueryOptions, StreamOptions, QueryError} from './lib/protocol/sequences/Query';

export function createConnection(connectionUri: string): Connection;
export function createConnection(config: BaseConnection.ConnectionOptions): Connection;
export function createPool(config: BasePool.PoolOptions): Pool;
export function createPoolCluster(config?: BasePoolCluster.PoolClusterOptions): PoolCluster;
export function escape(value: any): string;
export function format(sql: string): string;
export function format(sql: string, values: any[]): string;
export function format(sql: string, values: any): string;

export {
    ConnectionOptions,
    SslOptions,
    PoolOptions,
    PoolClusterOptions,
    QueryOptions,
    QueryError
};
export * from './lib/protocol/packets/index';

// Expose class interfaces
export interface Connection extends BaseConnection {}
export interface PoolConnection extends BasePoolConnection {}
export interface Pool extends BasePool {}
export interface PoolCluster extends BasePoolCluster {}
export interface Query extends BaseQuery {}
