import * as crypto from 'crypto';
import * as BasePool from './lib/Pool';
import * as BaseConnection from './lib/Connection';
import {
  PoolCluster as BasePoolCluster,
  PoolClusterOptions,
} from './lib/PoolCluster';
import { ConnectionOptions, SslOptions } from './lib/Connection';
import BasePoolConnection = require('./lib/PoolConnection');
import { PoolOptions } from './lib/Pool';
import BaseQuery = require('./lib/protocol/sequences/Query');
import BasePrepare = require('./lib/protocol/sequences/Prepare');
import { QueryOptions, QueryError } from './lib/protocol/sequences/Query';
import { PrepareStatementInfo } from './lib/protocol/sequences/Prepare';
import Server = require('./lib/Server');
import { Connection as PromiseConnection } from '../../promise';

export {
  ConnectionOptions,
  SslOptions,
  PoolOptions,
  PoolClusterOptions,
  QueryOptions,
  QueryError,
  PrepareStatementInfo,
};

export * from './lib/protocol/packets/index';

// Expose class interfaces
export interface Connection extends BaseConnection.Connection {
  promise(promiseImpl?: PromiseConstructor): PromiseConnection;
}
export interface Pool extends BasePool.Pool {}
export interface PoolConnection extends BasePoolConnection {}
export interface PoolCluster extends BasePoolCluster {}
export interface Query extends BaseQuery {}
export interface Prepare extends BasePrepare {}

export type AuthPlugin = (pluginMetadata: {
  connection: Connection;
  command: string;
}) => (
  pluginData: Buffer
) => Promise<string> | string | Buffer | Promise<Buffer> | null;

type AuthPluginDefinition<T> = (pluginOptions?: T) => AuthPlugin;

export const authPlugins: {
  caching_sha2_password: AuthPluginDefinition<{
    overrideIsSecure?: boolean;
    serverPublicKey?:
      | crypto.RsaPublicKey
      | crypto.RsaPrivateKey
      | crypto.KeyLike;
    jonServerPublicKey?: (data: Buffer) => void;
  }>;
  mysql_clear_password: AuthPluginDefinition<{
    password?: string;
  }>;
  mysql_native_password: AuthPluginDefinition<{
    password?: string;
    passwordSha1?: string;
  }>;
  sha256_password: AuthPluginDefinition<{
    serverPublicKey?:
      | crypto.RsaPublicKey
      | crypto.RsaPrivateKey
      | crypto.KeyLike;
    joinServerPublicKey?: (data: Buffer) => void;
  }>;
};

export function createConnection(connectionUri: string): Connection;
export function createConnection(
  config: BaseConnection.ConnectionOptions
): Connection;

export function createPool(config: BasePool.PoolOptions): BasePool.Pool;

export function createPoolCluster(config?: PoolClusterOptions): PoolCluster;

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

export function createServer(
  handler: (conn: BaseConnection.Connection) => any
): Server;
