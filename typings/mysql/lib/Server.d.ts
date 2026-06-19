import { EventEmitter } from 'events';
import { Connection } from './Connection.js';

export type ServerResult =
  | Array<Record<string, any>>
  | { rows: Array<Record<string, any>>; columns: Array<{ name: string }> }
  | { affectedRows: number; insertId?: number }
  | void;

export interface AuthParams {
  user: string;
  database: string;
  address: string;
  authPluginData1: Buffer;
  authPluginData2: Buffer;
  authToken: Buffer;
}

export interface ServerHandlers {
  auth?(params: AuthParams): void | Promise<void>;
  query?(sql: string): ServerResult | Promise<ServerResult>;
  ping?(): void | Promise<void>;
  quit?(): void | Promise<void>;
  init_db?(schema: string): void | Promise<void>;
  handleCommand?(commandCode: number): any;
  serverVersion?: string;
  encoding?: string;
}

export type ServerFactory = (connection: Connection) => ServerHandlers;

export interface ServerOptions {
  onConnection?: (conn: Connection) => void;
  handleCommand?: (commandCode: number) => any;
  encoding?: string;
}

declare class Server extends EventEmitter {
  connections: Array<Connection>;

  listen(port: number): Server;
  close(callback: (error: Error, count: number) => any): void;
}

export { Server };
