import { describe, it, strict } from 'poku';
import PrepareStatement from '../../../lib/packets/prepare_statement.js';

const UTF8MB4_CHARSET = 224; // utf8mb4_unicode_ci
const LATIN1_CHARSET = 8; // latin1_swedish_ci

describe('COM_STMT_PREPARE serialization', () => {
  it('should serialize utf8 SQL of varied lengths exactly', () => {
    for (const sql of ['SELECT ?', 'SELECT "é🚀" -- ' + 'x'.repeat(5000)]) {
      const packet = new PrepareStatement(sql, UTF8MB4_CHARSET).toPacket();

      strict.strictEqual(packet.end, packet.buffer.length);
      packet.offset = 4;
      strict.strictEqual(packet.readInt8(), 0x16); // COM_STMT_PREPARE
      strict.strictEqual(packet.readString(undefined, 'utf8'), sql);
    }
  });

  it('should serialize SQL for a non-utf8 encoding', () => {
    const sql = 'SELECT "café"';
    const packet = new PrepareStatement(sql, LATIN1_CHARSET).toPacket();

    strict.strictEqual(packet.end, packet.buffer.length);
    packet.offset = 4;
    strict.strictEqual(packet.readInt8(), 0x16);
    strict.strictEqual(packet.readString(undefined, 'latin1'), sql);
  });
});
