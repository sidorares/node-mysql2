import EventEmitter from 'node:events';
import { assert, test } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import ConnectionConfig from '../../../lib/connection_config.js';

// Helper to create a mock connection without actually connecting
function createMockConnection() {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectTimeout: 0,
  });

  // Create a minimal mock stream
  const mockStream = Object.assign(new EventEmitter(), {
    write: () => true,
    end: () => {},
    destroy() {
      this.destroyed = true;
    },
    destroyed: false,
    setKeepAlive: () => {},
    setNoDelay: () => {},
  });

  config.stream = mockStream;
  config.isServer = true; // Prevent handshake command

  return new BaseConnection({ config });
}

test('should return disconnected state when no stream exists', () => {
  const conn = createMockConnection();
  conn.stream = null;
  assert.strictEqual(
    conn.state,
    'disconnected',
    'State should be "disconnected" when stream is null'
  );
});

test('should return protocol_handshake state when stream exists but handshake not complete', () => {
  const conn = createMockConnection();
  assert.strictEqual(
    conn.state,
    'protocol_handshake',
    'State should be "protocol_handshake" when stream exists but handshake not complete'
  );
});

test('should return error state when fatal error occurs', () => {
  const conn = createMockConnection();
  conn._fatalError = new Error('Fatal error');
  assert.strictEqual(
    conn.state,
    'error',
    'State should be "error" when _fatalError is set'
  );
});

test('should return error state when protocol error occurs', () => {
  const conn = createMockConnection();
  conn._protocolError = new Error('Protocol error');
  assert.strictEqual(
    conn.state,
    'error',
    'State should be "error" when _protocolError is set'
  );
});

test('should return disconnected state when closing', () => {
  const conn = createMockConnection();
  conn._closing = true;
  assert.strictEqual(
    conn.state,
    'disconnected',
    'State should be "disconnected" when _closing is true'
  );
});

test('should return disconnected state when stream is destroyed', () => {
  const conn = createMockConnection();
  conn.stream.destroy();
  assert.strictEqual(
    conn.state,
    'disconnected',
    'State should be "disconnected" when stream is destroyed'
  );
});

test('should return connected state when handshake is complete but not authorized', () => {
  const conn = createMockConnection();
  conn._handshakePacket = { connectionId: 123 };
  assert.strictEqual(
    conn.state,
    'connected',
    'State should be "connected" when handshake is complete but not authorized'
  );
});

test('should return authenticated state when authorized', () => {
  const conn = createMockConnection();
  conn.authorized = true;
  assert.strictEqual(
    conn.state,
    'authenticated',
    'State should be "authenticated" when authorized is true'
  );
});

test('should return error state even when authorized and closing (error has highest priority)', () => {
  const conn = createMockConnection();
  conn.authorized = true;
  conn._closing = true;
  conn._fatalError = new Error('Fatal error');
  assert.strictEqual(
    conn.state,
    'error',
    'State should be "error" even when authorized and closing (error has highest priority)'
  );
});

test('should return disconnected state even when authorized (closing has higher priority)', () => {
  const conn = createMockConnection();
  conn.authorized = true;
  conn._closing = true;
  assert.strictEqual(
    conn.state,
    'disconnected',
    'State should be "disconnected" even when authorized (closing has higher priority)'
  );
});

test('should return error state when protocol error is set, regardless of authorization', () => {
  const conn = createMockConnection();
  conn.authorized = true;
  conn._protocolError = new Error('Protocol error');
  assert.strictEqual(
    conn.state,
    'error',
    'State should be "error" when _protocolError is set, regardless of authorization'
  );
});

test('should return authenticated state when both handshake complete and authorized (authenticated has priority)', () => {
  const conn = createMockConnection();
  conn._handshakePacket = { connectionId: 123 };
  conn.authorized = true;
  assert.strictEqual(
    conn.state,
    'authenticated',
    'State should be "authenticated" when both handshake complete and authorized (authenticated has priority)'
  );
});
