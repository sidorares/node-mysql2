// Copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const errors = require('../../lib/constants/errors');
const common = require('../common');
const connection = common.createConnection();
const assert = require('assert');

const customWaitTimeout = 1; // seconds

let error;

connection.on('error', err => {
  error = err;

  connection.close();
});

connection.query(`set wait_timeout=${customWaitTimeout}`, () => {
  setTimeout(() => {}, customWaitTimeout * 1000 * 2);
});

process.on('uncaughtException', err => {
  // The ERR Packet is only sent by MySQL server 8.0.24 or higher, so we
  // need to account for the fact it is not sent by older server versions.
  if (err.code !== 'ERR_ASSERTION') {
    throw err;
  }

  assert.equal(error.message, 'Connection lost: The server closed the connection.');
  assert.equal(error.code, 'PROTOCOL_CONNECTION_LOST');
});

process.on('exit', () => {
  assert.equal(error.message, 'The client was disconnected by the server because of inactivity. See wait_timeout and interactive_timeout for configuring this behavior.');
  assert.equal(error.code, errors.ER_CLIENT_INTERACTION_TIMEOUT);
});
