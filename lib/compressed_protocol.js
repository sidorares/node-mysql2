'use strict';

// connection mixins
// implementation of http://dev.mysql.com/doc/internals/en/compression.html

const zlib = require('zlib');
const PacketParser = require('./packet_parser.js');

// the server sends payloads shorter than this uncompressed, and so does
// the client: deflate cannot shrink them
const MIN_COMPRESS_LENGTH = 50;
// zlib work below these sizes takes a few microseconds, less than the trip
// through the thread pool and the queue behind it, so it runs inline;
// larger payloads stay asynchronous and keep the event loop free
const MAX_SYNC_INFLATE_LENGTH = 16384;
const MAX_SYNC_DEFLATE_LENGTH = 4096;

class Queue {
  constructor() {
    this._queue = [];
    this._running = false;
  }

  push(fn) {
    this._queue.push(fn);
    if (!this._running) {
      this._running = true;
      process.nextTick(() => this._next());
    }
  }

  _next() {
    const task = this._queue.shift();
    if (!task) {
      this._running = false;
      return;
    }
    task({
      done: () => process.nextTick(() => this._next()),
    });
  }
}

function handleCompressedPacket(packet) {
  const connection = this;
  const deflatedLength = packet.readInt24();
  const body = packet.readBuffer();
  // the packet parser reuses its packet instance, so everything needed after
  // the queued (asynchronous) inflate step must be read out now
  const numPackets = packet.numPackets;

  // an inline step is only in order while no earlier packet is still
  // being inflated on the thread pool
  if (!connection.inflateQueue._running) {
    if (deflatedLength === 0) {
      connection._bumpCompressedSequenceId(numPackets);
      connection._inflatedPacketsParser.execute(body);
      return;
    }
    if (deflatedLength <= MAX_SYNC_INFLATE_LENGTH) {
      let data;
      try {
        data = zlib.inflateSync(body, { maxOutputLength: deflatedLength });
      } catch (err) {
        connection._handleNetworkError(err);
        return;
      }
      connection._bumpCompressedSequenceId(numPackets);
      connection._inflatedPacketsParser.execute(data);
      return;
    }
  }

  if (deflatedLength !== 0) {
    connection.inflateQueue.push((task) => {
      zlib.inflate(body, { maxOutputLength: deflatedLength }, (err, data) => {
        if (err) {
          connection._handleNetworkError(err);
          return;
        }
        connection._bumpCompressedSequenceId(numPackets);
        connection._inflatedPacketsParser.execute(data);
        task.done();
      });
    });
  } else {
    connection.inflateQueue.push((task) => {
      connection._bumpCompressedSequenceId(numPackets);
      connection._inflatedPacketsParser.execute(body);
      task.done();
    });
  }
}

function writeCompressedFrame(
  connection,
  seqId,
  packetLen,
  buffer,
  compressed
) {
  const compressHeader = Buffer.allocUnsafe(7);
  const compressedLength = compressed === null ? packetLen : compressed.length;
  if (compressed === null) {
    // http://dev.mysql.com/doc/internals/en/uncompressed-payload.html
    // To send an uncompressed payload:
    //   - set length of payload before compression to 0
    //   - the compressed payload contains the uncompressed payload instead.
    packetLen = 0;
  }
  compressHeader.writeUInt8(compressedLength & 0xff, 0);
  compressHeader.writeUInt16LE(compressedLength >> 8, 1);
  compressHeader.writeUInt8(seqId, 3);
  compressHeader.writeUInt8(packetLen & 0xff, 4);
  compressHeader.writeUInt16LE(packetLen >> 8, 5);
  connection.writeUncompressed(compressHeader);
  connection.writeUncompressed(compressed === null ? buffer : compressed);
}

function writeCompressed(buffer) {
  // http://dev.mysql.com/doc/internals/en/example-several-mysql-packets.html
  // note: sending a MySQL Packet of the size 2^24−5 to 2^24−1 via compression
  // leads to at least one extra compressed packet.
  // (this is because "length of the packet before compression" need to fit
  // into 3 byte unsigned int. "length of the packet before compression" includes
  // 4 byte packet header, hence 2^24−5)
  const MAX_COMPRESSED_LENGTH = 16777210;
  let start;
  if (buffer.length > MAX_COMPRESSED_LENGTH) {
    for (start = 0; start < buffer.length; start += MAX_COMPRESSED_LENGTH) {
      writeCompressed.call(
        this,
        buffer.slice(start, start + MAX_COMPRESSED_LENGTH)
      );
    }
    return;
  }

  const connection = this;

  const packetLen = buffer.length;
  const seqId = connection.compressedSequenceId;
  connection._bumpCompressedSequenceId(1);

  // an inline write is only in order while no earlier packet is still
  // being deflated on the thread pool
  if (!connection.deflateQueue._running) {
    if (packetLen < MIN_COMPRESS_LENGTH) {
      writeCompressedFrame(connection, seqId, packetLen, buffer, null);
      return;
    }
    if (packetLen <= MAX_SYNC_DEFLATE_LENGTH) {
      let compressed;
      try {
        compressed = zlib.deflateSync(buffer);
      } catch (err) {
        connection._handleFatalError(err);
        return;
      }
      writeCompressedFrame(
        connection,
        seqId,
        packetLen,
        buffer,
        compressed.length < packetLen ? compressed : null
      );
      return;
    }
  }

  // seqqueue is used here because zlib async execution is routed via thread pool
  // internally and when we have multiple compressed packets arriving we need
  // to assemble uncompressed result sequentially
  connection.deflateQueue.push((task) => {
    zlib.deflate(buffer, (err, compressed) => {
      if (err) {
        connection._handleFatalError(err);
        return;
      }
      writeCompressedFrame(
        connection,
        seqId,
        packetLen,
        buffer,
        compressed.length < packetLen ? compressed : null
      );
      task.done();
    });
  });
}

function enableCompression(connection) {
  connection._lastWrittenPacketId = 0;
  connection._lastReceivedPacketId = 0;

  connection._handleCompressedPacket = handleCompressedPacket;
  connection._inflatedPacketsParser = new PacketParser((p) => {
    connection.handlePacket(p);
  }, 4);
  connection._inflatedPacketsParser._lastPacket = 0;
  connection.packetParser = new PacketParser((packet) => {
    connection._handleCompressedPacket(packet);
  }, 7);

  connection.writeUncompressed = connection.write;
  connection.write = writeCompressed;

  connection.inflateQueue = new Queue();
  connection.deflateQueue = new Queue();
}

module.exports = {
  enableCompression: enableCompression,
  Queue: Queue,
};
