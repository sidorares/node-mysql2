var p = new Buffer(65535*10);
var offset = 0;
var plen = 17;
while(1) {
  if (p.length - offset >= plen+4) {
    p[offset] = plen;
    p[offset+1] = 0;
    p[offset+2] = 0;
    p[offset+3] = 123; // packet id
    offset += plen + 4;
  } else {
    p[offset] = p.length - offset - 4;
    p[offset+1] = 0;
    p[offset+2] = 0;
    p[offset+3] = 123; // packet id
    break;
  }
}

var PP = require('../../lib/packet_parser.js');

var count = 0;
var cc = 0;

function handler(packet) {
  //console.log(packet.length(), packet.sequenceId);
  cc += packet.sequenceId
  count++;
}

var chunks = [];
var csize = parseInt(process.argv[2]);
for (var o=0; o + csize < p.length; o += csize) {
  chunks.push(p.slice(o, o+csize));
}

var start = process.hrtime();
for (var i=0; i < 50; ++i) {
  var packetParser = new PP(handler);
  for (var j=0; j < chunks.length; ++j) {
    packetParser.execute(chunks[j]);
  }
}
var end = process.hrtime(start);
var dur = end[0]*1e9 + end[1];

console.log(1e9*count/dur, count, cc);
