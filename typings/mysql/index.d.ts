import { RsaPublicKey, RsaPrivateKey, KeyLike } from 'crypto';
import { Pool as BasePool, PoolOptions } from './lib/Pool.js';
import {
  Connection as BaseConnection,
  ConnectionOptions,
  SslOptions,
} from './lib/Connection.js';
import {
  Query as BaseQuery,
  QueryOptions,
  QueryError,
} from './lib/protocol/sequences/Query.js';
import {
  PoolCluster as BasePoolCluster,
  PoolClusterOptions,
} from './lib/PoolCluster.js';
import { PoolConnection as BasePoolConnection } from './lib/PoolConnection.js';
import {
  Prepare as BasePrepare,
  PrepareStatementInfo,
} from './lib/protocol/sequences/Prepare.js';
import { Server } from './lib/Server.js';
import { Connection as PromiseConnection } from '../../promise.js';

export {
  ConnectionOptions,
  SslOptions,
  PoolOptions,
  PoolClusterOptions,
  QueryOptions,
  QueryError,
  PrepareStatementInfo,
};

export * from './lib/protocol/packets/index.js';

// Expose class interfaces
export interface Connection extends BaseConnection {
  promise(promiseImpl?: PromiseConstructor): PromiseConnection;
}
export interface Pool extends BasePool {}
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
    serverPublicKey?: RsaPublicKey | RsaPrivateKey | KeyLike;
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
    serverPublicKey?: RsaPublicKey | RsaPrivateKey | KeyLike;
    joinServerPublicKey?: (data: Buffer) => void;
  }>;
};

export function createConnection(connectionUri: string): Connection;
export function createConnection(config: ConnectionOptions): Connection;

export function createPool(config: PoolOptions): BasePool;

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

export function createServer(handler: (conn: BaseConnection) => any): Server;
