"handshake handshake_response query resultset_header column_definition text_row binary_row prepare_statement prepared_statement_header execute".split(' ').forEach(function(name) {
  var ctor = require('./' + name);
  module.exports[ctor.name] = ctor;
});
