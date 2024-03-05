'use strict';

const { assert } = require('poku');
const TextRow = require('../../../lib/packets/text_row.js');

// simple
let packet = TextRow.toPacket(['Hello', 'World'], 'cesu8');
assert.equal(packet.buffer.toString('hex', 4), '0548656c6c6f05576f726c64');

// Russian (unicode)
packet = TextRow.toPacket(['Ну,', 'погоди!'], 'cesu8');
assert.equal(
  packet.buffer.toString('hex', 4),
  '05d09dd1832c0dd0bfd0bed0b3d0bed0b4d0b821',
);

// Long > 256 byte
packet = TextRow.toPacket(
  [
    'Пушкин родился 26 мая (6 июня) 1799 г. в Москве. В метрической книге церкви Богоявления в Елохове (сейчас на её месте находится Богоявленский собор в Елохове) на дату 8 июня 1799 г.',
  ],
  'cesu8',
);
assert.equal(
  packet.buffer.toString('hex', 4),
  'fc3801d09fd183d188d0bad0b8d0bd20d180d0bed0b4d0b8d0bbd181d18f20323620d0bcd0b0d18f20283620d0b8d18ed0bdd18f29203137393920d0b32e20d0b220d09cd0bed181d0bad0b2d0b52e20d09220d0bcd0b5d182d180d0b8d187d0b5d181d0bad0bed0b920d0bad0bdd0b8d0b3d0b520d186d0b5d180d0bad0b2d0b820d091d0bed0b3d0bed18fd0b2d0bbd0b5d0bdd0b8d18f20d0b220d095d0bbd0bed185d0bed0b2d0b52028d181d0b5d0b9d187d0b0d18120d0bdd0b020d0b5d19120d0bcd0b5d181d182d0b520d0bdd0b0d185d0bed0b4d0b8d182d181d18f20d091d0bed0b3d0bed18fd0b2d0bbd0b5d0bdd181d0bad0b8d0b920d181d0bed0b1d0bed18020d0b220d095d0bbd0bed185d0bed0b2d0b52920d0bdd0b020d0b4d0b0d182d183203820d0b8d18ed0bdd18f203137393920d0b32e',
);
