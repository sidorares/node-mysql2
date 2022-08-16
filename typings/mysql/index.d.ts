
import BaseConnection = require('./lib/Connection');
import {ConnectionOptions, SslOptions} from './lib/Connection';
import BasePoolConnection = require('./lib/PoolConnection');
import BasePool = require('./lib/Pool');
import {PoolOptions} from './lib/Pool';
import BasePoolCluster = require('./lib/PoolCluster');
import {PoolClusterOptions} from './lib/PoolCluster';
import BaseQuery = require('./lib/protocol/sequences/Query');
import BasePrepare = require('./lib/protocol/sequences/Prepare');
import {QueryOptions, StreamOptions, QueryError} from './lib/protocol/sequences/Query';
import {PrepareStatementInfo} from './lib/protocol/sequences/Prepare';
import Server = require('./lib/Server');

export function createConnection(connectionUri: string): Connection;
export function createConnection(config: BaseConnection.ConnectionOptions): Connection;
export function createPool(config: BasePool.PoolOptions): BasePool;
export function createPoolCluster(config?: BasePoolCluster.PoolClusterOptions): PoolCluster;
export function escape(value: any): string;
export function escapeId(value: any): string;
export function format(sql: string): string;
export function format(sql: string, values: any[], stringifyObjects?: boolean, timeZone?: string): string;
export function format(sql: string, values: any, stringifyObjects?: boolean, timeZone?: string): string;
export function raw(sql: string): {
    toSqlString: () => string
};
export function createServer(handler: (conn: BaseConnection) => any): Server;

export {
    ConnectionOptions,
    SslOptions,
    PoolOptions,
    PoolClusterOptions,
    QueryOptions,
    QueryError,
    PrepareStatementInfo
};
export * from './lib/protocol/packets/index';

// Expose class interfaces
export interface Connection extends BaseConnection {}
export interface PoolConnection extends BasePoolConnection {}
export interface Pool extends BasePool {}
export interface PoolCluster extends BasePoolCluster {}
export interface Query extends BaseQuery {}
export interface Prepare extends BasePrepare {}