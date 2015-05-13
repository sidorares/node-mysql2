var Packet = require('./lib/packets/packet.js');
var Packets = require('./lib/packets/index.js');


var SAParser = (function(){ return function BinaryRow(packet) {
   var statusByte = packet.readInt8();
   var nullBitmaskByte0 = packet.readInt8();
   // "billing_is_pickup_location": LONGLONG
   console.log('Null bitmap:', nullBitmaskByte0);
   this["billing_is_pickup_location"] = packet.readSInt64();
   // "shipping_address1": VAR_STRING
   if (nullBitmaskByte0 & 8)
     this["shipping_address1"] = null;
   else
     this["shipping_address1"] = packet.readLengthCodedString();
   // "shipping_fk_pickup_location": LONG
   if (nullBitmaskByte0 & 16)
     this["shipping_fk_pickup_location"] = null;
   else
     this["shipping_fk_pickup_location"] = packet.readSInt32();
   // "billing_is_pickup_location": LONGLONG
   debugger;
   this["billing_is_pickup_location"] = packet.readSInt64();
}; })()

function parse(s) {
  var raw = new Buffer(s, 'hex');
  var p = new Packet(0, raw, 0, raw.end);
  return new SAParser(p);
}

function parseC(s) {
  var raw = new Buffer(s, 'hex');
  var p = new Packet(0, raw, 0, raw.end);
  var c new Packets.ColumnDefinition(p);
}

console.log(parseC('036465660000001a62696c6c696e675f69735f7069636b75705f6c6f636174696f6e000c3f0001000000030100000000'));
console.log(parse('0010010000001754657374204176656e756520426c64673a34383137333601000000'));
console.log(parse('0010000000001754657374204176656e756520426c64673a35353830333200000000'));
