import * as BaseConnection from './lib/Connection';
import * as BasePool from './lib/Pool';
import * as BasePoolCluster from './lib/PoolCluster';
import * as BaseQuery from './lib/protocol/sequences/Query';
import { ConnectionOptions, SslOptions } from './lib/Connection';
import { PoolOptions } from './lib/Pool';
import { PoolClusterOptions } from './lib/PoolCluster';
import { QueryOptions, QueryError } from './lib/protocol/sequences/Query';
import { PrepareStatementInfo } from './lib/protocol/sequences/Prepare';
import { Prepare as BasePrepare } from './lib/protocol/sequences/Prepare';
import Server from './lib/Server';
import BasePoolConnection from './lib/PoolConnection';

export function createConnection(
  connectionUri: string
): BaseConnection.Connection;
export function createConnection(
  config: BaseConnection.ConnectionOptions
): BaseConnection.Connection;

export function createPool(config: BasePool.PoolOptions): BasePool.Pool;

export function createPoolCluster(
  config?: BasePoolCluster.PoolClusterOptions
): BasePoolCluster.PoolCluster;

export function createServer(
  handler: (conn: BaseConnection.Connection) => any
): Server;

export function escape(value: any): string;
export function escapeId(value: any): string;

export function format(sql: string): string;
export function format(
  sql: string,
  values: any[],
  stringifyObjects?: boolean,
  timeZone?: string
): string;
export function format(
  sql: string,
  values: any,
  stringifyObjects?: boolean,
  timeZone?: string
): string;

export function raw(sql: string): {
  toSqlString: () => string;
};

export * from './lib/protocol/packets';
export * from './lib/Auth';

export {
  ConnectionOptions,
  SslOptions,
  PoolOptions,
  PoolClusterOptions,
  QueryOptions,
  QueryError,
  PrepareStatementInfo,
};

// Expose class interfaces
export interface Connection extends BaseConnection.Connection {}
export interface PoolConnection extends BasePoolConnection {}
export interface Pool extends BasePool.Pool {}
export interface PoolCluster extends BasePoolCluster.PoolCluster {}
export interface Query extends BaseQuery.Query {}
export interface Prepare extends BasePrepare {}
