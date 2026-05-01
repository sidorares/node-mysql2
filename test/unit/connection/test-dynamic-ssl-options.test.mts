import EventEmitter from 'node:events';
import { describe, it, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import ConnectionConfig from '../../../lib/connection_config.js';

type SslFactoryResult = {
  ca?: string;
  cert?: string;
  key?: string;
  rejectUnauthorized?: boolean;
};

function createMockConnection(
  ssl:
    | false
    | ((
        config: ConnectionConfig
      ) => SslFactoryResult | Promise<SslFactoryResult>)
) {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectTimeout: 0,
    ssl,
  });

  const mockStream = Object.assign(new EventEmitter(), {
    write: () => true,
    end: () => {},
    destroy() {
      this.destroyed = true;
    },
    destroyed: false,
    setKeepAlive: () => {},
    setNoDelay: () => {},
    removeAllListeners: EventEmitter.prototype.removeAllListeners,
  });

  config.stream = mockStream;
  config.isServer = true;

  return new BaseConnection({ config });
}

await describe('dynamic SSL options', async () => {
  await it('should resolve SSL options from a synchronous function', async () => {
    let capturedSslFactoryArg: ConnectionConfig | undefined;
    const connection = createMockConnection((config) => {
      capturedSslFactoryArg = config;
      return {
        ca: 'ca-data',
        rejectUnauthorized: false,
      };
    });

    let capturedSslConfig: SslFactoryResult | undefined;
    connection._onSslConfig = (sslConfig, onSecure) => {
      capturedSslConfig = sslConfig;
      onSecure();
    };

    await new Promise<void>((resolve, reject) => {
      connection.startTLS((err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    strict.equal(capturedSslFactoryArg, connection.config);
    strict.deepEqual(capturedSslConfig, {
      ca: 'ca-data',
      rejectUnauthorized: false,
    });
  });

  await it('should resolve SSL options from an asynchronous function', async () => {
    const connection = createMockConnection(async () => ({
      ca: 'async-ca',
    }));

    let capturedSslConfig: SslFactoryResult | undefined;
    connection._onSslConfig = (sslConfig, onSecure) => {
      capturedSslConfig = sslConfig;
      onSecure();
    };

    await new Promise<void>((resolve, reject) => {
      connection.startTLS((err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    strict.deepEqual(capturedSslConfig, {
      ca: 'async-ca',
    });
  });

  await it('should pass factory rejections to onSecure callback', async () => {
    const connection = createMockConnection(async () => {
      throw new Error('dynamic ssl failed');
    });

    let onSslConfigCalled = false;
    connection._onSslConfig = (_sslConfig, _onSecure) => {
      onSslConfigCalled = true;
    };

    await new Promise<void>((resolve) => {
      connection.startTLS((err: unknown) => {
        strict.ok(err instanceof Error);
        strict.equal((err as Error).message, 'dynamic ssl failed');
        resolve();
      });
    });

    strict.equal(onSslConfigCalled, false);
  });
});
