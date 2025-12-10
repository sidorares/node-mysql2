'use strict';

const assert = require('assert');
// Corrected path based on file structure: ../common.test.cjs
// const {test} = require('../common.test.cjs'); 
const { test } = require('poku'); 
const mysql = require('../..');
const process = require('process'); // Ensure process is available

// Helper function to create a pool using test environment variables
function createTestPool(options) {
  const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ...options,
  };
  return mysql.createPool(config);
}

// --- Test Case ---

test('Pool emits connectionQueueAcquired event and reports correct queue depth', function (done) {
  // 1. Setup Pool: Small limit to force queuing
  const connectionLimit = 2;
  const pool = createTestPool({
    connectionLimit: connectionLimit,
    waitForConnections: true,
    queueLimit: 0, // No queue limit
  });

  let acquiredConnections = [];
  let queuedAcquiredEvents = [];
  const expectedQueueDepths = [1, 0]; // Expected depth after 1st dequeue, then 2nd

  // 2. Listen for the new event
  pool.on('connectionQueueAcquired', (event) => {
    queuedAcquiredEvents.push(event);
  });
  
  // Helper to get a connection and wrap it in a Promise for control flow
  const getConnectionPromise = () => new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      
      // Store initial connections (1 and 2) for later release
      // We rely on the order of acquisition for this.
      acquiredConnections.push(conn);
      
      resolve(conn);
    });
  });

  // --- Execution Flow using Promises for reliability ---
  
  let initialConnection1;
  let initialConnection2;

  // 1 & 2. Saturate the pool (Acquire 2 connections)
  Promise.all([
    getConnectionPromise().then(c => initialConnection1 = c),
    getConnectionPromise().then(c => initialConnection2 = c)
  ])
  .then(() => {
    // 3 & 4. Queue requests (Request 2 more connections, they must wait)
    // These will use the general callback logic below
    pool.getConnection(queuedConnectionCallback);
    pool.getConnection(queuedConnectionCallback);
    
    // Give time for the requests to enter the queue before releasing connections
    return new Promise(r => setTimeout(r, 50)); 
  })
  .then(() => {
    // 5. Trigger Dequeue: Release the initial active connections
    // This is safe because the Promise.all ensures initialConnection1/2 are defined.
    
    // Release 1: serves Queued Request 3 (event fired, depth 1)
    initialConnection1.release(); 
    
    // Release 2: serves Queued Request 4 (event fired, depth 0)
    initialConnection2.release(); 
    
    // Wait for the final two queued connections to be acquired and their callbacks to run
    return new Promise(r => setTimeout(r, 100));
  })
  .then(() => {
    // Final Assertions and Cleanup (after all acquisitions are complete)
    assert.strictEqual(queuedAcquiredEvents.length, 2, 'Should have emitted connectionQueueAcquired exactly twice.');

    queuedAcquiredEvents.forEach((event, index) => {
      const expectedDepth = expectedQueueDepths[index];
      assert.strictEqual(
        event.queueDepth,
        expectedDepth,
        `Event ${index + 1} reported queueDepth ${event.queueDepth}, expected ${expectedDepth}.`
      );
      assert.ok(event.connection, `Event ${index + 1} is missing the connection object.`);
      
      // Release connections acquired from the queue
      event.connection.release();
    });
    
    pool.end(done);
  })
  .catch(err => {
    pool.end(() => done(err));
  });
});

// For the purposes of this test, we don't need the queued connections to be stored,
// as they are handled and released inside the final Promise block via the event payload.
function queuedConnectionCallback(err, conn) {
    if (err) throw err
}
   