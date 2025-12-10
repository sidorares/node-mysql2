'use strict';
const { assert } = require('poku');
const BaseConnection = require('../../../lib/base/connection.js');
const ConnectionConfig = require('../../../lib/connection_config.js');
const EventEmitter = require('events');

// Helper to create a mock connection without actually connecting
function createMockConnection() {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
  });

  // Create a minimal mock stream
  const mockStream = new EventEmitter();
  mockStream.write = () => true;
  mockStream.end = () => {};
  mockStream.destroy = () => {
    mockStream.destroyed = true;
  };
  mockStream.destroyed = false;
  mockStream.setKeepAlive = () => {};
  mockStream.setNoDelay = () => {};

  config.stream = mockStream;
  config.isServer = true; // Prevent handshake command

  return new BaseConnection({ config });
}

// Test 1: Initial state
const conn1 = createMockConnection();
const initialState = conn1.state;
assert.ok(
  initialState === 'disconnected' || initialState === 'protocol_handshake',
  `Initial state should be disconnected or protocol_handshake, got: ${initialState}`
);

// Test 2: Error state when fatal error occurs
const conn2 = createMockConnection();
conn2._fatalError = new Error('Fatal error');
assert.strictEqual(
  conn2.state,
  'error',
  'State should be "error" when _fatalError is set'
);

// Test 3: Error state when protocol error occurs
const conn3 = createMockConnection();
conn3._protocolError = new Error('Protocol error');
assert.strictEqual(
  conn3.state,
  'error',
  'State should be "error" when _protocolError is set'
);

// Test 4: Disconnected state when closing
const conn4 = createMockConnection();
conn4._closing = true;
assert.strictEqual(
  conn4.state,
  'disconnected',
  'State should be "disconnected" when _closing is true'
);

// Test 5: Disconnected state when stream is destroyed
const conn5 = createMockConnection();
conn5.stream.destroy(); // Call destroy() method instead of setting destroyed property
assert.strictEqual(
  conn5.state,
  'disconnected',
  'State should be "disconnected" when stream is destroyed'
);

// Test 6: Connected state when handshake is complete but not authorized
const conn6 = createMockConnection();
conn6._handshakePacket = { connectionId: 123 }; // Simulate handshake completion
assert.strictEqual(
  conn6.state,
  'connected',
  'State should be "connected" when handshake is complete but not authorized'
);

// Test 7: Authenticated state when authorized
const conn7 = createMockConnection();
conn7.authorized = true;
assert.strictEqual(
  conn7.state,
  'authenticated',
  'State should be "authenticated" when authorized is true'
);

// Test 8: Error state has highest priority (over authenticated and closing)
const conn8 = createMockConnection();
conn8.authorized = true;
conn8._closing = true;
conn8._fatalError = new Error('Fatal error');
assert.strictEqual(
  conn8.state,
  'error',
  'State should be "error" even when authorized and closing (error has highest priority)'
);

// Test 9: Closing state has higher priority than authenticated
const conn9 = createMockConnection();
conn9.authorized = true;
conn9._closing = true;
assert.strictEqual(
  conn9.state,
  'disconnected',
  'State should be "disconnected" even when authorized (closing has higher priority)'
);

// Test 10: Protocol error has same priority as fatal error
const conn10 = createMockConnection();
conn10.authorized = true;
conn10._protocolError = new Error('Protocol error');
assert.strictEqual(
  conn10.state,
  'error',
  'State should be "error" when _protocolError is set, regardless of authorization'
);

// Test 11: Authenticated takes priority over connected
const conn11 = createMockConnection();
conn11._handshakePacket = { connectionId: 123 };
conn11.authorized = true;
assert.strictEqual(
  conn11.state,
  'authenticated',
  'State should be "authenticated" when both handshake complete and authorized (authenticated has priority)'
);

// Cleanup
[
  conn1,
  conn2,
  conn3,
  conn4,
  conn5,
  conn6,
  conn7,
  conn8,
  conn9,
  conn10,
  conn11,
].forEach((conn) => {
  try {
    conn.destroy();
  } catch (e) {
    // Ignore cleanup errors
  }
});
