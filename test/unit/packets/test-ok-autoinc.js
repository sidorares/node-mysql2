var assert     = require('assert');
var packets    = require('../../../lib/packets/index.js');

var packet = packets.OK.toPacket({affectedRows: 0, insertId: 1});

// 5 bytes for an OK packet, plus one byte to store affectedRows plus one byte to store the insertId
assert.equal( packet.length(), 11,
    'OK packets with 0 affectedRows and a minimal insertId should be '+
    '11 bytes long, got '+packet.length()+' byte(s)' );
