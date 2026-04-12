import { EventEmitter } from 'events';
import { Connection } from './Connection.js';

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
