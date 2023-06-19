import * as mysql from './typings/mysql/index.js';

export * from './typings/mysql/index.js';

export interface ConnectionOptions extends mysql.ConnectionOptions {
  charsetNumber?: number;
  compress?: boolean;
  authSwitchHandler?: (data: any, callback: () => void) => any;
  connectAttributes?: { [param: string]: any };
  decimalNumbers?: boolean;
  isServer?: boolean;
  maxPreparedStatements?: number;
  namedPlaceholders?: boolean;
  nestTables?: boolean | string;
  passwordSha1?: string;
  pool?: any;
  rowsAsArray?: boolean;
  stream?: any;
  uri?: string;
  connectionLimit?: number;
  maxIdle?: number;
  idleTimeout?: number;
  Promise?: any;
  queueLimit?: number;
  waitForConnections?: boolean;
  authPlugins?: {
    [key: string]: mysql.AuthPlugin;
  };
}

export interface ConnectionConfig extends ConnectionOptions {
  mergeFlags(defaultFlags: string[], userFlags: string[] | string): number;
  getDefaultFlags(options?: ConnectionOptions): string[];
  getCharsetNumber(charset: string): number;
  getSSLProfile(name: string): { ca: string[] };
  parseUrl(url: string): {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    [key: string]: any;
  };
}

export interface PoolOptions extends mysql.PoolOptions, ConnectionOptions {}
