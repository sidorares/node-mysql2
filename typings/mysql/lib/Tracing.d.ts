import type { TracingChannel } from 'node:diagnostics_channel';

export interface QueryTraceContext {
  query: string;
  values: any;
  database: string;
  serverAddress: string;
  serverPort: number | undefined;
}

export interface ExecuteTraceContext {
  query: string;
  values: any;
  database: string;
  serverAddress: string;
  serverPort: number | undefined;
}

export interface ConnectTraceContext {
  database: string;
  serverAddress: string;
  serverPort: number | undefined;
  user: string;
}

export interface PoolConnectTraceContext {
  database: string;
  serverAddress: string;
  serverPort: number | undefined;
}

export declare const dc: typeof import('node:diagnostics_channel') | undefined;
export declare const hasTracingChannel: boolean;

export declare function shouldTrace(
  channel: TracingChannel<object> | undefined | null
): boolean;

export declare function traceCallback<T extends object>(
  channel: TracingChannel<T> | undefined | null,
  fn: (...args: any[]) => any,
  position: number,
  contextFactory: () => T,
  thisArg: any,
  ...args: any[]
): any;

export declare function tracePromise<T extends object, R>(
  channel: TracingChannel<T> | undefined | null,
  fn: () => Promise<R>,
  contextFactory: () => T
): Promise<R>;

export declare const queryChannel:
  | TracingChannel<QueryTraceContext>
  | undefined;
export declare const executeChannel:
  | TracingChannel<ExecuteTraceContext>
  | undefined;
export declare const connectChannel:
  | TracingChannel<ConnectTraceContext>
  | undefined;
export declare const poolConnectChannel:
  | TracingChannel<PoolConnectTraceContext>
  | undefined;

export declare function getServerContext(config: {
  socketPath?: string;
  host?: string;
  port?: number;
}): { serverAddress: string; serverPort: number | undefined };
