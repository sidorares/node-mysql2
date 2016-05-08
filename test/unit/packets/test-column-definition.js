var assert           = require('assert');
var ColumnDefinition = require('../../../lib/packets/column_definition.js');

var sequenceId = 5;

// simple
var packet = ColumnDefinition.toPacket({
  catalog: 'def',
  schema: 'some_db',
  name: 'some_col',
  orgName: 'some_col',
  table: 'some_tbl',
  orgTable: 'some_tbl',

  characterSet: 0x21,
  columnLength: 500,
  flags: 32896,
  columnType: 0x8,
  decimals: 1
}, sequenceId);
assert.equal(
  packet.buffer.toString('hex', 4),
  '0364656607736f6d655f646208736f6d655f74626c08736f6d655f74626c08736f6d655f636f6c08736f6d655f636f6c0c2100f4010000088080010000'
);

// Russian
var packet = ColumnDefinition.toPacket({
  catalog: 'def',
  schema: 's_погоди',
  name: 'n_погоди',
  orgName: 'on_погоди',
  table: 't_погоди',
  orgTable: 'ot_погоди',

  characterSet: 0x21,
  columnLength: 500,
  flags: 32896,
  columnType: 0x8,
  decimals: 1
}, sequenceId);
assert.equal(
  packet.buffer.toString('hex', 4),
  '036465660e735fd0bfd0bed0b3d0bed0b4d0b80e745fd0bfd0bed0b3d0bed0b4d0b80f6f745fd0bfd0bed0b3d0bed0b4d0b80e6e5fd0bfd0bed0b3d0bed0b4d0b80f6f6e5fd0bfd0bed0b3d0bed0b4d0b80c2100f4010000088080010000'
);

// Spec (from example: https://dev.mysql.com/doc/internals/en/protocoltext-resultset.html)
var packet = ColumnDefinition.toPacket({
  catalog: 'def',
  schema: '',
  name: '@@version_comment',
  orgName: '',
  table: '',
  orgTable: '',

  characterSet: 0x08, // latin1_swedish_ci
  columnLength: 0x1c,
  flags: 0,
  columnType: 0xfd,
  decimals: 0x1f
}, sequenceId);
assert.equal(
    packet.buffer.toString('hex', 4),
    '0364656600000011404076657273696f6e5f636f6d6d656e74000c08001c000000fd00001f0000'
);
