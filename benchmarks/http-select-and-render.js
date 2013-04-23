var http   = require('http');
var fs     = require('fs');
var common = require('../test/common');
var url = require('url');

var conn = common.createConnection();
var render = common.createTemplate();
var port = process.env.PORT;

http.createServer(function(req, res) {
  var q = url.parse(req.url, true);
  if (q.pathname == '/render') {

    var sql = q.query.q;
    var n = q.query.n;
    var rowsTotal = [];
    var doQueries = function(number) {
      if (number === 0) {
        var body = render({ records: rowsTotal});
        res.writeHead(200, {
          'Content-Length': body.length,
          'Content-Type': 'text/html' }
        );
        res.end(body);
      } else {
        conn.query(sql, function(err, rows) {
          // TODO: handle error
          rowsTotal = rowsTotal.concat(rows);
          doQueries(number-1);
        });
      }
    };
    doQueries(n);

  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(port || 1234);
