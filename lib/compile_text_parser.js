var vm = require('vm');

function compile(fields) {
  var result = [];
  var i=0;
  result.push('function TextRow(packet) {');
  for (i = 0; i < fields.length; i++) {
    result.push('  this[\'' + fields[i].name + '\'] = ' + readCodeFor(fields[i].columnType));
  }
  result.push('} TextRow;');
  var src = result.join('\n');
  return vm.runInNewContext(src);
}

function readCodeFor(type) {
  switch(type) {
  case 1:
  case 2:
  case 3:
  case 9:
  case 13:
    return "packet.parseLengthCodedInt();";
  // TODO: implement parseFloat
  //case 4:
  //case 5:
  //  return "packet.parseFloat();";
  case 6:
    return "null;";

  default:
    return "packet.readLengthCodedString(); //" + type;
  }
}

module.exports = compile;
