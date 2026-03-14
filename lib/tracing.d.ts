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

export declare function traceQuery<T>(
  fn: () => Promise<T>,
  contextFactory: () => QueryTraceContext
): Promise<T>;

export declare function traceExecute<T>(
  fn: () => Promise<T>,
  contextFactory: () => ExecuteTraceContext
): Promise<T>;

export declare function traceConnect<T>(
  fn: () => Promise<T>,
  contextFactory: () => ConnectTraceContext
): Promise<T>;

export declare function tracePoolConnect<T>(
  fn: () => Promise<T>,
  contextFactory: () => PoolConnectTraceContext
): Promise<T>;
