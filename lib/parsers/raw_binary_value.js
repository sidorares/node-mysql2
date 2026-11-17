'use strict';

const Types = require('../constants/types.js');

const fixedWidths = new Map([
  [Types.TINY, 1],
  [Types.SHORT, 2],
  [Types.YEAR, 2],
  [Types.INT24, 4],
  [Types.LONG, 4],
  [Types.FLOAT, 4],
  [Types.LONGLONG, 8],
  [Types.DOUBLE, 8],
]);

function fixedBinaryWidth(columnType) {
  return fixedWidths.get(columnType);
}

function readRawBinaryValue(packet, columnType) {
  const width = fixedBinaryWidth(columnType);
  return width === undefined
    ? packet.readLengthCodedBuffer()
    : packet.readBuffer(width);
}

module.exports = { fixedBinaryWidth, readRawBinaryValue };
