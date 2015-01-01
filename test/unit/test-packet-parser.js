var PacketParser = require('../../lib/packet_parser.js');
var assert = require('assert');

var pp;
var packets = [];
function reset() {
  pp = new PacketParser(handler);
  packets = [];
}
var handler = function(p) {
  p.dump();
  packets.push(p);
}

function execute(str, verify) {
  reset();
  var buffers = str.split('|').map(function(sb) { return sb.split(',').map(Number) });
  console.log(str);
  for(var i=0; i < buffers.length; ++i)
    pp.execute(new Buffer(buffers[i]));
  verify();
}

function p123() {
  assert(packets.length === 1);
  assert(packets[0].length() === 10);
  assert(packets[0].sequenceId === 123);
}

function p120_121() {
  packets.forEach(function(p) { p.dump });
  assert(packets.length === 2);
  assert(packets[0].length() === 0);
  assert(packets[0].sequenceId === 120);
  assert(packets[1].length() === 0);
  assert(packets[1].sequenceId === 121);
}

execute("10,0,0,123,1,2,3,4,5,6,7,8,9,0", p123);
execute("10,0,0,123|1,2,3,4,5,6,7,8,9,0", p123);
execute("10,0,0|123,1,2,3,4,5,6,7,8,9,0", p123);
execute("10|0,0|123,1,2,3,4,5,6,7,8,9,0", p123);
execute("10,0,0,123,1|2,3,4,5,6|7,8,9,0", p123);
execute("10,0,0,123,1,2|,3,4,5,6|7,8,9,0", p123);

function p42() {
  assert(packets.length === 1);
  assert(packets[0].length() === 0);
  assert(packets[0].sequenceId === 42);
}

execute("0,0,0,42", p42);
execute("0|0,0,42", p42);
execute("0,0|0,42", p42);
execute("0,0|0|42", p42);
execute("0,0,0|42", p42);
execute("0|0|0|42", p42);
execute("0|0,0|42", p42);

// two zero length packets
execute("0,0,0,120,0,0,0,121", p120_121);
execute("0,0,0|120|0|0|0|121", p120_121);

var p122_123 = function() {
  assert(packets.length === 2);
  assert(packets[0].length() === 5);
  assert(packets[0].sequenceId === 122);
  assert(packets[1].length() === 6);
  assert(packets[1].sequenceId === 123);
}
// two non-zero length packets
execute("5,0,0,122,1,2,3,4,5,6,0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5|6,0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4|5|6|0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6|0,0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0|0,123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0|123,1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0,123|1,2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3,4,5,6", p122_123);
execute("5,0,0,122,1,2,3,4,5,6,0,0,123,1|2,3|4,5,6", p122_123);
