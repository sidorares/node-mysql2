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

var chunks = [];
function benchmarkPackets() {

  if (chunks.length === 0) {
    for (var csize = 1; csize < plen; ++csize) {
      for (var o=0; o + csize < p.length; o += csize) {
         chunks.push(p.slice(o, o+csize));
      }
    }
  }

  console.log(chunks);

  var count = 0;
  var cc = 0;

  function handler(packet) {
    //console.log(packet.length(), packet.sequenceId);
    cc += packet.sequenceId
    count++;
  }

  var start = process.hrtime();
  var packetParser = new PP(handler);
  for (var j=0; j < chunks.length; ++j) {
    packetParser.execute(chunks[j]);
  }
  return count;
}

module.exports = function(next) {
  /*
  var c = benchmarkPackets();
  */
  next();
}

module.exports.comment = 'WIP - not implemented yet | packet_parser.execute() in chunks of length 1..packet_length x 156035 packets';
module.exports.toSpeed = function(time, timeError) {
  console.log('packet_parser.execute() toSpeed()', time, timeError);
  var value = 1e9*5*156975 / time;
  return {
    value: value,
    error: value*(timeError/time),
    units: 'packets/second'
  };
};
