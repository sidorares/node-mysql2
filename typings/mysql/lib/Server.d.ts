import { EventEmitter } from 'events';
import { Connection } from './Connection';

declare class Server extends EventEmitter {
  connections: Array<Connection>;

  listen(port: number): Server;
  close(callback: (error: Error, count: number) => any): void;
}

export { Server };
