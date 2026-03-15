import { describe, it, strict } from 'poku';
import tracing from '../../lib/tracing.js';

const { dc, hasTracingChannel } = tracing;

await describe('Tracing module', async () => {
  await it('should load diagnostics_channel', () => {
    // dc should be defined on Node.js versions that support diagnostics_channel
    strict.ok(dc !== undefined, 'diagnostics_channel should be available');
  });

  await it('should detect TracingChannel support', () => {
    if (typeof dc?.tracingChannel === 'function') {
      strict.ok(
        hasTracingChannel,
        'hasTracingChannel should be true when tracingChannel exists'
      );
      strict.ok(
        tracing.queryChannel !== undefined,
        'queryChannel should be defined'
      );
      strict.ok(
        tracing.executeChannel !== undefined,
        'executeChannel should be defined'
      );
      strict.ok(
        tracing.connectChannel !== undefined,
        'connectChannel should be defined'
      );
      strict.ok(
        tracing.poolConnectChannel !== undefined,
        'poolConnectChannel should be defined'
      );
    } else {
      strict.ok(
        !hasTracingChannel,
        'hasTracingChannel should be false when tracingChannel is unavailable'
      );
      strict.strictEqual(
        tracing.queryChannel,
        undefined,
        'queryChannel should be undefined'
      );
      strict.strictEqual(
        tracing.executeChannel,
        undefined,
        'executeChannel should be undefined'
      );
      strict.strictEqual(
        tracing.connectChannel,
        undefined,
        'connectChannel should be undefined'
      );
      strict.strictEqual(
        tracing.poolConnectChannel,
        undefined,
        'poolConnectChannel should be undefined'
      );
    }
  });

  await it('should return server context for host/port', () => {
    const ctx = tracing.getServerContext({ host: '127.0.0.1', port: 3307 });
    strict.strictEqual(ctx.serverAddress, '127.0.0.1');
    strict.strictEqual(ctx.serverPort, 3307);
  });

  await it('should return server context for socketPath', () => {
    const ctx = tracing.getServerContext({ socketPath: '/tmp/mysql.sock' });
    strict.strictEqual(ctx.serverAddress, '/tmp/mysql.sock');
    strict.strictEqual(ctx.serverPort, undefined);
  });

  await it('should default to localhost:3306', () => {
    const ctx = tracing.getServerContext({});
    strict.strictEqual(ctx.serverAddress, 'localhost');
    strict.strictEqual(ctx.serverPort, 3306);
  });
});
